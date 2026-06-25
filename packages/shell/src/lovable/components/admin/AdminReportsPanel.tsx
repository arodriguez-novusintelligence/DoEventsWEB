import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, BarChart3 } from 'lucide-react';
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
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-8 pt-4 text-primary-foreground">
        <button
          type="button"
          onClick={() => navigate('/admin?tab=home')}
          className="-ml-2 mb-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary-foreground/90 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al panel
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary-foreground/15 p-3 backdrop-blur">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reportes y KPIs</h1>
            <p className="text-sm text-primary-foreground/80">Métricas en vivo de la plataforma</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card py-16 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando reportes…</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <AdminHomeTab stats={stats} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPanel;
