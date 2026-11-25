import { Workspace } from '../../components/layout/Workspace';
import { useAuthStore } from '../../store/auth.store';

export function CustomerDashboard() {
  const name = useAuthStore(state => state.user?.name);
  return <Workspace role="CUSTOMER" title={name ? `Welcome, ${name}` : 'Welcome'} description="Find your next event or pick up where you left off." />;
}
