import { UserPlus } from 'lucide-react';
import { AdminNewUsersTab } from '../../../pages/admin/tabs/AdminNewUsersTab';
import AdminPanelSection from './AdminPanelSection';

/** Panel usuarios nuevos — empalme Lovable con `AdminNewUsersTab` y APIs reales. */
export const NewUsersPanel = () => (
  <AdminPanelSection
    title="Usuarios nuevos"
    description="Revisa registros recientes y activaciones pendientes."
    icon={UserPlus}
    badge="Recientes"
  >
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/40 bg-secondary/30 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Registros recientes vía API admin — activaciones pendientes visibles aquí.
        </p>
      </div>
      <AdminNewUsersTab />
    </div>
  </AdminPanelSection>
);

export default NewUsersPanel;
