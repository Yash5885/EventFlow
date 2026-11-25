import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listEvents } from '../../api/events.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EventCard } from '../../components/events/EventCard';
import { EventFilters } from '../../components/events/EventFilters';

export function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', search.trim(), category],
    queryFn: () => listEvents({ q: search.trim() || undefined, category: category || undefined, size: 24 })
  });

  const events = data?.content ?? [];

  return (
    <main className="catalog-page">
      <header className="catalog-heading">
        <div className="page-container">
          <p className="eyebrow">Event discovery</p>
          <h1>Explore<br />events<span>.</span></h1>
        </div>
      </header>
      <section className="page-container catalog-results" aria-label="Event results">
        <EventFilters search={search} category={category} onSearchChange={setSearch} onCategoryChange={setCategory} />
        <div className="catalog-status" aria-live="polite">
          {isLoading ? <LoadingSpinner label="Loading events" /> : !isError && <span>{data?.totalElements ?? 0} {data?.totalElements === 1 ? 'event' : 'events'}</span>}
        </div>
        {isError ? (
          <div className="empty-state">
            <h2>Events couldn’t be loaded.</h2>
            <button type="button" className="button-dark focus-ring" onClick={() => void refetch()}>Try again</button>
          </div>
        ) : events.length > 0 ? (
          <div className="catalog-grid" key={category}>
            {events.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : !isLoading && (
          <div className="empty-state">
            <h2>{search.trim() || category ? 'No events match your search.' : 'No events are listed yet.'}</h2>
            {(search.trim() || category) && <button type="button" className="button-dark focus-ring" onClick={() => { setSearch(''); setCategory(''); }}>Clear filters</button>}
          </div>
        )}
      </section>
    </main>
  );
}
