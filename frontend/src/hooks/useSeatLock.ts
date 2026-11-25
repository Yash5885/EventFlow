import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { extendLock, getLockStatus } from '../api/bookings.api';

export function useSeatLock(bookingId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['booking-lock', bookingId];
  const status = useQuery({
    queryKey,
    queryFn: () => getLockStatus(bookingId!),
    enabled: Boolean(bookingId),
    refetchInterval: 30_000
  });

  const extend = useMutation({
    mutationFn: () => extendLock(bookingId!),
    onSuccess: lock => queryClient.setQueryData(queryKey, lock)
  });

  return { status, extend };
}
