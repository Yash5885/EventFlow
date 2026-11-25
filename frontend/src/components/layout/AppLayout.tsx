import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppLayout() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const content = useRef<HTMLDivElement>(null);
  const previousPath = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      content.current?.focus({ preventScroll: true });
    }
  }, [navigationType, pathname]);

  return (
    <div className="app-shell">
      <a href="#page-content" className="skip-link">Skip to content</a>
      <Navbar />
      <div className="app-content" id="page-content" tabIndex={-1} ref={content}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
