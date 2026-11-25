import { Workspace } from '../../components/layout/Workspace';

export function UserManagementPage() {
  return (
    <Workspace role="ADMIN" title="User management">
      <div className="empty-state"><p>Account listing and management controls are unavailable in this view.</p></div>
    </Workspace>
  );
}
