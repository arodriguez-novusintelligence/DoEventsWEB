import { Search } from 'lucide-react';
import { AdminSupportTab } from '../../../pages/admin/tabs/AdminSupportTab';
import AdminPanelSection from './AdminPanelSection';

/** Panel soporte admin — empalme Lovable con `AdminSupportTab` y búsqueda API real. */
export const SupportSearchPanel = () => (
  <AdminPanelSection
    title="Soporte y búsqueda"
    description="Localiza usuarios, tickets y casos de atención."
    icon={Search}
    badge="Soporte"
  >
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/40 bg-secondary/30 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Búsqueda de usuarios y casos — datos reales de soporte.
        </p>
      </div>
      <AdminSupportTab />
    </div>
  </AdminPanelSection>
);

export default SupportSearchPanel;
