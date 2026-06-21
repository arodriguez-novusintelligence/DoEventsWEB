import { CreditCard } from 'lucide-react';
import { AdminPaymentsTab } from '../../../pages/admin/tabs/AdminPaymentsTab';
import AdminPanelSection from './AdminPanelSection';

/** Panel pagos admin — empalme Lovable con `AdminPaymentsTab` y APIs reales. */
export const PaymentsPanel = () => (
  <AdminPanelSection
    title="Pagos y reembolsos"
    description="Consulta transacciones, estados de pago y solicitudes de devolución."
    icon={CreditCard}
    badge="Finanzas"
  >
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="border-b border-border/40 bg-secondary/30 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Transacciones y dispersiones desde DoEventsBack — sin mocks.
        </p>
      </div>
      <AdminPaymentsTab />
    </div>
  </AdminPanelSection>
);

export default PaymentsPanel;
