import AdminPanelPage, { AdminLegacyRedirect } from '../../../pages/admin/AdminPanelPage';

/**
 * Vista principal del panel admin — delega en `AdminPanelPage` con layout Lovable
 * (`AdminLayout` gradiente + tabs) y APIs reales `@doevents/shared`.
 */
export const AdminPanelView = () => (
  <div className="admin-panel-view min-h-screen bg-background">
    <AdminPanelPage />
  </div>
);

export { AdminLegacyRedirect };
export default AdminPanelView;
