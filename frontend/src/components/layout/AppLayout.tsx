import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

