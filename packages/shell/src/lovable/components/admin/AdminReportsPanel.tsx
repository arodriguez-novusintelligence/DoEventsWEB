import { Navigate } from 'react-router-dom';

/** Platform reports and KPIs — redirects to admin home dashboard. */
export const AdminReportsPanel = () => (
  <Navigate to="/admin?tab=home" replace />
);

export default AdminReportsPanel;
