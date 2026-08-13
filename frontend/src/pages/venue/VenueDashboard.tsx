import { Building2, QrCode, Rows3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function VenueDashboard() {
  const actions: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/venue/create', label: 'Create venue', icon: Building2 },
    { to: '/venue/demo/seats', label: 'Seat layout', icon: Rows3 },
    { to: '/venue/scanner', label: 'QR scanner', icon: QrCode }
  ];

  return (
    <main className="page-container py-8">
      <h1 className="text-2xl font-semibold">Venue manager</h1>
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
