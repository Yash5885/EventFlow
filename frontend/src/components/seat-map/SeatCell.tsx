import type { SeatMapSeat } from '../../types';
import { seatStatusColors } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

interface SeatCellProps {
  seat: SeatMapSeat;
  x: number;
  y: number;
  selected: boolean;
  disabled: boolean;
  onToggle: (seat: SeatMapSeat) => void;
}

export function SeatCell({ seat, x, y, selected, disabled, onToggle }: SeatCellProps) {
  const unavailable = seat.status !== 'AVAILABLE';
  const inactive = unavailable || disabled;
  const status = selected ? 'SELECTED' : seat.seatType === 'WHEELCHAIR' && !unavailable ? 'WHEELCHAIR' : seat.status;
  const label = `Seat ${seat.seatNumber}, row ${seat.rowLabel}, ${status.toLowerCase()}, ${formatCurrency(Number(seat.price))}`;

  function toggle() {
    if (!inactive) onToggle(seat);
  }

  return (
    <g className="seat-cell" role="button" tabIndex={inactive ? -1 : 0} aria-label={label} aria-pressed={selected} aria-disabled={inactive}
      data-selected={selected} onClick={toggle}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!event.repeat) toggle();
        }
      }}>
      <title>{label}</title>
      <rect x={x} y={y} width="31" height="31" rx="3" fill={seatStatusColors[status]} />
      <text x={x + 15.5} y={y + 19.5} textAnchor="middle" fill={selected ? '#111310' : '#fffefa'}>{seat.seatNumber}</text>
    </g>
  );
}
