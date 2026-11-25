import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOrganizerEvents } from '../../api/events.api';
import { WorkflowStatus } from '../../components/common/WorkflowStatus';
import { Workspace } from '../../components/layout/Workspace';
import { formatDateTime } from '../../utils/formatters';

export function OrganizerDashboard() {
  const events = useQuery({ queryKey: ['organizer-events'], queryFn: getOrganizerEvents });
  return <Workspace role="ORGANIZER" title="Event operations" description="Draft and publish your event listings.">
    <div className="workspace-feature"><div><p className="eyebrow">Publishing</p><h2>Your lineup</h2></div><Link className="button-accent" to="/organizer/events/create">Create event <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
    {events.isError && <p className="status-note" role="alert">Listings could not be loaded.</p>}
    {events.data?.content.length === 0 && <p className="booking-hint">Your draft and published events will appear here.</p>}
    <ul className="account-ledger mt-5">
      {events.data?.content.map(event => <li key={event.id}>
        <Link className="account-ledger-row focus-ring" to={`/organizer/events/${event.id}/edit`}>
          <span className="account-ledger-icon"><CalendarDays size={20} aria-hidden="true" /></span>
          <span className="account-ledger-main"><strong>{event.title}</strong><small>{formatDateTime(event.eventDate)} · {event.venueName}</small></span>
          <WorkflowStatus status={event.status} /><ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </li>)}
    </ul>
  </Workspace>;
}
