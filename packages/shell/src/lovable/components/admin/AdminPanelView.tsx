import { Shield } from 'lucide-react';
import AdminPanelPage, { AdminLegacyRedirect } from '../../../pages/admin/AdminPanelPage';

/**
 * Vista principal del panel admin — delega en `AdminPanelPage` con layout Lovable
 * (`AdminLayout` gradiente + tabs) y APIs reales `@doevents/shared`.
 */
export const AdminPanelView = () => (
  <div className="admin-panel-view min-h-screen bg-secondary pb-24">
    <div className="sticky top-0 z-10 border-b border-border/40 bg-gradient-to-r from-primary/5 via-background to-accent/5 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <Shield className="h-5 w-5 text-primary" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Administración</p>
          <h1 className="text-lg font-extrabold text-foreground">Panel Do.Events</h1>
        </div>
      </div>
    </div>
    <div className="rounded-t-2xl border-t border-border/40 bg-card shadow-sm">
    <AdminPanelPage />
    </div>
  </div>
);

export { AdminLegacyRedirect };
export default AdminPanelView;
