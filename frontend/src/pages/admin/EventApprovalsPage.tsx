import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getEventsForReview, reviewEvent } from '../../api/events.api';
import { WorkflowStatus } from '../../components/common/WorkflowStatus';
import { Workspace } from '../../components/layout/Workspace';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { formatDateTime } from '../../utils/formatters';

export function EventApprovalsPage() {
  const cache = useQueryClient();
  const events = useQuery({ queryKey: ['event-review'], queryFn: getEventsForReview });
  const review = useMutation({ mutationFn: reviewEvent, onSuccess: () => {
    void cache.invalidateQueries({ queryKey: ['event-review'] });
    void cache.invalidateQueries({ queryKey: ['events'] });
  } });
  return (
    <Workspace role="ADMIN" title="Event approvals" description="Review submitted listings before they are published.">
      {events.isError && <p className="status-note">The review queue could not be loaded.</p>}
      {review.error && <p className="status-note" role="alert">{getApiErrorMessage(review.error, 'Review could not be saved.')}</p>}
      {events.data?.content.length === 0 && <div className="empty-state"><p>No events awaiting approval.</p></div>}
      <ol className="review-queue">
        {events.data?.content.map(event => <li key={event.id} className="review-card">
          <div className="review-header"><h2>{event.title}</h2><WorkflowStatus status={event.status} /></div>
          <p className="booking-hint">{event.category} · {formatDateTime(event.eventDate)}</p>
          <Link className="text-link" to={`/events/${event.id}`}>Preview listing</Link>
          <form className="work-form review-form" onSubmit={submit => {
            submit.preventDefault();
            const button = (submit.nativeEvent as SubmitEvent).submitter;
            const decision = button?.getAttribute('value') === 'reject' ? 'reject' : 'approve';
            const note = String(new FormData(submit.currentTarget).get('note') ?? '').trim();
            review.mutate({ id: event.id, decision, note });
          }}>
            <label className="work-wide">Review note<input name="note" maxLength={400} /></label>
            <button className="button-dark" type="submit" disabled={review.isPending}>Approve and publish</button>
            <button className="text-link" type="submit" value="reject" disabled={review.isPending}>Return to draft</button>
          </form>
        </li>)}
      </ol>
    </Workspace>
  );
}
