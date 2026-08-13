import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { listEvents } from '../../api/events.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';
import { sampleEvents } from '../../utils/mockData';

export function EventsPage() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', city, category],
    queryFn: () => listEvents({ city: city || undefined, category: category || undefined, size: 24 })
  });

  const events = useMemo(() => {
    const source = data?.content.length ? data.content : sampleEvents;
    return source
      .filter(event => !city || `${event.city} ${event.title}`.toLowerCase().includes(city.toLowerCase()))
      .filter(event => !category || event.category === category);
  }, [category, city, data]);

  return (
    <main>
      <EventFilters city={city} category={category} onCityChange={setCity} onCategoryChange={setCategory} />
      <section className="page-container py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Events</h1>
          {isLoading && <LoadingSpinner label="Syncing" />}
        </div>
        {isError && <p className="mb-4 text-sm text-amber-700">Showing sample events until the API is available.</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </main>
  );
}

