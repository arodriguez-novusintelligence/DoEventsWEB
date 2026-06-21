import { ShieldCheck, Users } from 'lucide-react';
import { AdminStaffTab } from '../../../pages/admin/tabs/AdminStaffTab';
import AdminPanelSection from './AdminPanelSection';

export const AdminUsersPanel = () => (
  <AdminPanelSection
    title="Usuarios y roles"
    description="Gestiona cuentas, estados y permisos de la plataforma."
    icon={Users}
    badge="Admin"
  >
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <AdminStaffTab />
    </div>
  </AdminPanelSection>
);

export default AdminUsersPanel;
