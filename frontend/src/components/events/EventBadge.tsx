import type { EventStatus } from '../../types';

const styles: Record<EventStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-sky-100 text-sky-800'
};

export function EventBadge({ status }: { status: EventStatus }) {
  return <span className={`rounded-sm px-2 py-1 text-xs font-medium ${styles[status]}`}>{status.replace('_', ' ')}</span>;
}

