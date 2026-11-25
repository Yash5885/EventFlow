import { Workspace } from '../../components/layout/Workspace';

export function PlatformAnalyticsPage() {
  return (
    <Workspace role="ADMIN" title="Platform analytics">
      <div className="empty-state"><p>Platform reporting is unavailable in this view.</p></div>
    </Workspace>
  );
}
