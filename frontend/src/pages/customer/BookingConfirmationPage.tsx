import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Clock3, Download, MapPin, TicketCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { toast } from 'sonner';
import { Link, useParams } from 'react-router-dom';
import { getBooking, getLockStatus } from '../../api/bookings.api';
import { downloadTicket, getTicketsForBooking } from '../../api/tickets.api';
import { BookingSteps } from '../../components/booking/BookingSteps';
import { TestBookingCallout } from '../../components/booking/TestBookingCallout';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useSeatSelectionStore } from '../../store/seat-selection.store';
import { formatDateTime } from '../../utils/formatters';
import { sampleEvents } from '../../utils/mockData';
import type { TicketResponse } from '../../types';

export function BookingConfirmationPage() {
  const { bookingId = '' } = useParams();
  const demo = bookingId === 'demo-booking';
  const preview = useSeatSelectionStore(state => state.preview);
  const queryClient = useQueryClient();
  const booking = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId),
    enabled: Boolean(bookingId) && !demo,
    staleTime: 0
  });
  const confirmed = booking.data?.status === 'CONFIRMED';
  const selectedSeats = demo ? preview?.seats ?? [] : booking.data?.seats ?? [];
  const [downloading, setDownloading] = useState<string | null>(null);
  async function download(id: string) {
    setDownloading(id);
    try {
      await downloadTicket(id);
      toast.success('Ticket PDF downloaded');
    } catch {
      toast.error('Ticket PDF could not be downloaded');
    } finally {
      setDownloading(null);
    }
  }
  const tray = useRef<HTMLDivElement>(null);
  const pending = booking.data?.status === 'PENDING';
  const lock = useQuery({
    queryKey: ['booking-lock', bookingId],
    queryFn: () => getLockStatus(bookingId),
    enabled: pending,
    refetchInterval: 30_000
  });
  const { data, dataUpdatedAt, isLoading, isError } = useQuery({
    queryKey: ['tickets', bookingId],
    queryFn: () => getTicketsForBooking(bookingId),
    enabled: confirmed,
    refetchOnWindowFocus: false,
    refetchInterval: query => Array.isArray(query.state.data) || query.state.dataUpdateCount >= 12 || query.state.status === 'error' ? false : 5000
  });

  const tickets: TicketResponse[] = demo
    ? selectedSeats.map((seat, index) => ({
      id: `${seat.eventSeatId}-ticket`,
      bookingId,
      eventSeatId: seat.eventSeatId,
      ticketCode: `EF-DEMO-${index + 1}`,
      isUsed: false
    }))
    : data ?? [];
  const ready = tickets.length > 0;
  const event = demo ? sampleEvents.find(event => event.id === preview?.eventId) : undefined;
  const eventTitle = booking.data?.eventTitle ?? tickets[0]?.eventTitle ?? event?.title;
  const eventDate = booking.data?.eventDate ?? event?.eventDate;
  const venueName = booking.data?.venueName ?? event?.venueName;
  const expired = lock.data?.isExpired || booking.data?.status === 'EXPIRED';
  const timedOut = confirmed && !ready && dataUpdatedAt > 0 && (queryClient.getQueryState(['tickets', bookingId])?.dataUpdateCount ?? 0) >= 12;
  let heading = 'Booking tickets';
  let description = 'Checking your reservation.';
  if (demo) {
    heading = 'Ticket preview';
    description = 'This sample shows how an EventFlow ticket looks.';
  } else if (ready) {
    heading = 'Your tickets are ready.';
    description = 'Show the QR code at the door.';
  } else if (booking.isError) {
    description = 'We couldn’t load this reservation.';
  } else if (pending && !expired) {
    heading = 'Payment pending';
    description = 'Complete checkout to receive your tickets.';
  } else if (confirmed && data?.length === 0) {
    description = 'This account holds no tickets for this reservation.';
  } else if (confirmed) {
    description = timedOut || isError
      ? 'Your booking is confirmed. Ticket delivery is taking longer than expected.'
      : 'We’ll show your tickets here as soon as they’re available.';
  } else if (booking.data) {
    heading = expired ? 'Reservation expired' : `Booking ${booking.data.status.toLowerCase()}`;
    description = 'This reservation has no tickets to display.';
  }

  useLayoutEffect(() => {
    if (!ready || !tray.current) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.digital-ticket', { clipPath: 'inset(0 0 100% 0)', y: 24, duration: 0.65, stagger: 0.085 })
        .from('.ticket-qr', { scale: 0.86, opacity: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.065 }, 0.35);
    }, tray.current);
    return () => media.revert();
  }, [bookingId, ready]);

  return (
    <main className="page-container booking-page ticket-page">
      <BookingSteps current={3} />
      <header className="booking-heading ticket-cover" data-issued={ready}>
        <div className="ticket-cover-content">
          <TicketCheck size={30} aria-hidden="true" />
          <h1>{heading}</h1>
          <p>{description}</p>
          {ready && eventTitle && <div className="ticket-event-meta"><strong>{eventTitle}</strong>
            <span>{eventDate && <span><Clock3 size={14} aria-hidden="true" />{formatDateTime(eventDate)}</span>}{venueName && <span><MapPin size={14} aria-hidden="true" />{venueName}</span>}</span>
          </div>}
        </div>
        {ready && <div className="ticket-cover-count" aria-label={`${tickets.length} tickets`}><strong>{tickets.length}</strong><span>{tickets.length === 1 ? 'Ticket' : 'Tickets'}</span></div>}
      </header>
      {demo && <TestBookingCallout fromPreview />}
      <div className="tickets-tray" ref={tray} aria-live="polite">
        {confirmed && !data && !timedOut && !isError && <LoadingSpinner label={isLoading ? 'Loading tickets' : 'Waiting for tickets'} />}
        {confirmed && !ready && (timedOut || isError) && (
          <button type="button" className="button-dark focus-ring w-fit" onClick={() => void queryClient.resetQueries({ queryKey: ['tickets', bookingId], exact: true })}>Check again</button>
        )}
        {pending && !expired && <Link className="button-dark focus-ring w-fit" to={`/checkout/${bookingId}`}>Return to checkout</Link>}
        {tickets.map(ticket => {
          const seat = selectedSeats.find(item => item.eventSeatId === ticket.eventSeatId);
          return (
            <article key={ticket.id} className="digital-ticket">
              <div className="ticket-main">
                <p className="eyebrow">{demo ? 'EventFlow / Preview' : 'EventFlow / Admission'}</p>
                <h2>{seat ? `Seat ${seat.rowLabel}${seat.seatNumber}` : ticket.seatLabel ? `Seat ${ticket.seatLabel}` : 'Digital ticket'}</h2>
                <p className="ticket-code">{ticket.ticketCode}</p>
                {ticket.isUsed && <p className="booking-hint">Already checked in</p>}
                {ticket.pdfUrl && (
                  <button type="button" className="text-link focus-ring" disabled={downloading === ticket.id} onClick={() => void download(ticket.id)}>
                    <Download size={16} aria-hidden="true" /> {downloading === ticket.id ? 'Downloading…' : 'Get ticket PDF'}
                  </button>
                )}
              </div>
              <div className="ticket-stub">
                <QRCodeSVG className="ticket-qr" value={ticket.ticketCode} size={110} marginSize={4} title={demo ? 'Preview ticket QR code' : 'Admission QR code'} bgColor="#fffefa" fgColor="#111310" />
              </div>
            </article>
          );
        })}
      </div>
      <Link className="text-link focus-ring" to={ready && !demo ? '/my-bookings?view=tickets' : '/my-bookings'}>{ready && !demo ? 'Open ticket wallet' : 'My bookings'} <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </main>
  );
}
