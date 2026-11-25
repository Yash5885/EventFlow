import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Wordmark } from './Navbar';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <Link to="/" className="focus-ring" aria-label="EventFlow home"><Wordmark /></Link>
        <Link to="/events" className="text-link">Explore events <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
    </footer>
  );
}
