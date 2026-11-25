import { Workspace } from '../../components/layout/Workspace';

export function EventAnalyticsPage() {
  return (
    <Workspace role="ORGANIZER" title="Event analytics">
      <div className="empty-state"><p>Event reporting is unavailable in this view.</p></div>
    </Workspace>
  );
}
