import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, BellRing, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { useAuthStore } from '../../store/auth.store';
import type { ApiResponse } from '../../types';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { formatTimer } from '../../utils/formatters';

interface WaitlistView {
  canJoin: boolean;
  status?: 'WAITING' | 'OFFERED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  position?: number;
  bookingId?: string;
  remainingSeconds?: number;
}

export function EventWaitlist({ eventId }: { eventId: string }) {
  const user = useAuthStore(state => state.user);
  const cache = useQueryClient();
  const key = ['event-waitlist', eventId, user?.id];
  const path = `/waitlist/events/${eventId}`;
  const status = useQuery({
    queryKey: key, queryFn: async () => (await api.get<ApiResponse<WaitlistView>>(path)).data.data,
    enabled: user?.role === 'CUSTOMER', refetchInterval: 12000
  });
  const update = useMutation({
    mutationFn: async (join: boolean) => (await (join ? api.post<ApiResponse<WaitlistView>>(path) : api.delete<ApiResponse<WaitlistView>>(path))).data.data,
    onSuccess: state => {
      cache.setQueryData(key, state);
      void cache.invalidateQueries({ queryKey: ['my-bookings'] });
    }
  });
  const remaining = status.data?.remainingSeconds;
  const seconds = useCountdownTimer(remaining == null ? null : new Date(status.dataUpdatedAt + remaining * 1000).toISOString());
  if (!status.data) return null;
  const { canJoin, status: state, position, bookingId } = status.data;
  const claimable = state === 'OFFERED' && seconds !== 0 && bookingId;
  if (!canJoin && state !== 'WAITING' && state !== 'OFFERED' && state !== 'EXPIRED') return null;
  return (
    <section className="waitlist-pass" data-offered={Boolean(claimable)} aria-label="Event waitlist">
      <span className="waitlist-icon">{claimable ? <Clock3 size={19} aria-hidden="true" /> : <BellRing size={19} aria-hidden="true" />}</span>
      <div className="waitlist-content">
        {claimable ? <>
          <h3>A seat opened for you.</h3>
          <p>Your offer expires when the hold ends.</p>
          {seconds !== null && <strong className="waitlist-clock" role="timer">{formatTimer(seconds)}</strong>}
          <Link className="button-accent" to={`/checkout/${bookingId}`}>Claim your seat <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </> : state === 'WAITING' ? <>
          <h3>On the waitlist</h3>
          {position && <p>Position <strong>{position}</strong></p>}
          <p>Return here to check for a seat offer.</p>
        </> : canJoin ? <>
          <h3>Join the waitlist</h3>
          <p>We’ll hold an available seat when it’s your turn.</p>
          <button className="button-dark" type="button" disabled={update.isPending} onClick={() => update.mutate(true)}>Join waitlist <ArrowUpRight size={16} aria-hidden="true" /></button>
        </> : <><h3>Offer expired</h3><p>Any released seat goes back to the queue.</p></>}
        {(state === 'WAITING' || claimable) && <button className="text-link focus-ring" type="button" disabled={update.isPending} onClick={() => update.mutate(false)}>Leave waitlist</button>}
        {update.error && <p className="flow-feedback" data-tone="danger" role="alert">{getApiErrorMessage(update.error, 'The waitlist could not be updated.')}</p>}
      </div>
    </section>
  );
}
