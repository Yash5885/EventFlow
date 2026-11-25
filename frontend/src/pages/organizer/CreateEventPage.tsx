import { EventEditor } from '../../components/events/EventEditor';
import { Workspace } from '../../components/layout/Workspace';

export function CreateEventPage() {
  return <Workspace role="ORGANIZER" title="Create event"><EventEditor /></Workspace>;
}
