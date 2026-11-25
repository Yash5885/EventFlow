import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getEvent, getSeatMap } from '../../api/events.api';
import { EventEditor } from '../../components/events/EventEditor';
import { Workspace } from '../../components/layout/Workspace';

export function EditEventPage() {
  const { id = '' } = useParams();
  const event = useQuery({ queryKey: ['event', id], queryFn: () => getEvent(id) });
  const map = useQuery({ queryKey: ['seat-map', id], queryFn: () => getSeatMap(id) });
  return <Workspace role="ORGANIZER" title="Edit event">
    {event.isError || map.isError ? <p className="status-note" role="alert">This listing could not be opened.</p>
      : event.data && map.data ? <EventEditor key={id} existing={event.data} inventory={map.data} /> : <p>Loading listing…</p>}
  </Workspace>;
}
