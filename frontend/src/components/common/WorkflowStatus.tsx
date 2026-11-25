type Tone = 'neutral' | 'success' | 'attention' | 'danger';

const labels: Record<string, [string, Tone]> = {
  APPROVED: ['Approved', 'success'],
  BOOKED: ['Booked', 'neutral'],
  CANCELLED: ['Cancelled', 'neutral'],
  CLAIMED: ['Claimed', 'success'],
  CONFIRMED: ['Confirmed', 'success'],
  DRAFT: ['Draft', 'neutral'],
  EXPIRED: ['Expired', 'neutral'],
  PENDING: ['Payment pending', 'attention'],
  PENDING_APPROVAL: ['In review', 'attention'],
  PROCESSED: ['Refunded', 'success'],
  PUBLISHED: ['Published', 'success'],
  REFUNDED: ['Refunded', 'neutral'],
  REJECTED: ['Declined', 'danger'],
  REQUESTED: ['Requested', 'attention'],
  USED: ['Checked in', 'neutral']
};

export function WorkflowStatus({ status }: { status: string }) {
  const [label, tone] = labels[status] ?? [status.toLowerCase().replace(/_/g, ' '), 'neutral'];
  return <span className="workflow-status" data-tone={tone}>{label}</span>;
}
