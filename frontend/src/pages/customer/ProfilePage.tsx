import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../api/auth.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/auth.store';

export function ProfilePage() {
  const storedUser = useAuthStore(state => state.user);
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: Boolean(storedUser) });
  const user = data ?? storedUser;

  return (
    <main className="page-container py-8">
      <section className="max-w-xl rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Profile</h1>
          {isLoading && <LoadingSpinner label="Syncing" />}
        </div>
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-border py-2">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{user?.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-border py-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{user?.role.replace('_', ' ')}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

