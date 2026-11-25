import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getSeatMap } from '../../api/events.api';
import { lockSeats } from '../../api/bookings.api';
import { BookingSteps } from '../../components/booking/BookingSteps';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SeatMap } from '../../components/seat-map/SeatMap';
import { useAuthStore } from '../../store/auth.store';
import { useSeatSelectionStore } from '../../store/seat-selection.store';
import { MAX_SEATS } from '../../utils/constants';
import { sampleEvents, sampleSeatMap } from '../../utils/mockData';

export function SeatSelectionPage() {
  const { id = '' } = useParams();
  return <EventSeatSelection key={id} id={id} />;
}

function EventSeatSelection({ id }: { id: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const setPreview = useSeatSelectionStore(state => state.setPreview);
  const [selection, setSelection] = useState<string[]>(() => {
    const carriedSeats = location.state?.seatIds;
    return Array.isArray(carriedSeats) ? carriedSeats.filter((seatId): seatId is string => typeof seatId === 'string').slice(0, MAX_SEATS) : [];
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ['seat-map', id],
    queryFn: () => getSeatMap(id),
    enabled: Boolean(id),
    refetchInterval: 30_000
  });

  const previewAvailable = sampleEvents.some(event => event.id === id);
  const seatMap = data ?? sampleSeatMap(id);
  const selectedSeats = seatMap.rows.flatMap(row => row.seats)
    .filter(seat => seat.status === 'AVAILABLE' && selection.includes(seat.eventSeatId));
  const selectedSeatIds = selectedSeats.map(seat => seat.eventSeatId);
  const lockMutation = useMutation({
    mutationFn: (seatIds: string[]) => lockSeats(id, seatIds),
    onSuccess: booking => {
      queryClient.setQueryData(['booking', booking.id], booking);
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      navigate(`/checkout/${booking.id}`);
    },
    onError: error => {
      const response = isAxiosError<{ errorCode?: string }>(error) ? error.response : undefined;
      switch (response?.data?.errorCode) {
        case 'SEAT_ALREADY_LOCKED':
        case 'SEAT_NOT_AVAILABLE':
          toast.error('A selected seat is no longer available. Choose another seat.');
          void queryClient.invalidateQueries({ queryKey: ['seat-map', id] });
          return;
        case 'EVENT_NOT_PUBLISHED':
          toast.error('This event is no longer open for booking.');
          return;
      }
      if (response?.status === 401) {
        toast.error(useAuthStore.getState().isAuthenticated
          ? 'We couldn’t reconnect your session. Try again in a moment.'
          : 'Your session expired. Log in again to continue.');
      } else if (response?.status === 403) {
        toast.error('This account doesn’t have permission to reserve seats.');
      } else {
        toast.error('We couldn’t start checkout. Please try again in a moment.');
      }
    }
  });

  return (
    <main className="page-container booking-page seat-selection">
      <BookingSteps current={1} />
      {isLoading && <LoadingSpinner label="Loading live seat availability" />}
      {!data && isError && <p className="status-note" role="status">{previewAvailable ? 'Preview seat map. Reservations here are for demonstration.' : 'The seat map is unavailable. Try again in a moment.'}</p>}
      {!isLoading && (data || previewAvailable) && (
        <SeatMap
          seatMap={seatMap}
          selectedSeatIds={selectedSeatIds}
          onToggleSeat={seat => {
            if (lockMutation.isPending) return;
            setSelection(selectedSeatIds.includes(seat.eventSeatId)
              ? selectedSeatIds.filter(seatId => seatId !== seat.eventSeatId)
              : [...selectedSeatIds, seat.eventSeatId].slice(0, MAX_SEATS));
          }}
          onAddSeats={ids => setSelection([...selectedSeatIds, ...ids].slice(0, MAX_SEATS))}
          isProceeding={lockMutation.isPending}
          onProceed={() => {
            if (data) {
              lockMutation.mutate(selectedSeatIds);
              return;
            }
            setPreview({ eventId: id, seats: selectedSeats, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
            navigate('/checkout/demo-booking');
          }}
        />
      )}
    </main>
  );
}
