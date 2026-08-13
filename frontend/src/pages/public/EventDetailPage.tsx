import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getEvent } from '../../api/events.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { fallbackEventImage } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { sampleEventDetail } from '../../utils/mockData';

export function EventDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
    enabled: Boolean(id)
  });
  const detail = data ?? sampleEventDetail(id);

  return (
    <main>
      <section className="border-b border-border bg-white">
        <div className="page-container grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
          <div>
            <img src={detail.event.bannerUrl || fallbackEventImage} alt="" className="h-[340px] w-full rounded-md object-cover" />
            {isError && <p className="mt-3 text-sm text-amber-700">Showing sample event details until the API is available.</p>}
          </div>
          <aside className="self-start rounded-md border border-border bg-white p-5 shadow-sm">
            {isLoading && <LoadingSpinner label="Loading event" />}
            <p className="text-sm font-semibold uppercase text-secondary">{detail.event.category || 'Event'}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">{detail.event.title}</h1>
            <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {formatDateTime(detail.event.eventDate)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {detail.venueName}, {detail.city}
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">{detail.event.description}</p>
            <Link className="focus-ring mt-6 inline-flex w-full items-center justify-center rounded-sm bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" to={`/events/${detail.event.id}/seats`}>
              Select seats
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

