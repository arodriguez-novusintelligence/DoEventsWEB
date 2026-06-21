import { UserPlus } from 'lucide-react';
import { AdminNewUsersTab } from '../../../pages/admin/tabs/AdminNewUsersTab';
import AdminPanelSection from './AdminPanelSection';

export const NewUsersPanel = () => (
  <AdminPanelSection
    title="Usuarios nuevos"
    description="Revisa registros recientes y activaciones pendientes."
    icon={UserPlus}
    badge="Recientes"
  >
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <AdminNewUsersTab />
    </div>
  </AdminPanelSection>
);

export default NewUsersPanel;
