import { ArrowRight, Armchair } from 'lucide-react';
import type { SeatMapResponse, SeatMapSeat } from '../../types';
import { MAX_SEATS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { SeatLegend } from './SeatLegend';
import { SeatRow } from './SeatRow';

interface SeatMapProps {
  seatMap: SeatMapResponse;
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatMapSeat) => void;
  onProceed: () => void;
  isProceeding?: boolean;
}

export function SeatMap({ seatMap, selectedSeatIds, onToggleSeat, onProceed, isProceeding }: SeatMapProps) {
  const seats = seatMap.rows.flatMap(row => row.seats);
  const selectedSeats = seats.filter(seat => selectedSeatIds.includes(seat.eventSeatId));
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
  const height = Math.max(360, 96 + seatMap.rows.length * 44);
  const width = Math.max(760, 120 + Math.max(...seatMap.rows.map(row => row.seats.length), 1) * 44);

  return (
    <section className="pb-24">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{seatMap.venueName}</h1>
          <p className="text-sm text-muted-foreground">Select up to {MAX_SEATS} seats.</p>
        </div>
        <SeatLegend />
      </div>

      <div className="overflow-auto rounded-md border border-border bg-white p-4 shadow-sm">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Seat map">
          <rect x="160" y="12" width={Math.max(280, width - 320)} height="14" rx="4" fill="#0f172a" opacity="0.9" />
          <text x={width / 2} y="42" textAnchor="middle" className="fill-slate-500 text-xs font-semibold uppercase">
            Stage
          </text>
          {seatMap.rows.map((row, index) => (
            <SeatRow key={row.rowLabel} row={row} rowIndex={index} selectedSeatIds={selectedSeatIds} onToggle={onToggleSeat} />
          ))}
        </svg>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 backdrop-blur">
        <div className="page-container flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted text-primary">
              <Armchair className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {selectedSeats.length ? selectedSeats.map(seat => `${seat.rowLabel}${seat.seatNumber}`).join(', ') : 'No seats selected'}
              </p>
              <p className="text-sm text-muted-foreground">{formatCurrency(total)}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={!selectedSeats.length || isProceeding}
            onClick={onProceed}
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Checkout
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

