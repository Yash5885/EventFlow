import type { SeatMapRow, SeatMapSeat } from '../../types';

export function findAdjacentSeats(rows: SeatMapRow[], count: number, includeWheelchair: boolean, selectedIds: string[]) {
  const orderedRows = rows.map(row => [...row.seats].sort((a, b) => a.seatNumber - b.seatNumber));
  const distances = orderedRows.flatMap(seats => seats.slice(1).flatMap((seat, index) => {
    const previous = seats[index];
    return seat.seatNumber === previous.seatNumber + 1 && seat.xPosition != null && previous.xPosition != null
      ? [Math.abs(seat.xPosition - previous.xPosition)] : [];
  })).filter(distance => distance > 0).sort((a, b) => a - b);
  const standardPitch = distances[Math.floor((distances.length - 1) / 2)] ?? 42;
  let best: SeatMapSeat[] = [];
  let bestTotal = Infinity;
  for (const seats of orderedRows) {
    for (let index = 0; index + count <= seats.length; index++) {
      const group = seats.slice(index, index + count);
      if (group.some(seat => seat.status !== 'AVAILABLE' || selectedIds.includes(seat.eventSeatId))) continue;
      if (includeWheelchair && !group.some(seat => seat.seatType === 'WHEELCHAIR')) continue;
      if (!includeWheelchair && group.some(seat => seat.seatType === 'WHEELCHAIR')) continue;
      const connected = group.every((seat, position) => {
        if (position === 0) return true;
        const previous = group[position - 1];
        return seat.seatNumber === previous.seatNumber + 1 &&
          (seat.xPosition == null || previous.xPosition == null || Math.abs(seat.xPosition - previous.xPosition) <= standardPitch * 1.5);
      });
      const total = group.reduce((sum, seat) => sum + Number(seat.price), 0);
      if (connected && total < bestTotal) {
        best = group;
        bestTotal = total;
      }
    }
  }
  return best;
}
