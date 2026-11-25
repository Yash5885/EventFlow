import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { addVenueSeats, listVenueSeats } from '../../api/venues.api';
import { Workspace } from '../../components/layout/Workspace';
import type { SeatType } from '../../types';
import { getApiErrorMessage } from '../../utils/apiErrors';

export function SeatLayoutBuilderPage() {
  const { id = '' } = useParams();
  const example = id === 'demo';
  const cache = useQueryClient();
  const seats = useQuery({ queryKey: ['venue-seats', id], queryFn: () => listVenueSeats(id), enabled: !example && Boolean(id) });
  const add = useMutation({ mutationFn: (seats: Parameters<typeof addVenueSeats>[1]) => addVenueSeats(id, seats),
    onSuccess: () => void cache.invalidateQueries({ queryKey: ['venue-seats', id] }) });
  const rows = [...new Set(seats.data?.map(seat => seat.rowLabel) ?? [])];
  return (
    <Workspace role="VENUE_MANAGER" title="Seat layout" description={example ? 'Example seating plan · 8 rows, 12 seats per row' : 'Add rows and assign a ticketing section.'}>
      {example ? <div className="layout-preview" tabIndex={0} aria-label="Example seating plan">
        <p className="eyebrow">Stage</p><div>{Array.from({ length: 96 }, (_, index) => <span key={index}>{index + 1}</span>)}</div>
      </div> : <>
        <form className="work-form" onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const rowLabel = String(form.get('row')).trim();
          if (!rowLabel) return;
          const seatType = String(form.get('section')) as SeatType;
          const row = rows.indexOf(rowLabel);
          const start = Math.max(0, ...seats.data?.filter(seat => seat.rowLabel === rowLabel).map(seat => seat.seatNumber) ?? []) + 1;
          add.mutate(Array.from({ length: Number(form.get('count')) }, (_, index) => ({
            rowLabel, seatNumber: start + index,
            seatType: index === 0 && form.has('accessibility') ? 'WHEELCHAIR' : seatType,
            xPosition: 72 + (start + index - 1) * 42,
            yPosition: 56 + (row < 0 ? rows.length : row) * 44
          })));
        }}>
          <label>Row<input name="row" maxLength={8} required placeholder="A" /></label>
          <label>Number of seats<input name="count" type="number" min={1} max={40} defaultValue={10} required /></label>
          <label>Section<select name="section"><option>GENERAL</option><option>PREMIUM</option><option>VIP</option><option>WHEELCHAIR</option></select></label>
          <label className="!flex items-center"><input name="accessibility" type="checkbox" /> Add a wheelchair space at the start</label>
          <button type="submit" className="button-dark" disabled={add.isPending || !seats.data}>Add seats</button>
        </form>
        {(add.error || seats.error) && <p className="status-note" role="alert">{getApiErrorMessage(add.error || seats.error, 'Seat layout could not be saved.')}</p>}
        <ul className="booking-list mt-5" aria-label="Venue rows">
          {rows.map(row => <li key={row} className="booking-row"><strong>Row {row}</strong><span>{seats.data?.filter(seat => seat.rowLabel === row).length} seats</span></li>)}
        </ul>
      </>}
    </Workspace>
  );
}
