import { Search } from 'lucide-react';

interface EventFiltersProps {
  city: string;
  category: string;
  onCityChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function EventFilters({ city, category, onCityChange, onCategoryChange }: EventFiltersProps) {
  return (
    <section className="border-b border-border bg-white">
      <div className="page-container grid gap-3 py-4 md:grid-cols-[1fr_240px_240px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input className="focus-ring h-11 w-full rounded-sm border border-input bg-white pl-10 pr-3 text-sm" placeholder="Search city or event" value={city} onChange={event => onCityChange(event.target.value)} />
        </label>
        <select className="focus-ring h-11 rounded-sm border border-input bg-white px-3 text-sm" value={category} onChange={event => onCategoryChange(event.target.value)}>
          <option value="">All categories</option>
          <option value="Concert">Concert</option>
          <option value="Sports">Sports</option>
          <option value="Theatre">Theatre</option>
          <option value="Conference">Conference</option>
        </select>
      </div>
    </section>
  );
}

