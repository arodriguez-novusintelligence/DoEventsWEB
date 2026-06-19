import { UserPlus } from 'lucide-react';
import { AdminNewUsersTab } from '../../../pages/admin/tabs/AdminNewUsersTab';
import AdminPanelSection from './AdminPanelSection';

export const NewUsersPanel = () => (
  <AdminPanelSection
    title="Usuarios nuevos"
    description="Revisa registros recientes y activaciones pendientes."
    icon={UserPlus}
  >
    <AdminNewUsersTab />
  </AdminPanelSection>
);

export default NewUsersPanel;
