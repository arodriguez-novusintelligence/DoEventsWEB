import { Navigate } from 'react-router-dom';

/** Admin refunds overview — redirects to payments tab where disbursements are managed. */
export const AdminRefundsPanel = () => (
  <Navigate to="/admin?tab=payments" replace />
);

export default AdminRefundsPanel;
