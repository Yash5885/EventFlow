import { CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EventSummaryResponse } from '../../types';
import { fallbackEventImage } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { EventBadge } from './EventBadge';

export function EventCard({ event }: { event: EventSummaryResponse }) {
  return (
    <article className="overflow-hidden rounded-md border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <img className="h-44 w-full object-cover" src={event.bannerUrl || fallbackEventImage} alt="" />
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase text-secondary">{event.category || 'Event'}</span>
          <EventBadge status={event.status} />
        </div>
        <div>
          <h2 className="line-clamp-2 text-lg font-semibold">{event.title}</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatDateTime(event.eventDate)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {event.venueName}, {event.city}
            </span>
          </div>
        </div>
        <Link className="focus-ring inline-flex w-full items-center justify-center rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" to={`/events/${event.id}`}>
          View seats
        </Link>
      </div>
    </article>
  );
}

