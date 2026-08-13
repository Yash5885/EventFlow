import { useQuery } from '@tanstack/react-query';
import { Download, TicketCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getTicketsForBooking } from '../../api/tickets.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useSeatSelectionStore } from '../../store/seat-selection.store';

export function BookingConfirmationPage() {
  const { bookingId = '' } = useParams();
  const demo = bookingId === 'demo-booking';
  const selectedSeats = useSeatSelectionStore(state => state.selectedSeats);
  const { data, isLoading } = useQuery({
    queryKey: ['tickets', bookingId],
    queryFn: () => getTicketsForBooking(bookingId),
    enabled: Boolean(bookingId) && !demo,
    refetchInterval: query => (query.state.data?.length ? false : 5000)
  });

  const tickets =
    data ??
    selectedSeats.map((seat, index) => ({
      id: `${seat.eventSeatId}-ticket`,
      bookingId,
      eventSeatId: seat.eventSeatId,
      ticketCode: `EF-DEMO-${index + 1}`,
      pdfUrl: '#',
      isUsed: false
    }));

  return (
    <main className="page-container py-8">
      <section className="rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-emerald-100 text-emerald-700">
            <TicketCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Booking confirmed</h1>
            <p className="text-sm text-muted-foreground">Tickets appear as soon as generation finishes.</p>
          </div>
        </div>
        {isLoading && <div className="mt-5"><LoadingSpinner label="Generating tickets" /></div>}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {tickets.map(ticket => (
            <article key={ticket.id} className="rounded-sm border border-border p-4">
              <p className="text-sm text-muted-foreground">Ticket code</p>
              <p className="mt-1 font-semibold">{ticket.ticketCode}</p>
              <a className="focus-ring mt-4 inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm font-medium" href={ticket.pdfUrl || '#'} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </a>
            </article>
          ))}
        </div>
        <Link className="mt-6 inline-flex text-sm font-semibold text-primary" to="/my-bookings">
          My bookings
        </Link>
      </section>
    </main>
  );
}

