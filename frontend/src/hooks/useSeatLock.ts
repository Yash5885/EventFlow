import { useMutation, useQuery } from '@tanstack/react-query';
import { extendLock, getLockStatus } from '../api/bookings.api';

export function useSeatLock(bookingId?: string) {
  const status = useQuery({
    queryKey: ['booking-lock', bookingId],
    queryFn: () => getLockStatus(bookingId!),
    enabled: Boolean(bookingId),
    refetchInterval: 30_000
  });

  const extend = useMutation({
    mutationFn: () => extendLock(bookingId!)
  });

  return { status, extend };
}

