import { ArrowUpRight } from 'lucide-react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import type { EventSummaryResponse } from '../../types';
import { fallbackEventImage } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { EventBadge } from './EventBadge';

export function EventCard({ event }: { event: EventSummaryResponse }) {
  const navigate = useNavigate();
  const to = `/events/${event.id}`;

  return (
    <article className="event-item">
      <Link to={to} className="event-link focus-ring" onClick={click => {
        if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
          click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return;
        click.preventDefault();
        document.startViewTransition(() => flushSync(() => navigate(to)));
      }}>
        <div className="event-image" style={{ viewTransitionName: `event-${event.id}` }}>
          <img src={event.bannerUrl || fallbackEventImage} alt="" loading="lazy" onError={event => {
            if (event.currentTarget.getAttribute('src') !== fallbackEventImage) event.currentTarget.src = fallbackEventImage;
          }} />
          <span className="event-arrow"><ArrowUpRight size={21} aria-hidden="true" /></span>
        </div>
        <div className="event-meta"><span className="eyebrow">{event.category || 'Event'}</span>{event.status !== 'PUBLISHED' && <EventBadge status={event.status} />}</div>
        <h2>{event.title}</h2>
        <p>{formatDateTime(event.eventDate)}<br />{event.venueName}, {event.city}</p>
      </Link>
    </article>
  );
}
