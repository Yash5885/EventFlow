import { Rows3 } from 'lucide-react';

export function SeatLayoutBuilderPage() {
  return (
    <main className="page-container py-8">
      <section className="rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Rows3 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Seat layout</h1>
        </div>
        <div className="mt-6 overflow-auto rounded-sm border border-border p-4">
          <div className="grid w-[640px] grid-cols-12 gap-2">
            {Array.from({ length: 96 }).map((_, index) => (
              <button key={index} type="button" className="focus-ring h-8 rounded-[4px] bg-emerald-500 text-xs font-semibold text-white">
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

