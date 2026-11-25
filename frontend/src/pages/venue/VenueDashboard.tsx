import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listVenues } from '../../api/venues.api';
import { Workspace } from '../../components/layout/Workspace';
import { useAuthStore } from '../../store/auth.store';

export function VenueDashboard() {
  const managerId = useAuthStore(state => state.user?.id);
  const venues = useQuery({ queryKey: ['venue-list'], queryFn: () => listVenues({ size: 100 }) });
  const owned = venues.data?.content.filter(venue => venue.managerId === managerId);
  return <Workspace role="VENUE_MANAGER" title="Venue operations" description="Manage seat layouts and run event check-in.">
    <div className="flex flex-wrap gap-4"><Link className="button-dark" to="/venue/create">Create venue</Link><Link className="text-link" to="/venue/scanner">Gate check-in</Link></div>
    {owned?.length === 0 && <p className="booking-hint">Create a venue to build its seat layout.</p>}
    <ul className="booking-list mt-5">
      {owned?.map(venue => <li key={venue.id} className="booking-row"><span><strong>{venue.name}</strong><small>{venue.city}</small></span><Link className="text-link" to={`/venue/${venue.id}/seats`}>Edit seat layout</Link></li>)}
    </ul>
  </Workspace>;
}
