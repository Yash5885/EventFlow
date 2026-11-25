import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRefunds, requestRefund } from '../../api/refunds.api';
import { WorkflowStatus } from '../common/WorkflowStatus';
import type { BookingResponse } from '../../types';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export function CustomerRefunds({ bookings }: { bookings: BookingResponse[] }) {
  const cache = useQueryClient();
  const history = useQuery({ queryKey: ['refund-history'], queryFn: listRefunds });
  const request = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => requestRefund(id, reason),
    onSuccess: () => void cache.invalidateQueries({ queryKey: ['refund-history'] })
  });
  const candidates = bookings.filter(booking => booking.status !== 'PENDING' && booking.status !== 'REFUNDED' &&
    !history.data?.some(refund => refund.bookingId === booking.id && refund.status !== 'REJECTED'));
  return <section className="account-panel" aria-labelledby="refunds-heading">
    <h2 className="flow-section-title" id="refunds-heading">Refund requests</h2>
    {candidates.length > 0 && <form className="work-form refund-form" onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      request.mutate({ id: String(form.get('booking')), reason: String(form.get('reason')) });
    }}>
      <label htmlFor="refund-reservation">Reservation<select id="refund-reservation" name="booking" required defaultValue="">
        <option value="" disabled>Choose a reservation</option>
        {candidates.map(booking => <option key={booking.id} value={booking.id}>{booking.eventTitle ?? formatDateTime(booking.createdAt)} · {formatCurrency(Number(booking.amountDue ?? booking.totalAmount))}</option>)}
      </select></label>
      <label>Reason<textarea name="reason" rows={2} required maxLength={500} /></label>
      <button type="submit" className="button-dark" disabled={request.isPending}>Request refund</button>
    </form>}
    {request.error && <p className="status-note" role="alert">{getApiErrorMessage(request.error, 'A refund could not be requested.')}</p>}
    {history.isError && <p className="status-note" role="alert">Refund history could not be loaded.</p>}
    {history.data?.length === 0 && <p className="booking-hint">No refund requests yet.</p>}
    <ul className="refund-history">
      {history.data?.map(refund => <li key={refund.id} className="refund-history-item">
        <div><strong>{refund.eventTitle}</strong><p>{refund.note || refund.reason}</p><small>{formatDateTime(refund.updatedAt)}</small></div>
        <div><WorkflowStatus status={refund.status} /><strong>{formatCurrency(refund.amount)}</strong></div>
      </li>)}
    </ul>
  </section>;
}
