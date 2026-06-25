import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  FileText,
  Flag,
  Loader2,
  BarChart3,
  ShieldAlert,
  UserX,
} from 'lucide-react';
import {
  fetchAdminDashboard,
  useToast,
  type AdminDashboardStats,
} from '@doevents/shared';
import { AdminHomeTab } from '../../../pages/admin/tabs/AdminHomeTab';

/** Panel reportes KPIs + sección denuncias (UI Lovable, API denuncias pendiente). */
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

      <div className="mx-auto max-w-6xl space-y-8 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card py-16 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando reportes…</p>
          </div>
        ) : (
          <AdminHomeTab stats={stats} />
        )}

        <section className="space-y-6 border-t border-border pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-destructive" />
              <div>
                <h2 className="text-2xl font-bold">Denuncias y bloqueos</h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona reportes, suspende temporalmente o bloquea cuentas con notificación al usuario.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Posts/Reposts</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <UserX className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Perfiles</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <Ban className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Sanciones activas</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <Flag className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Listado de denuncias</h3>
            </div>
            <div className="p-8 text-center text-sm text-muted-foreground">
              El listado de denuncias admin se habilitará cuando DoEventsBack exponga el endpoint de moderación.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminReportsPanel;
