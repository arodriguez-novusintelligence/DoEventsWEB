import React from 'react';
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  DollarSign,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { AdminDashboardStats } from '@doevents/shared';
import { StatCard, formatCop } from '../AdminLayout';

interface Props {
  stats: AdminDashboardStats | null;
}

export const AdminHomeTab: React.FC<Props> = ({ stats }) => {
  const kpis = stats?.homeKpis;
  const changes = kpis?.changes;

  const kpiCards = [
    {
      title: 'Eventos activos',
      value: kpis?.activeEvents ?? stats?.publishedEvents ?? 0,
      change: changes?.activeEvents ?? 0,
      icon: CalendarDays,
    },
    {
      title: 'Boletos vendidos hoy',
      value: kpis?.ticketsSoldToday ?? 0,
      change: changes?.ticketsSoldToday ?? 0,
      icon: Ticket,
    },
    {
      title: 'Ingresos del día',
      value: formatCop(kpis?.revenueTodayCop ?? stats?.revenueTodayCop ?? 0),
      change: changes?.revenueTodayCop ?? 0,
      icon: DollarSign,
    },
    {
      title: 'Usuarios registrados',
      value: kpis?.totalUsers ?? stats?.totalUsers ?? 0,
      change: changes?.totalUsers ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Resumen general</h2>
          <p className="text-sm text-muted-foreground">Vista en vivo de la plataforma</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-3">
          <div className="flex items-center gap-4">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Usuarios activos</p>
              <p className="font-mono text-2xl font-bold tabular-nums">{(stats?.activeUsers ?? 0).toLocaleString('es-CO')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const positive = kpi.change >= 0;
          return (
            <StatCard
              key={kpi.title}
              label={kpi.title}
              value={kpi.value}
              hint={
                kpi.change !== 0
                  ? `${positive ? '+' : ''}${kpi.change}% vs ayer`
                  : 'Sin variación vs ayer'
              }
              accent={positive ? 'emerald' : 'destructive'}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Eventos recientes</h3>
          </div>
          <div className="space-y-3 p-4">
            {(stats?.recentEvents || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No hay eventos recientes.</p>
            )}
            {(stats?.recentEvents || []).map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.name}</p>
                  <p className="text-xs text-muted-foreground">{event.organizer} · {event.date}</p>
                </div>
                <div className="ml-3 flex items-center gap-3">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{event.sold}/{event.total}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    event.status === 'activo' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {event.status === 'activo' ? 'Activo' : 'Finalizado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Transacciones</h3>
          </div>
          <div className="space-y-3 p-4">
            {(stats?.recentTransactions || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No hay transacciones recientes.</p>
            )}
            {(stats?.recentTransactions || []).map((txn) => (
              <div key={txn.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{txn.event}</p>
                  <p className="text-xs text-muted-foreground">{txn.id} · {txn.date}</p>
                </div>
                <div className="ml-3 flex items-center gap-3">
                  <span className="whitespace-nowrap text-sm font-medium">{formatCop(txn.amount)}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    txn.type === 'ingreso' ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}>
                    {txn.type === 'ingreso' ? 'Ingreso' : 'Dispersión'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Top organizadores</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {(stats?.topOrganizers || []).length === 0 && (
            <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">Sin datos de organizadores aún.</p>
          )}
          {(stats?.topOrganizers || []).map((org) => (
            <div key={org.name} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {org.rank}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.events} eventos · {org.occupancy}% ocup.</p>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                  {formatCop(org.revenueCop)}
                  <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminHomeTab;
