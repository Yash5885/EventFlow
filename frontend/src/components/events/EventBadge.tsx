import type { EventStatus } from '../../types';

export function EventBadge({ status }: { status: EventStatus }) {
  return <span className="event-badge" data-status={status}>{status.replace(/_/g, ' ').toLowerCase()}</span>;
}
