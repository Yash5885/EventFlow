import { Search } from 'lucide-react';

interface EventFiltersProps {
  search: string;
  category: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

const categories = [['', 'All events'], ['Concert', 'Concerts'], ['Sports', 'Sports'], ['Theatre', 'Theatre'], ['Conference', 'Conferences']];

export function EventFilters({ search, category, onSearchChange, onCategoryChange }: EventFiltersProps) {
  return (
    <div className="event-filters">
      <div className="category-tabs" role="group" aria-label="Event category">
        {categories.map(([value, label]) => (
          <button className="focus-ring" key={label} type="button" aria-pressed={category === value} onClick={() => onCategoryChange(value)}>{label}</button>
        ))}
      </div>
      <label className="event-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" aria-label="Search event, venue, or city" placeholder="Search event, venue, or city" value={search} onChange={event => onSearchChange(event.target.value)} />
      </label>
    </div>
  );
}
