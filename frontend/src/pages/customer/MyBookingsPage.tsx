import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, Receipt, Ticket } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { myBookings } from '../../api/bookings.api';
import { CustomerTickets } from '../../components/booking/CustomerTickets';
import { CustomerRefunds } from '../../components/booking/CustomerRefunds';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { WorkflowStatus } from '../../components/common/WorkflowStatus';
import { Workspace } from '../../components/layout/Workspace';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const views = [
  { value: 'bookings', label: 'Bookings', icon: CalendarDays },
  { value: 'tickets', label: 'Ticket wallet', icon: Ticket },
  { value: 'refunds', label: 'Refunds', icon: Receipt }
] as const;

export function MyBookingsPage() {
  const [params, setParams] = useSearchParams();
  const hash = useLocation().hash;
  const choice = params.get('view');
  const view = hash.startsWith('#claim=') ? 'tickets' : choice === 'tickets' || choice === 'refunds' ? choice : 'bookings';
  const { data, isLoading, isError } = useQuery({ queryKey: ['my-bookings'], queryFn: myBookings, enabled: view !== 'tickets' });
  const bookings = data?.content ?? [];

  return (
    <Workspace role="CUSTOMER" title="My bookings" description="Open your reservations, admission passes and refund history.">
      <div className="flow-switch account-views" role="group" aria-label="Booking views">
        {views.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" className="focus-ring" aria-pressed={view === value}
            onClick={() => setParams(value === 'bookings' ? {} : { view: value }, { replace: true })}>
            <Icon size={17} aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      {view === 'bookings' && <section aria-label="Reservations" className="account-panel">
        {isLoading && <LoadingSpinner label="Loading reservations" />}
        {isError && <p className="flow-feedback" data-tone="danger" role="alert">Bookings are temporarily unavailable.</p>}
        {data && !bookings.length && <div className="empty-state"><h2>No bookings yet.</h2><Link to="/events" className="button-dark">Explore events <ArrowUpRight size={17} aria-hidden="true" /></Link></div>}
        <ul className="account-ledger">
          {bookings.map(booking => (
            <li key={booking.id}>
              <Link to={booking.status === 'PENDING' ? `/checkout/${booking.id}` : `/booking/${booking.id}/confirm`} className="account-ledger-row focus-ring">
                <span className="account-ledger-icon"><Ticket size={20} aria-hidden="true" /></span>
                <span className="account-ledger-main"><strong>{booking.eventTitle || 'Event reservation'}</strong>
                  <small>{booking.eventDate ? formatDateTime(booking.eventDate) : formatDateTime(booking.createdAt)}{booking.venueName && ` · ${booking.venueName}`}</small></span>
                <WorkflowStatus status={booking.status} />
                <strong className="account-ledger-amount">{formatCurrency(Number(booking.amountDue ?? booking.totalAmount))}</strong>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>}
      {view === 'tickets' && <CustomerTickets />}
      {view === 'refunds' && <CustomerRefunds bookings={bookings} />}
    </Workspace>
  );
}
