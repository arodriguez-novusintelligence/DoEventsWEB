import { CreditCard } from 'lucide-react';
import { AdminPaymentsTab } from '../../../pages/admin/tabs/AdminPaymentsTab';
import AdminPanelSection from './AdminPanelSection';

export const PaymentsPanel = () => (
  <AdminPanelSection
    title="Pagos y reembolsos"
    description="Consulta transacciones, estados de pago y solicitudes de devolución."
    icon={CreditCard}
  >
    <AdminPaymentsTab />
  </AdminPanelSection>
);

export default PaymentsPanel;
