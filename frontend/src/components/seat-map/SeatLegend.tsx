import { seatStatusColors } from '../../utils/constants';

const items = [
  ['Available', seatStatusColors.AVAILABLE],
  ['Selected', seatStatusColors.SELECTED],
  ['Locked', seatStatusColors.LOCKED],
  ['Booked', seatStatusColors.BOOKED],
  ['Blocked', seatStatusColors.BLOCKED],
  ['Wheelchair', seatStatusColors.WHEELCHAIR]
] as const;

export function SeatLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

