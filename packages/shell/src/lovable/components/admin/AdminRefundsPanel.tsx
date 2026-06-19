import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { AdminPaymentsTab } from '../../../pages/admin/tabs/AdminPaymentsTab';

/** Panel de reembolsos y dispersiones — empalme Lovable con datos reales de pagos admin. */
export const AdminRefundsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-4">
        <button
          type="button"
          onClick={() => navigate('/admin?tab=payments')}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <RotateCcw className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Reembolsos y dispersiones</h1>
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
