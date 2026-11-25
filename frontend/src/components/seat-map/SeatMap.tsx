import { useState } from 'react';
import { Accessibility, ArrowRight, Armchair, List, Map, Users, X } from 'lucide-react';
import type { SeatMapResponse, SeatMapSeat } from '../../types';
import { MAX_SEATS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import { findAdjacentSeats } from './findAdjacentSeats';
import { SeatLegend } from './SeatLegend';
import { SeatRow } from './SeatRow';

interface SeatMapProps {
  seatMap: SeatMapResponse;
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatMapSeat) => void;
  onProceed: () => void;
  onAddSeats: (ids: string[]) => void;
  isProceeding?: boolean;
}

export function SeatMap({ seatMap, selectedSeatIds, onToggleSeat, onProceed, onAddSeats, isProceeding }: SeatMapProps) {
  const [listView, setListView] = useState(false);
  const [onlyAccessible, setOnlyAccessible] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [groupMessage, setGroupMessage] = useState('');
  const seats = seatMap.rows.flatMap(row => row.seats);
  const available = seats.filter(seat => seat.status === 'AVAILABLE').length;
  const selectedSeats = seats.filter(seat => selectedSeatIds.includes(seat.eventSeatId));
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
  const height = Math.max(275, 56 + seatMap.rows.length * 44, ...seats.map(seat => (seat.yPosition ?? 0) + 48));
  const width = Math.max(680, 110 + Math.max(...seatMap.rows.map(row => row.seats.length), 1) * 42, ...seats.map(seat => (seat.xPosition ?? 0) + 52));

  return (
    <section aria-labelledby="seat-map-title">
      <header className="booking-heading">
        <h1 id="seat-map-title">Choose your seats</h1>
        <p>{seatMap.venueName} · Select up to {MAX_SEATS} seats</p>
        <span className="seat-availability"><span />{available} available</span>
      </header>
      <div className="seat-toolbar" aria-label="Seat view and group selection">
        <div className="flow-switch" role="group" aria-label="Seat view">
          <button type="button" className="focus-ring" aria-pressed={!listView} onClick={() => { setListView(false); setOnlyAccessible(false); }}><Map size={16} aria-hidden="true" />Map view</button>
          <button type="button" className="focus-ring" aria-pressed={listView} onClick={() => setListView(true)}><List size={16} aria-hidden="true" />List view</button>
        </div>
        <label className="seat-filter"><input type="checkbox" checked={onlyAccessible} onChange={event => {
          setOnlyAccessible(event.target.checked);
          if (event.target.checked) setListView(true);
        }} /> <Accessibility size={18} aria-hidden="true" />Wheelchair spaces</label>
        <div className="seat-group"><Users size={17} aria-hidden="true" />
        <label>Group size
          <select value={groupSize} onChange={event => setGroupSize(Number(event.target.value))}>
            {Array.from({ length: MAX_SEATS - 1 }, (_, index) => <option key={index + 2}>{index + 2}</option>)}
          </select>
        </label>
        <button type="button" className="text-link focus-ring" disabled={isProceeding} onClick={() => {
          if (selectedSeatIds.length + groupSize > MAX_SEATS) {
            setGroupMessage('Remove some seats before adding this group.');
            return;
          }
          const group = findAdjacentSeats(seatMap.rows, groupSize, onlyAccessible, selectedSeatIds);
          if (!group.length) {
            setGroupMessage('No available adjacent group matches those options.');
            return;
          }
          onAddSeats(group.map(seat => seat.eventSeatId));
          setGroupMessage(`Selected ${group.length} adjacent seats in row ${group[0].rowLabel}.`);
        }}>Find adjacent seats</button>
        </div>
      </div>
      {groupMessage && <p className="flow-feedback" role="status">{groupMessage}</p>}
      <div className="booking-grid">
        {listView ? (
          <div className="booking-sheet seat-list" aria-label="Seat list">
            <h2>{onlyAccessible ? 'Wheelchair spaces' : 'Seats by row'}</h2>
            {onlyAccessible && !seats.some(seat => seat.seatType === 'WHEELCHAIR') && <p className="booking-hint">No wheelchair spaces are listed for this venue.</p>}
            <ul>
              {seats.filter(seat => !onlyAccessible || seat.seatType === 'WHEELCHAIR').map(seat => {
                const selected = selectedSeatIds.includes(seat.eventSeatId);
                return <li key={seat.eventSeatId} className="booking-row">
                  <span><strong>Row {seat.rowLabel} · Seat {seat.seatNumber}</strong><small>{seat.seatType === 'WHEELCHAIR' ? 'Wheelchair space' : seat.seatType.toLowerCase()} · {seat.status.toLowerCase()}</small></span>
                  <span className="flex items-center gap-3">{formatCurrency(Number(seat.price))}
                    <button type="button" className="text-link focus-ring" aria-pressed={selected}
                      aria-label={`${selected ? 'Deselect' : 'Select'} seat ${seat.rowLabel}${seat.seatNumber}`}
                      disabled={isProceeding || seat.status !== 'AVAILABLE' || (!selected && selectedSeatIds.length >= MAX_SEATS)}
                      onClick={() => onToggleSeat(seat)}>{selected ? 'Deselect' : 'Select'}</button>
                  </span>
                </li>;
              })}
            </ul>
          </div>
        ) : <div className="seat-plan">
          <SeatLegend />
          <div className="seat-stage"><span>Stage</span></div>
          <p className="seat-scroll-hint">Swipe or scroll to see more seats</p>
          <div className="seat-scroll" tabIndex={0} role="region" aria-label="Seating plan. Scroll to see more seats if required.">
            <svg viewBox={`0 40 ${width} ${height - 40}`} style={{ minWidth: Math.min(width, 720) }} role="group" aria-label="Seat map">
              {seatMap.rows.map((row, index) => (
                <SeatRow key={row.rowLabel} row={row} rowIndex={index} selectedSeatIds={selectedSeatIds} onToggle={onToggleSeat} />
              ))}
            </svg>
          </div>
        </div>}
        <aside className="booking-summary seat-summary" aria-label="Seat selection summary">
          <div className="timer-label"><Armchair size={18} aria-hidden="true" /> Your seats <span className="seat-count">{selectedSeats.length}</span></div>
          <div className="selection-detail" role="status" aria-live="polite" aria-atomic="true">
            {!selectedSeats.length && <p>Select seats to see your total.</p>}
            <div className="booking-total">
              <span>Total</span>
              <strong key={total}>{formatCurrency(total)}</strong>
            </div>
          </div>
          {selectedSeats.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected seats">
              {selectedSeats.map(seat => {
                const label = `${seat.rowLabel}${seat.seatNumber}`;
                return (
                  <li key={seat.eventSeatId}>
                    <button type="button" disabled={isProceeding} onClick={() => onToggleSeat(seat)}
                      className="seat-chip focus-ring"
                      aria-label={`Remove seat ${label}`}>
                      {label}<X size={15} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button type="button" disabled={!selectedSeats.length || isProceeding} onClick={onProceed} className="button-dark focus-ring">
            {isProceeding ? 'Reserving seats…' : 'Continue to checkout'}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </aside>
      </div>
    </section>
  );
}
