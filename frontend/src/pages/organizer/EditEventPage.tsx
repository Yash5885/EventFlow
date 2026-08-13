import { FilePenLine } from 'lucide-react';

export function EditEventPage() {
  return (
    <main className="page-container py-8">
      <section className="rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <FilePenLine className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Edit event</h1>
        </div>
      </section>
    </main>
  );
}

