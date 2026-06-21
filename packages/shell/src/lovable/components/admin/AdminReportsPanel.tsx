import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import {
  fetchAdminDashboard,
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
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-gradient-to-r from-primary/5 via-background to-accent/5 px-4 py-4 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/admin?tab=home')}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Administración</p>
            <h1 className="text-xl font-extrabold text-foreground">Reportes y KPIs</h1>
            <p className="text-xs text-muted-foreground">Métricas en vivo de la plataforma</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando reportes…</p>
          </div>
        ) : (
          <AdminHomeTab stats={stats} />
        )}
      </div>
    </div>
  );
};

export default AdminReportsPanel;
