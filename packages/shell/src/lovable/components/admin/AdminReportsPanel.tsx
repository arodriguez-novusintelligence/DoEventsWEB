import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import {
  fetchAdminDashboard,
  Loader,
  useToast,
  type AdminDashboardStats,
} from '@doevents/shared';
import { AdminHomeTab } from '../../../pages/admin/tabs/AdminHomeTab';

/** Panel de reportes y KPIs — empalme Lovable con dashboard admin real. */
export const AdminReportsPanel = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAdminDashboard()
      .then(setStats)
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error al cargar reportes', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-4">
        <button
          type="button"
          onClick={() => navigate('/admin?tab=home')}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Reportes y KPIs</h1>
            <p className="text-xs text-muted-foreground">Métricas en vivo de la plataforma</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : (
          <AdminHomeTab stats={stats} />
        )}
      </div>
    </div>
  );
};

export default AdminReportsPanel;
