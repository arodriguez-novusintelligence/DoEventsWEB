import { Users } from 'lucide-react';
import { AdminStaffTab } from '../../../pages/admin/tabs/AdminStaffTab';
import AdminPanelSection from './AdminPanelSection';

/** Panel usuarios admin — empalme Lovable con `AdminStaffTab` y APIs `@doevents/shared`. */
export const AdminUsersPanel = () => (
  <AdminPanelSection
    title="Usuarios y roles"
    description="Gestiona cuentas, estados y permisos de la plataforma."
    icon={Users}
    badge="Admin"
  >
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/40 bg-secondary/30 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Listado y acciones sobre cuentas reales — sin datos simulados.
        </p>
      </div>
      <AdminStaffTab />
    </div>
  </AdminPanelSection>
);

export default AdminUsersPanel;
