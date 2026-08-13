import { create } from 'zustand';
import type { SeatMapSeat } from '../types';
import { MAX_SEATS } from '../utils/constants';

interface SeatSelectionState {
  selectedSeatIds: string[];
  selectedSeats: SeatMapSeat[];
  bookingId: string | null;
  lockExpiresAt: Date | null;
  toggleSeat: (seat: SeatMapSeat) => void;
  clearSelection: () => void;
  setBooking: (bookingId: string, expiresAt: Date) => void;
}

export const useSeatSelectionStore = create<SeatSelectionState>(set => ({
  selectedSeatIds: [],
  selectedSeats: [],
  bookingId: null,
  lockExpiresAt: null,
  toggleSeat: seat =>
    set(state => {
      if (state.selectedSeatIds.includes(seat.eventSeatId)) {
        return {
          selectedSeatIds: state.selectedSeatIds.filter(id => id !== seat.eventSeatId),
          selectedSeats: state.selectedSeats.filter(item => item.eventSeatId !== seat.eventSeatId)
        };
      }
      if (state.selectedSeatIds.length >= MAX_SEATS) {
        return state;
      }
      return {
        selectedSeatIds: [...state.selectedSeatIds, seat.eventSeatId],
        selectedSeats: [...state.selectedSeats, seat]
      };
    }),
  clearSelection: () => set({ selectedSeatIds: [], selectedSeats: [], bookingId: null, lockExpiresAt: null }),
  setBooking: (bookingId, expiresAt) => set({ bookingId, lockExpiresAt: expiresAt })
}));
