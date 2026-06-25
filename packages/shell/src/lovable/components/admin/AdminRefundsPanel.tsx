import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { AdminPaymentsTab } from '../../../pages/admin/tabs/AdminPaymentsTab';

/** Panel de reembolsos y dispersiones — empalme Lovable con datos reales de pagos admin. */
export const AdminRefundsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-8 pt-4 text-primary-foreground">
        <button
          type="button"
          onClick={() => navigate('/admin?tab=payments')}
          className="-ml-2 mb-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground/90 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al panel
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-foreground/15 p-3 backdrop-blur">
            <RotateCcw className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reembolsos y dispersiones</h1>
            <p className="text-sm text-primary-foreground/80">Gestión de pagos pendientes y dispersados</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <AdminPaymentsTab />
        </div>
      </div>
    </div>
  );
};

export default AdminRefundsPanel;
