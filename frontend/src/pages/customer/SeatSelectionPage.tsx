import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getSeatMap } from '../../api/events.api';
import { lockSeats } from '../../api/bookings.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SeatMap } from '../../components/seat-map/SeatMap';
import { useSeatSelectionStore } from '../../store/seat-selection.store';
import { sampleSeatMap } from '../../utils/mockData';

export function SeatSelectionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { selectedSeatIds, toggleSeat, setBooking } = useSeatSelectionStore();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['seat-map', id],
    queryFn: () => getSeatMap(id),
    enabled: Boolean(id),
    refetchInterval: 30_000
  });

  const seatMap = data ?? sampleSeatMap(id);
  const fallbackMode = isError || !data;

  const lockMutation = useMutation({
    mutationFn: () => lockSeats(id, selectedSeatIds),
    onSuccess: booking => {
      setBooking(booking.id, new Date(Date.now() + 10 * 60 * 1000));
      navigate(`/checkout/${booking.id}`);
    },
    onError: () => toast.error('Seat lock failed')
  });

  return (
    <main className="page-container py-6">
      <div className="mb-4 flex items-center justify-between">
        {isLoading ? <LoadingSpinner label="Refreshing seat map" /> : <span className="text-sm text-muted-foreground">Seat map updates every 30 seconds.</span>}
      </div>
      {isError && <p className="mb-4 text-sm text-amber-700">Showing sample seats until the API is available.</p>}
      <SeatMap
        seatMap={seatMap}
        selectedSeatIds={selectedSeatIds}
        onToggleSeat={toggleSeat}
        isProceeding={lockMutation.isPending}
        onProceed={() => {
          if (fallbackMode) {
            setBooking('demo-booking', new Date(Date.now() + 10 * 60 * 1000));
            navigate('/checkout/demo-booking');
            return;
          }
          lockMutation.mutate();
        }}
      />
    </main>
  );
}
