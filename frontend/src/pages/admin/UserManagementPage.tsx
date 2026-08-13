import { Users } from 'lucide-react';

export function UserManagementPage() {
  return (
    <main className="page-container py-8">
      <section className="rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">User management</h1>
        </div>
      </section>
    </main>
  );
}

