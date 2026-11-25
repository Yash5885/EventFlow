import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listRefundQueue, reviewRefund } from '../../api/refunds.api';
import { WorkflowStatus } from '../../components/common/WorkflowStatus';
import { Workspace } from '../../components/layout/Workspace';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { formatCurrency } from '../../utils/formatters';

export function RefundQueuePage() {
  const cache = useQueryClient();
  const queue = useQuery({ queryKey: ['refund-queue'], queryFn: listRefundQueue });
  const review = useMutation({
    mutationFn: ({ id, approve, note }: { id: string; approve: boolean; note: string }) => reviewRefund(id, approve, note),
    onSuccess: () => void cache.invalidateQueries({ queryKey: ['refund-queue'] })
  });
  return <Workspace role="ADMIN" title="Refund requests" description="Review requests for unused tickets. Approved live refunds are settled in Razorpay.">
    {queue.isLoading && <p>Loading requests…</p>}
    {queue.isError && <p className="status-note">The refund queue could not be loaded.</p>}
    {review.error && <p role="alert" className="status-note">{getApiErrorMessage(review.error, 'Review failed.')}</p>}
    {queue.data?.length === 0 && <p className="booking-hint">No requests to review.</p>}
    <ul className="review-queue">
      {queue.data?.map(request => <li key={request.id} className="review-card">
        <div className="review-header"><h2>{request.eventTitle}</h2><WorkflowStatus status={request.status} /></div>
        <p className="review-amount">{formatCurrency(request.amount)}</p>
        <p>{request.reason}</p>
        {request.status === 'APPROVED' ? (
          <p className="booking-hint">Awaiting Razorpay settlement{request.paymentReference ? ` · ${request.paymentReference}` : ''}</p>
        ) : <form className="work-form review-form" onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const button = (event.nativeEvent as SubmitEvent).submitter;
          review.mutate({ id: request.id, approve: button?.getAttribute('value') !== 'reject', note: String(form.get('note')) });
        }}>
          <label className="work-wide">Review note<input name="note" maxLength={500} /></label>
          <button className="button-dark" type="submit" disabled={review.isPending}>Approve refund</button>
          <button className="text-link" type="submit" value="reject" disabled={review.isPending}>Reject request</button>
        </form>}
      </li>)}
    </ul>
  </Workspace>;
}
