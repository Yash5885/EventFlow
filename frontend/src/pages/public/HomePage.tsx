import { ArrowRight, CalendarCheck2, ShieldCheck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventCard } from '../../components/events/EventCard';
import { sampleEvents } from '../../utils/mockData';

export function HomePage() {
  const metrics: { label: string; value: string; icon: LucideIcon }[] = [
    { label: 'Redis locks', value: '10 min', icon: ShieldCheck },
    { label: 'Seat map sync', value: '30 sec', icon: Zap },
    { label: 'Ticket polling', value: '5 sec', icon: CalendarCheck2 }
  ];

  return (
    <main>
      <section className="border-b border-border bg-white">
        <div className="page-container grid min-h-[520px] gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-secondary">Live reserved seating</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-foreground md:text-5xl">EventFlow</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Book city-wide events with real-time seat availability, checkout timers, and tickets ready after payment.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="focus-ring inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" to="/events">
                Browse events
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link className="focus-ring inline-flex items-center gap-2 rounded-sm border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground" to="/register">
                Create account
              </Link>
            </div>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {metrics.map(({ label, value, icon: Icon }) => (
                <div key={label} className="border-l-2 border-primary pl-3">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="mt-1 text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-white shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80"
              alt=""
              className="h-[360px] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="page-container py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Available events</h2>
            <p className="text-sm text-muted-foreground">Pick an event and reserve seats.</p>
          </div>
          <Link className="text-sm font-semibold text-primary" to="/events">
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {sampleEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </main>
  );
}
