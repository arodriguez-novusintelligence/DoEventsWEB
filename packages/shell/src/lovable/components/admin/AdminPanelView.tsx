import AdminPanelPage, { AdminLegacyRedirect } from '../../../pages/admin/AdminPanelPage';

/**
 * Vista principal del panel admin — delega en `AdminPanelPage` con layout Lovable
 * (`AdminLayout` gradiente + tabs) y APIs reales `@doevents/shared`.
 */
export const AdminPanelView = () => (
  <div className="admin-panel-view min-h-screen bg-secondary">
    <div className="sticky top-0 z-10 border-b border-border/40 bg-gradient-to-r from-primary/5 via-background to-accent/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Administración</p>
      <h1 className="text-lg font-extrabold text-foreground">Panel Do.Events</h1>
    </div>
    <AdminPanelPage />
  </div>
);

export { AdminLegacyRedirect };
export default AdminPanelView;
