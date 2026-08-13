import type { SeatMapSeat } from '../../types';
import { seatStatusColors } from '../../utils/constants';

interface SeatCellProps {
  seat: SeatMapSeat;
  x: number;
  y: number;
  selected: boolean;
  disabled: boolean;
  onToggle: (seat: SeatMapSeat) => void;
}

export function SeatCell({ seat, x, y, selected, disabled, onToggle }: SeatCellProps) {
  const unavailable = seat.status === 'LOCKED' || seat.status === 'BOOKED' || seat.status === 'BLOCKED';
  const fill = selected
    ? seatStatusColors.SELECTED
    : seat.seatType === 'WHEELCHAIR' && seat.status === 'AVAILABLE'
      ? seatStatusColors.WHEELCHAIR
      : seatStatusColors[seat.status];

  return (
    <g>
      <rect
        x={x}
        y={y}
        width="28"
        height="28"
        rx="4"
        fill={fill}
        opacity={disabled || unavailable ? 0.72 : 1}
        className={unavailable || disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        onClick={() => {
          if (!unavailable && !disabled) {
            onToggle(seat);
          }
        }}
      >
        <title>{`${seat.rowLabel}${seat.seatNumber} ${seat.status}`}</title>
      </rect>
      <text x={x + 14} y={y + 18} textAnchor="middle" className="pointer-events-none fill-white text-[10px] font-semibold">
        {seat.seatNumber}
      </text>
    </g>
  );
}

