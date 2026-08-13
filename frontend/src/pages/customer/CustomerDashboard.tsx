import { CalendarDays, Ticket, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export function CustomerDashboard() {
  const user = useAuthStore(state => state.user);
  const actions: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/events', label: 'Find events', icon: CalendarDays },
    { to: '/my-bookings', label: 'My bookings', icon: Ticket },
    { to: '/profile', label: 'Profile', icon: UserRound }
  ];

  return (
    <main className="page-container py-8">
      <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="rounded-md border border-border bg-white p-5 shadow-sm hover:shadow-md">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="mt-4 block font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
