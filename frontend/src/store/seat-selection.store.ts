import { create } from 'zustand';
import type { SeatMapSeat } from '../types';

interface PreviewReservation {
  eventId: string;
  seats: SeatMapSeat[];
  expiresAt: Date;
}

interface SeatSelectionState {
  preview: PreviewReservation | null;
  setPreview: (reservation: PreviewReservation | null) => void;
}

export const useSeatSelectionStore = create<SeatSelectionState>(set => ({
  preview: null,
  setPreview: preview => set({ preview })
}));
