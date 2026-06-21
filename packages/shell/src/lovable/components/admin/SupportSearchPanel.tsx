import { Search } from 'lucide-react';
import { AdminSupportTab } from '../../../pages/admin/tabs/AdminSupportTab';
import AdminPanelSection from './AdminPanelSection';

export const SupportSearchPanel = () => (
  <AdminPanelSection
    title="Soporte y búsqueda"
    description="Localiza usuarios, tickets y casos de atención."
    icon={Search}
    badge="Soporte"
  >
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      <AdminSupportTab />
    </div>
  </AdminPanelSection>
);

export default SupportSearchPanel;
