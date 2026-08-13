import { BarChart3, CalendarCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const actions: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/events', label: 'Event approvals', icon: CalendarCheck },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <main className="page-container py-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
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
