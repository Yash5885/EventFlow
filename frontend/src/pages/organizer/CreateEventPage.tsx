import { CalendarPlus } from 'lucide-react';

export function CreateEventPage() {
  return (
    <main className="page-container py-8">
      <section className="rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarPlus className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Create event</h1>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="focus-ring h-11 rounded-sm border border-input px-3" placeholder="Title" />
          <input className="focus-ring h-11 rounded-sm border border-input px-3" placeholder="Category" />
          <input className="focus-ring h-11 rounded-sm border border-input px-3" placeholder="Venue ID" />
          <input className="focus-ring h-11 rounded-sm border border-input px-3" type="datetime-local" />
          <textarea className="focus-ring min-h-28 rounded-sm border border-input p-3 md:col-span-2" placeholder="Description" />
          <button type="button" className="focus-ring rounded-sm bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground md:w-fit">
            Save draft
          </button>
        </form>
      </section>
    </main>
  );
}

