import { Search } from 'lucide-react';
import { AdminSupportTab } from '../../../pages/admin/tabs/AdminSupportTab';
import AdminPanelSection from './AdminPanelSection';

export const SupportSearchPanel = () => (
  <AdminPanelSection
    title="Soporte y búsqueda"
    description="Localiza usuarios, tickets y casos de atención."
    icon={Search}
  >
    <AdminSupportTab />
  </AdminPanelSection>
);

export default SupportSearchPanel;
