import AdminPanelPage, { AdminGuardedLegacyRedirect, AdminLegacyRedirect } from '../../../pages/admin/AdminPanelPage';

/**
 * Vista principal del panel admin — delega en `AdminPanelPage` + `AdminLayout` (gradiente Lovable + tabs + API real).
 */
export const AdminPanelView = () => <AdminPanelPage />;

export { AdminLegacyRedirect, AdminGuardedLegacyRedirect };
export default AdminPanelView;
