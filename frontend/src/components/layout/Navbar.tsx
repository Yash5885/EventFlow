import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

import { useSeatSelectionStore } from '../../store/seat-selection.store';

export function Wordmark() {
  return <span className="wordmark"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>eventflow<span className="brand-dot">.</span></span>;
}

export function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const dashboardPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'ORGANIZER' ? '/organizer' : user?.role === 'VENUE_MANAGER' ? '/venue' : '/dashboard';

  useEffect(() => setOpen(false), [pathname]);

  const links = (
    <>
      <NavLink to="/events">Explore events</NavLink>
      {isAuthenticated && <NavLink to={dashboardPath}>Dashboard</NavLink>}
      {isAuthenticated && user?.role === 'CUSTOMER' && <NavLink to="/my-bookings">My bookings</NavLink>}
    </>
  );

  return (
    <header className="site-header" onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        event.currentTarget.querySelector<HTMLButtonElement>('.nav-toggle')?.focus();
      }
    }}>
      <div className="page-container nav-inner">
        <Link to="/" className="focus-ring" aria-label="EventFlow home"><Wordmark /></Link>
        <nav className="site-links" aria-label="Main navigation">{links}</nav>
        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link to={user?.role === 'CUSTOMER' ? '/profile' : dashboardPath} className="nav-account focus-ring">{user?.name}</Link>
              <button type="button" aria-label="Log out" title="Log out" className="nav-toggle-button focus-ring" onClick={() => {
                clearAuth();
                useSeatSelectionStore.getState().setPreview(null);
                for (const key of ['booking', 'booking-lock', 'tickets', 'my-bookings', 'my-tickets', 'refund-history', 'refund-queue', 'gate-events', 'gate-attendance', 'organizer-events', 'event-review', 'me']) {
                  queryClient.removeQueries({ queryKey: [key] });
                }
                navigate('/');
              }}><LogOut size={17} aria-hidden="true" /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-account focus-ring">Log in</Link>
              <Link to="/register" className="nav-join focus-ring">Join EventFlow <ArrowUpRight size={15} aria-hidden="true" /></Link>
            </>
          )}
          <button type="button" className="nav-toggle nav-toggle-button focus-ring" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-navigation" className="page-container mobile-links" aria-label="Mobile navigation">
          {links}
          {isAuthenticated && user?.role === 'CUSTOMER' && <NavLink to="/profile">Profile</NavLink>}
          {!isAuthenticated && <><NavLink to="/login">Log in</NavLink><NavLink to="/register">Join EventFlow</NavLink></>}
        </nav>
      )}
    </header>
  );
}
