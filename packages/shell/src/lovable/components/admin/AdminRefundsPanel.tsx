import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Landmark,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  fetchEventRefundsStatistics,
  useToast,
  type EventRefundsStatisticsResponse,
} from '@doevents/shared';
import { cn } from '@lovable/lib/utils';
import { formatCop } from '../../../pages/admin/AdminLayout';

type FilterId = 'all' | 'pending';

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Con pendientes' },
];

/** Panel de reembolsos — UI Lovable + `fetchEventRefundsStatistics` real. */
export const AdminRefundsPanel = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('all');
  const [data, setData] = useState<EventRefundsStatisticsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchEventRefundsStatistics({ limit: 100 });
      setData(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar reembolsos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const events = data?.events || [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    if (filter === 'pending') return events.filter((ev) => ev.pendingCount > 0);
    return events;
  }, [events, filter]);

  const global = useMemo(() => ({
    events: summary?.totalEventsAffected ?? events.length,
    pending: summary?.totalPendingRefunds ?? events.reduce((s, e) => s + e.pendingCount, 0),
    completed: summary?.totalCompletedRefunds ?? events.reduce((s, e) => s + e.completedCount, 0),
    rejected: summary?.totalRejectedRefunds ?? events.reduce((s, e) => s + e.rejectedCount, 0),
    totalAmount: summary?.totalCompletedAmount ?? events.reduce((s, e) => s + e.completedAmount, 0),
    pendingAmount: summary?.totalPendingAmount ?? events.reduce((s, e) => s + e.pendingAmount, 0),
  }), [events, summary]);

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
            <RefreshCw className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reembolsos</h1>
            <p className="text-sm text-primary-foreground/80">
              Eventos con solicitudes de reembolso, organizados por fecha del evento
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-5 p-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent/50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Actualizar
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando reembolsos…</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Eventos</p>
                <p className="text-xl font-bold">{global.events}</p>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Pendientes</p>
                <p className="text-xl font-bold text-amber-700">{global.pending}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Completados</p>
                <p className="text-xl font-bold text-primary">{global.completed}</p>
              </div>
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">Rechazados</p>
                <p className="text-xl font-bold text-destructive">{global.rejected}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Total reembolsado</p>
                <p className="text-lg font-bold text-primary">{formatCop(global.totalAmount)}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Landmark className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Monto pendiente</span>
                </div>
                <p className="text-lg font-bold text-amber-600">{formatCop(global.pendingAmount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    filter === f.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No hay eventos con reembolsos que coincidan con el filtro.
                </div>
              )}
              {filtered.map((ev) => (
                <div
                  key={ev.eventId}
                  className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <RefreshCw className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{ev.eventName || ev.eventId}</p>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      {ev.eventStatus && (
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {ev.eventStatus}
                          </span>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ev.pendingCount > 0 && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            {ev.pendingCount} pendiente{ev.pendingCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {ev.completedCount > 0 && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                            {ev.completedCount} procesada{ev.completedCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {ev.rejectedCount > 0 && (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                            {ev.rejectedCount} rechazada{ev.rejectedCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
                        <div>
                          <p className="text-muted-foreground">Pendiente</p>
                          <p className="font-semibold">{formatCop(ev.pendingAmount)}</p>
                        </div>
                        <div>
                          <p className="inline-flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            Completado
                          </p>
                          <p className="font-semibold text-primary">{formatCop(ev.completedAmount)}</p>
                        </div>
                        {ev.pendingCount > 0 && (
                          <div>
                            <p className="inline-flex items-center gap-1 text-muted-foreground">
                              <AlertTriangle className="h-3 w-3" />
                              Solicitudes
                            </p>
                            <p className="font-semibold text-amber-700">{ev.pendingCount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRefundsPanel;
