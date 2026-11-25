import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../api/auth.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Workspace } from '../../components/layout/Workspace';
import { useAuthStore } from '../../store/auth.store';

export function ProfilePage() {
  const storedUser = useAuthStore(state => state.user);
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: Boolean(storedUser) });
  const user = data ?? storedUser;

  return (
    <Workspace role="CUSTOMER" title="Profile" description="Your EventFlow account details.">
      {isLoading && <LoadingSpinner label="Syncing profile" />}
      <dl className="profile-details">
        <div><dt>Name</dt><dd>{user?.name}</dd></div>
        <div><dt>Email</dt><dd>{user?.email}</dd></div>
        <div><dt>Role</dt><dd>{user?.role.replace(/_/g, ' ')}</dd></div>
      </dl>
    </Workspace>
  );
}
