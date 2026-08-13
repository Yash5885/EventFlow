import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <main className="page-container grid min-h-[calc(100vh-130px)] place-items-center py-8">
      <section className="max-w-md rounded-md border border-border bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account role cannot open this page.</p>
        <Link className="focus-ring mt-5 inline-flex rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" to="/events">
          Back to events
        </Link>
      </section>
    </main>
  );
}

