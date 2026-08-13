import { useMutation } from '@tanstack/react-query';
import { CreditCard, TimerReset } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { confirmBooking } from '../../api/bookings.api';
import { initiatePayment } from '../../api/payments.api';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { useSeatLock } from '../../hooks/useSeatLock';
import { useSeatSelectionStore } from '../../store/seat-selection.store';
import { formatCurrency, formatTimer } from '../../utils/formatters';

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function CheckoutPage() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const { selectedSeats, lockExpiresAt } = useSeatSelectionStore();
  const demo = bookingId === 'demo-booking';
  const { status, extend } = useSeatLock(demo ? undefined : bookingId);
  const serverSyncedExpiresAt = status.data ? new Date(Date.now() + status.data.remainingSeconds * 1000).toISOString() : null;
  const expiresAt = serverSyncedExpiresAt ?? lockExpiresAt?.toISOString();
  const remainingSeconds = useCountdownTimer(expiresAt);
  const hasLockStatus = demo || Boolean(lockExpiresAt) || status.isSuccess;
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);

  useEffect(() => {
    if (hasLockStatus && remainingSeconds !== null && remainingSeconds === 0 && expiresAt) {
      toast.error('Your seat reservation has expired');
      navigate('/events');
    }
  }, [expiresAt, hasLockStatus, navigate, remainingSeconds]);

  useEffect(() => {
    if (!demo && remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds < 60 && !extend.isPending) {
      extend.mutate(undefined, { onSuccess: () => toast.success('Seat lock extended') });
    }
  }, [demo, extend, remainingSeconds]);

  const confirmMutation = useMutation({
    mutationFn: (payload: RazorpaySuccess) =>
      confirmBooking(bookingId, {
        paymentGatewayOrderId: payload.razorpay_order_id,
        paymentGatewayPaymentId: payload.razorpay_payment_id,
        paymentGatewaySignature: payload.razorpay_signature
      }),
    onSuccess: () => navigate(`/booking/${bookingId}/confirm`),
    onError: () => toast.error('Payment verification failed')
  });

  const paymentMutation = useMutation({
    mutationFn: () => initiatePayment(bookingId),
    onSuccess: payment => {
      const Razorpay = (window as unknown as { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      if (!Razorpay) {
        toast.message(`Payment order ready: ${payment.gatewayOrderId}`);
        navigate(`/booking/${bookingId}/confirm`);
        return;
      }
      new Razorpay({
        key: payment.gatewayKey,
        amount: Number(payment.amount) * 100,
        currency: payment.currency,
        order_id: payment.gatewayOrderId,
        handler: (response: RazorpaySuccess) => confirmMutation.mutate(response)
      }).open();
    },
    onError: () => toast.error('Payment initiation failed')
  });

  return (
    <main className="page-container py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-border bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          <div className="mt-5 grid gap-3">
            {selectedSeats.map(seat => (
              <div key={seat.eventSeatId} className="flex items-center justify-between rounded-sm border border-border p-3">
                <span className="font-medium">
                  {seat.rowLabel}
                  {seat.seatNumber}
                </span>
                <span className="text-sm text-muted-foreground">{formatCurrency(Number(seat.price))}</span>
              </div>
            ))}
          </div>
        </div>
        <aside className="self-start rounded-md border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TimerReset className="h-4 w-4" aria-hidden="true" />
            Reservation timer
          </div>
          <p className="mt-2 text-4xl font-semibold tabular-nums">{formatTimer(remainingSeconds ?? 0)}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
            <span className="font-medium">Total</span>
            <span className="text-xl font-semibold">{formatCurrency(total)}</span>
          </div>
          <button
            type="button"
            disabled={paymentMutation.isPending || !selectedSeats.length}
            onClick={() => {
              if (demo) {
                navigate(`/booking/${bookingId}/confirm`);
                return;
              }
              paymentMutation.mutate();
            }}
            className="focus-ring mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Pay Now
          </button>
        </aside>
      </section>
    </main>
  );
}
