import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../../api/events.api';
import { EventWaitlist } from '../../components/events/EventWaitlist';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { fallbackEventImage } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { sampleEventDetail, sampleEvents } from '../../utils/mockData';

export function EventDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
    enabled: Boolean(id)
  });
  const preview = sampleEvents.some(event => event.id === id);
  if (!data && !preview) return <main className="page-container booking-page">
    {isLoading ? <LoadingSpinner label="Loading event" /> : <><h1 className="text-3xl font-semibold">Event unavailable</h1><Link className="text-link" to="/events">Browse events</Link></>}
  </main>;
  const detail = data ?? sampleEventDetail(id);

  return (
    <main className="event-detail">
      <header className="detail-masthead">
        <div className="page-container">
          <Link to="/events" className="text-link"><ArrowLeft size={17} aria-hidden="true" /> All events</Link>
          <p className="eyebrow">{detail.event.category || 'Event'}</p>
          <h1>{detail.event.title}</h1>
        </div>
      </header>
      <div className="page-container detail-grid">
        <div>
          <div className="detail-art" style={{ viewTransitionName: `event-${id}` }}>
            <img src={detail.event.bannerUrl || fallbackEventImage} alt="" onError={event => {
              if (event.currentTarget.getAttribute('src') !== fallbackEventImage) event.currentTarget.src = fallbackEventImage;
            }} />
          </div>
          <div className="detail-description">
            <h2>About the event</h2>
            <p>{detail.event.description}</p>
          </div>
        </div>
        <aside className="detail-booking" aria-label="Event booking">
          {isLoading && <LoadingSpinner label="Loading event" />}
          {!data && <p className="status-note">Sample event · Preview the seat map and ticket.</p>}
          <h2>Plan your visit</h2>
          <div className="detail-fact"><CalendarDays size={19} aria-hidden="true" /><span>{formatDateTime(detail.event.eventDate)}</span></div>
          <div className="detail-fact"><MapPin size={19} aria-hidden="true" /><span>{detail.venueName}<small>{detail.city}</small></span></div>
          {detail.event.status === 'PUBLISHED' ?
            <Link className="button-dark focus-ring" to={`/events/${detail.event.id}/seats`}>{data ? 'Select seats' : 'Preview seats'} <ArrowUpRight size={19} aria-hidden="true" /></Link> :
            <p className="status-note">Listing preview · tickets are not on sale.</p>}
          {data?.event.status === 'PUBLISHED' && <EventWaitlist eventId={id} />}
        </aside>
      </div>
    </main>
  );
}
