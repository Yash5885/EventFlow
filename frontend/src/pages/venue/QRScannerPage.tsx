import { QrCode } from 'lucide-react';

export function QRScannerPage() {
  return (
    <main className="page-container py-8">
      <section className="rounded-md border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold">QR scanner</h1>
        </div>
        <input className="focus-ring mt-6 h-11 w-full max-w-md rounded-sm border border-input px-3" placeholder="Ticket code" />
      </section>
    </main>
  );
}

