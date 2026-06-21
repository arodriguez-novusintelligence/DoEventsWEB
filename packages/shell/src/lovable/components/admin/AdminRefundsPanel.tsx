import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { AdminPaymentsTab } from '../../../pages/admin/tabs/AdminPaymentsTab';

/** Panel de reembolsos y dispersiones — empalme Lovable con datos reales de pagos admin. */
export const AdminRefundsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-gradient-to-r from-primary/5 via-background to-accent/5 px-4 py-4">
        <button
          type="button"
          onClick={() => navigate('/admin?tab=payments')}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
            <RotateCcw className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Administración</p>
            <h1 className="text-xl font-extrabold text-foreground">Reembolsos y dispersiones</h1>
            <p className="text-xs text-muted-foreground">Gestión de pagos pendientes y dispersados</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <AdminPaymentsTab />
      </div>
    </div>
  );
};

export default AdminRefundsPanel;
