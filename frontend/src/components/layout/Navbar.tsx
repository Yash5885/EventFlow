import { CalendarDays, LayoutDashboard, LogOut, Menu, Search, Ticket, UserRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium transition hover:bg-muted ${
    isActive ? 'text-primary' : 'text-muted-foreground'
  }`;

export function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const dashboardPath =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'ORGANIZER' ? '/organizer' : user?.role === 'VENUE_MANAGER' ? '/venue' : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate text-lg">EventFlow</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/events" className={linkClass}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Events
          </NavLink>
          {isAuthenticated && (
            <NavLink to={dashboardPath} className={linkClass}>
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'CUSTOMER' && (
            <NavLink to="/my-bookings" className={linkClass}>
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Bookings
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="focus-ring hidden items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted sm:inline-flex"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {user?.name}
              </Link>
              <button
                type="button"
                title="Log out"
                onClick={() => {
                  clearAuth();
                  navigate('/');
                }}
                className="focus-ring grid h-9 w-9 place-items-center rounded-sm border border-border bg-white text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link className="focus-ring rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted" to="/login">
                Login
              </Link>
              <Link className="focus-ring rounded-sm bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" to="/register">
                Register
              </Link>
            </>
          )}
          <button
            type="button"
            title="Menu"
            className="focus-ring grid h-9 w-9 place-items-center rounded-sm border border-border bg-white text-muted-foreground md:hidden"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

