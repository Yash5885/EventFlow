import { ArrowUpRight, BarChart3, Building2, CalendarCheck, CalendarDays, CalendarPlus, FilePenLine, LayoutDashboard, QrCode, Rows3, Ticket, UserRound, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { UserRole } from '../../types';

const workspaces: Record<UserRole, {
  label: string;
  root: string;
  actions: { to: string; label: string; detail: string; icon: LucideIcon }[];
}> = {
  CUSTOMER: {
    label: 'Your account', root: '/dashboard', actions: [
      { to: '/events', label: 'Find events', detail: 'Explore what’s on and choose your seats.', icon: CalendarDays },
      { to: '/my-bookings', label: 'My bookings', detail: 'Review your reservations and open your tickets.', icon: Ticket },
      { to: '/profile', label: 'Profile', detail: 'View your account details.', icon: UserRound }
    ]
  },
  ORGANIZER: {
    label: 'Organizer workspace', root: '/organizer', actions: [
      { to: '/organizer/events/create', label: 'Create event', detail: 'Open the event draft form.', icon: CalendarPlus },
      { to: '/events', label: 'Published events', detail: 'See the public event listings.', icon: FilePenLine },
      { to: '/organizer/events/demo/analytics', label: 'Analytics', detail: 'Open the event analytics view.', icon: BarChart3 }
    ]
  },
  VENUE_MANAGER: {
    label: 'Venue workspace', root: '/venue', actions: [
      { to: '/venue/create', label: 'Create venue', detail: 'Open the venue details form.', icon: Building2 },
      { to: '/venue/demo/seats', label: 'Seat layout', detail: 'View the example seating plan.', icon: Rows3 },
      { to: '/venue/scanner', label: 'QR scanner', detail: 'Open the ticket code entry view.', icon: QrCode }
    ]
  },
  ADMIN: {
    label: 'Administration', root: '/admin', actions: [
      { to: '/admin/users', label: 'Users', detail: 'Open the user management view.', icon: Users },
      { to: '/admin/refunds', label: 'Refund requests', detail: 'Review customer refund requests.', icon: Ticket },
      { to: '/admin/events', label: 'Event approvals', detail: 'Open the event review workspace.', icon: CalendarCheck },
      { to: '/admin/analytics', label: 'Analytics', detail: 'Open the platform analytics view.', icon: BarChart3 }
    ]
  }
};

export function Workspace({ role, title, description, children }: {
  role: UserRole; title: string; description?: string; children?: ReactNode;
}) {
  const { label, root, actions } = workspaces[role];

  return (
    <main className="workspace page-container" data-role={role}>
      <aside className="workspace-rail">
        <p className="eyebrow">{label}</p>
        <nav aria-label={label}>
          <NavLink to={root} end><LayoutDashboard size={17} aria-hidden="true" /> Overview</NavLink>
          {actions.map(({ to, label, icon: Icon }) => <NavLink to={to} key={to}><Icon size={17} aria-hidden="true" /> {label}</NavLink>)}
        </nav>
      </aside>
      <div className="workspace-main">
        <header>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </header>
        {children ?? (
          <div className="workspace-actions">
            {actions.map(({ to, label, detail, icon: Icon }) => (
              <Link to={to} key={to} className="workspace-action focus-ring">
                <Icon size={21} aria-hidden="true" />
                <span><strong>{label}</strong><small>{detail}</small></span>
                <ArrowUpRight size={21} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
