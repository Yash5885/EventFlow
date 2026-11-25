import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSeatMap, listEvents } from '../../api/events.api';
import { getPaymentConfig } from '../../api/payments.api';

export function TestBookingCallout({ fromPreview = false }: { fromPreview?: boolean }) {
  const { data: payment } = useQuery({ queryKey: ['payment-config'], queryFn: getPaymentConfig });
  const canTest = Boolean(payment?.demo && payment.enabled);
  const { data: bookableEvent } = useQuery({
    queryKey: ['test-booking-event'],
    enabled: canTest,
    staleTime: 60_000,
    queryFn: async () => {
      const { content } = await listEvents({ size: 8 });
      const upcoming = content.filter(event => new Date(event.eventDate).getTime() > Date.now());
      const results = await Promise.allSettled(upcoming.map(event => getSeatMap(event.id)));
      const index = results.findIndex(result => result.status === 'fulfilled'
        && result.value.rows.some(row => row.seats.some(seat => seat.status === 'AVAILABLE')));
      return upcoming[index] ?? null;
    }
  });

  if (!canTest && !fromPreview) return null;

  return (
    <aside className="test-booking-callout" aria-labelledby="test-booking-title">
      <div>
        <h2 id="test-booking-title">{canTest ? 'Try the full booking flow' : 'Find a bookable event'}</h2>
        <p>{canTest ? 'Test payment saves your reservation and issues a QR ticket with a downloadable PDF. No charge.' : 'Browse listed events to select seats and check out.'}</p>
      </div>
      <Link className="button-dark focus-ring" to={bookableEvent ? `/events/${bookableEvent.id}/seats` : '/events'}>
        {bookableEvent ? 'Try a test booking' : 'Browse events'} <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </aside>
  );
}
