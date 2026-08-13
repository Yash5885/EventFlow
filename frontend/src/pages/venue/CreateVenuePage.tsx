import { Building2 } from 'lucide-react';

export function CreateVenuePage() {
  return (
    <main className="page-container py-8">
      <section className="rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Create venue</h1>
        </div>
        <form className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="focus-ring h-11 rounded-sm border border-input px-3" placeholder="Name" />
          <input className="focus-ring h-11 rounded-sm border border-input px-3" placeholder="City" />
          <input className="focus-ring h-11 rounded-sm border border-input px-3" placeholder="State" />
          <input className="focus-ring h-11 rounded-sm border border-input px-3" type="number" placeholder="Capacity" />
          <textarea className="focus-ring min-h-28 rounded-sm border border-input p-3 md:col-span-2" placeholder="Address" />
          <button type="button" className="focus-ring rounded-sm bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground md:w-fit">
            Save venue
          </button>
        </form>
      </section>
    </main>
  );
}

