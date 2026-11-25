import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock3, CreditCard, MapPin, ShieldCheck, Ticket, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { confirmBooking, getBooking, releaseBooking } from '../../api/bookings.api';
import { completeDemoPayment, getPaymentConfig, initiatePayment, loadRazorpay } from '../../api/payments.api';
import { BookingSteps } from '../../components/booking/BookingSteps';
import { WorkflowStatus } from '../../components/common/WorkflowStatus';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { useSeatLock } from '../../hooks/useSeatLock';
import { useSeatSelectionStore } from '../../store/seat-selection.store';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { sampleEvents } from '../../utils/mockData';
import { formatCurrency, formatDateTime, formatTimer } from '../../utils/formatters';

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function CheckoutPage() {
  const { bookingId = '' } = useParams();
  return <Checkout key={bookingId} bookingId={bookingId} />;
}

function Checkout({ bookingId }: { bookingId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { preview, setPreview } = useSeatSelectionStore();
  const demo = bookingId === 'demo-booking';
  const [gatewayMessage, setGatewayMessage] = useState('');
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const booking = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId),
    enabled: Boolean(bookingId) && !demo,
    staleTime: 0
  });
  const pending = booking.data?.status === 'PENDING';
  const { data: paymentConfig, isLoading: loadingPayment } = useQuery({ queryKey: ['payment-config'], queryFn: getPaymentConfig, enabled: pending });
  const demoPayment = paymentConfig?.demo;
  const paymentAvailable = paymentConfig?.enabled;
  const { status, extend } = useSeatLock(pending ? bookingId : undefined);
  const expiresAt = demo ? preview?.expiresAt.toISOString()
    : status.data && new Date(status.dataUpdatedAt + status.data.remainingSeconds * 1000).toISOString();
  const remainingSeconds = useCountdownTimer(expiresAt);
  const seats = demo ? preview?.seats ?? [] : booking.data?.seats ?? [];
  const fee = demo ? 0 : Number(booking.data?.platformFee ?? 0);
  const subtotal = demo ? seats.reduce((sum, seat) => sum + Number(seat.price), 0) : Number(booking.data?.totalAmount ?? 0);
  const total = Number(booking.data?.amountDue ?? (subtotal + fee));
  const event = demo ? sampleEvents.find(event => event.id === preview?.eventId) : undefined;
  const eventTitle = booking.data?.eventTitle ?? event?.title;
  const eventDate = booking.data?.eventDate ?? event?.eventDate;
  const venueName = booking.data?.venueName ?? event?.venueName;
  const eventId = demo ? preview?.eventId : booking.data?.eventId;
  const expired = remainingSeconds === 0 || status.data?.isExpired;


  const saveBooking = (data: NonNullable<typeof booking.data>) => {
    queryClient.setQueryData(['booking', data.id], data);
    void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    void queryClient.invalidateQueries({ queryKey: ['seat-map', data.eventId] });
  };
  const confirmMutation = useMutation({
    mutationFn: (payload: RazorpaySuccess) =>
      confirmBooking(bookingId, {
        paymentGatewayOrderId: payload.razorpay_order_id,
        paymentGatewayPaymentId: payload.razorpay_payment_id,
        paymentGatewaySignature: payload.razorpay_signature
      }),
    onSuccess: confirmed => {
      saveBooking(confirmed);
      navigate(`/booking/${bookingId}/confirm`, { replace: true });
    },
    onError: error => setGatewayMessage(getApiErrorMessage(error, 'Payment could not be verified. Check your booking before trying again.'))
  });
  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (demoPayment) {
        const payment = await initiatePayment(bookingId);
        return completeDemoPayment(payment.paymentId);
      }
      const Razorpay = await loadRazorpay();
      const payment = await initiatePayment(bookingId);
      const checkout = new Razorpay({
        key: payment.gatewayKey,
        amount: Math.round(Number(payment.amount) * 100),
        currency: payment.currency,
        order_id: payment.gatewayOrderId,
        modal: { ondismiss: () => setGatewayOpen(false) },
        handler: (response: RazorpaySuccess) => {
          setGatewayOpen(false);
          confirmMutation.mutate(response);
        }
      });
      checkout.on?.('payment.failed', () => setGatewayMessage('The payment gateway reported a failure. You can retry from checkout.'));
      setGatewayOpen(true);
      checkout.open();
      return undefined;
    },
    onSuccess: completed => {
      if (completed) {
        saveBooking(completed);
        navigate(`/booking/${bookingId}/confirm`, { replace: true });
      }
    },
    onError: error => {
      setGatewayOpen(false);
      setGatewayMessage(getApiErrorMessage(error, 'Payment checkout could not start. Please try again.'));
    }
  });
  const releaseMutation = useMutation({
    mutationFn: async (_seatId: string | null) => {
      await releaseBooking(bookingId);
      return getBooking(bookingId);
    },
    onSuccess: (reservation, removedSeatId) => {
      saveBooking(reservation);
      if (reservation.status !== 'CANCELLED') {
        setGatewayMessage('The booking status changed. Refresh your bookings before editing this reservation.');
        return;
      }
      if (removedSeatId) {
        navigate(`/events/${reservation.eventId}/seats`, {
          replace: true,
          state: { seatIds: reservation.seats.filter(seat => seat.eventSeatId !== removedSeatId).map(seat => seat.eventSeatId) }
        });
      } else {
        toast.success('Reservation cancelled. Your seats were released.');
        navigate('/my-bookings', { replace: true });
      }
    },
    onError: error => setGatewayMessage(getApiErrorMessage(error, 'The reservation could not be released. Please try again.'))
  });

  const isPaying = gatewayOpen || paymentMutation.isPending || confirmMutation.isPending;
  const busy = isPaying || releaseMutation.isPending;
  const editable = demo ? Boolean(preview) : pending;
  const canPay = editable && !expired && Boolean(seats.length) && (demo || (status.isSuccess && !loadingPayment && paymentAvailable));

  function removeSeat(seatId: string) {
    setGatewayMessage('');
    if (demo && preview) {
      setPreview({ ...preview, seats: preview.seats.filter(seat => seat.eventSeatId !== seatId) });
    } else if (pending) {
      releaseMutation.mutate(seatId);
    }
  }

  function pay() {
    if (demo) {
      navigate(`/booking/${bookingId}/confirm`);
      return;
    }
    if (!paymentAvailable) {
      setGatewayMessage('Payment is unavailable in this installation. Your reservation is unpaid. You can release the seats below.');
      return;
    }
    setGatewayMessage('');
    paymentMutation.mutate();
  }

  if (booking.data?.status === 'CONFIRMED') {
    return <Navigate to={`/booking/${bookingId}/confirm`} replace />;
  }

  return (
    <main className="page-container booking-page">
      <BookingSteps current={2} />
      <header className="booking-heading checkout-heading">
        <div><p className="eyebrow checkout-kicker">{demo ? 'Event preview' : demoPayment ? 'Test checkout' : 'Your reservation'}</p>
        <h1>Checkout</h1></div>
        {booking.data && <WorkflowStatus status={expired ? 'EXPIRED' : booking.data.status} />}
      </header>
      {booking.isLoading && !demo && <LoadingSpinner label="Loading reservation" />}
      {booking.isError && <p className="status-note" role="alert">We couldn’t load this reservation.</p>}
      {booking.data && !pending && <p className="status-note" role="status">This reservation is {booking.data.status.toLowerCase()}.</p>}
      {expired && <p className="status-note" role="status">Your seat reservation has expired.</p>}
      {pending && status.isError && <p className="status-note" role="alert">We couldn’t verify your current seat hold.</p>}
      <div className="booking-grid">
        <section className="booking-sheet checkout-receipt" aria-label="Selected seats">
          {eventTitle && <div className="checkout-event">
            <div className="checkout-event-icon"><Ticket aria-hidden="true" size={28} /></div>
            <div><h2>{eventTitle}</h2>
            <p>{eventDate && <span><Clock3 size={15} aria-hidden="true" />{formatDateTime(eventDate)}</span>}
              {venueName && <span><MapPin size={15} aria-hidden="true" />{venueName}</span>}</p></div>
          </div>}
          <div className="checkout-seat-heading"><h2>Selected seats</h2><span>{seats.length} {seats.length === 1 ? 'seat' : 'seats'}</span></div>
          {!seats.length && !booking.isLoading && <p className="booking-hint">There are no seats in this reservation.</p>}
          <ul>
            {seats.map(seat => {
              const label = `${seat.rowLabel}${seat.seatNumber}`;
              return (
                <li className="booking-row" key={seat.eventSeatId}>
                  <span><strong>{label}</strong><small>{seat.seatType.replace(/_/g, ' ')}</small></span>
                  <span className="flex items-center gap-3">
                    {formatCurrency(Number(seat.price))}
                    {editable && !expired && <button type="button" className="icon-button focus-ring" title={`Remove seat ${label}`}
                      aria-label={`Remove seat ${label}`} disabled={busy} onClick={() => removeSeat(seat.eventSeatId)}>
                      <X size={18} aria-hidden="true" />
                    </button>}
                  </span>
                </li>
              );
            })}
          </ul>
          {pending && !expired && <p className="booking-hint">Removing a held seat returns you to the seat map to reserve your remaining selection again.</p>}
          {expired && eventId && <Link className="text-link" to={`/events/${eventId}/seats`}><ArrowLeft size={16} aria-hidden="true" /> Choose seats again</Link>}
        </section>
        <aside className="booking-summary checkout-payment" aria-label="Payment summary">
          <div className="checkout-hold" data-urgent={remainingSeconds !== null && remainingSeconds < 60}>
            <div className="timer-label"><Clock3 size={17} aria-hidden="true" /> Seat hold</div>
            <p className="timer-value" data-urgent={remainingSeconds !== null && remainingSeconds < 60} role="timer">
              {remainingSeconds === null ? '—' : formatTimer(remainingSeconds)}
            </p>
            {status.data?.canExtend && !expired && <button type="button" className="text-link focus-ring" disabled={busy || extend.isPending}
              onClick={() => extend.mutate(undefined, { onSuccess: () => toast.success('Seat hold extended'), onError: () => toast.error('Your hold could not be extended') })}>
              {extend.isPending ? 'Extending…' : 'Extend hold once'}
            </button>}
          </div>
          {fee > 0 && <div className="checkout-line"><span>Platform fee</span><span>{formatCurrency(fee)}</span></div>}
          {total < subtotal + fee && <div className="checkout-line"><span>Discount</span><span>−{formatCurrency(subtotal + fee - total)}</span></div>}
          <div className="booking-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
          <button type="button" disabled={busy || !canPay} aria-busy={isPaying} onClick={pay} className="button-dark focus-ring">
            {isPaying ? 'Processing…' : demo ? 'Preview confirmation' : demoPayment ? 'Complete test payment' : 'Pay now'}
            <CreditCard size={18} aria-hidden="true" />
          </button>
          <p className="payment-caption"><ShieldCheck size={15} aria-hidden="true" />{demo || demoPayment ? 'No money is collected' : 'Payments processed by Razorpay'}</p>
          {pending && !loadingPayment && !paymentAvailable && <p className="flow-feedback" data-tone="danger" role="status">Payment is unavailable. Your reservation is unpaid.</p>}
          {gatewayMessage && <p className="flow-feedback" data-tone="danger" role="alert">{gatewayMessage}</p>}
          {pending && <button type="button" className="text-link focus-ring mt-3" disabled={busy} onClick={() => releaseMutation.mutate(null)}>
            {releaseMutation.isPending ? 'Releasing seats…' : 'Cancel reservation'}
          </button>}
        </aside>
      </div>
    </main>
  );
}
