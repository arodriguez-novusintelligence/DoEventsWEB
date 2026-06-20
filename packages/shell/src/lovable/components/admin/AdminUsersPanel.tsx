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
    <AdminStaffTab />
  </AdminPanelSection>
);

export default AdminUsersPanel;
