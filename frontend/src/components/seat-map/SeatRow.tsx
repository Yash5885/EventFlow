import type { SeatMapRow, SeatMapSeat } from '../../types';
import { MAX_SEATS } from '../../utils/constants';
import { SeatCell } from './SeatCell';

interface SeatRowProps {
  row: SeatMapRow;
  rowIndex: number;
  selectedSeatIds: string[];
  onToggle: (seat: SeatMapSeat) => void;
}

export function SeatRow({ row, rowIndex, selectedSeatIds, onToggle }: SeatRowProps) {
  const y = 56 + rowIndex * 44;

  return (
    <g>
      <text x="24" y={y + 18} className="fill-slate-600 text-xs font-semibold">
        {row.rowLabel}
      </text>
      {row.seats.map((seat, seatIndex) => {
        const selected = selectedSeatIds.includes(seat.eventSeatId);
        const disabled = !selected && selectedSeatIds.length >= MAX_SEATS;
        return (
          <SeatCell
            key={seat.eventSeatId}
            seat={seat}
            x={seat.xPosition ?? 72 + seatIndex * 42}
            y={seat.yPosition ?? y}
            selected={selected}
            disabled={disabled}
            onToggle={onToggle}
          />
        );
      })}
    </g>
  );
}

