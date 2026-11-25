import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <main className="page-container access-view">
      <p className="eyebrow">Restricted access</p>
      <h1>Access restricted.</h1>
      <p>Your account doesn’t have permission to open this page.</p>
      <Link to="/events" className="button-dark focus-ring">Back to events <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </main>
  );
}
