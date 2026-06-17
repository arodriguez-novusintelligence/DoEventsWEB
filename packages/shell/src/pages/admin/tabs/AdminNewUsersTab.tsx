import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, Download, Search, Star, TrendingDown, TrendingUp, UserPlus, Users, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchAdminNewUsers, useToast, type AdminNewUserItem } from '@doevents/shared';

type Period = 'today' | 'yesterday' | '7d' | 'all';

const COLORS = ['#6979F8', '#8B97FA', '#f59e0b', '#ef4444'];

export const AdminNewUsersTab: React.FC = () => {
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>('today');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ today: 0, yesterday: 0, week: 0, change: 0 });
  const [dailySeries, setDailySeries] = useState<Array<{ day: string; current: number; previous: number }>>([]);
  const [trend, setTrend] = useState<Array<{ label: string; count: number }>>([]);
  const [sources, setSources] = useState<Array<{ name: string; value: number }>>([]);
  const [users, setUsers] = useState<AdminNewUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchAdminNewUsers(period)
      .then((data) => {
        setStats(data.stats);
        setDailySeries(data.dailySeries || []);
        setTrend(data.trend || []);
        setSources(data.sources || []);
        setUsers(data.users || []);
      })
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error al cargar nuevos usuarios', 'error'))
      .finally(() => setLoading(false));
  }, [period, showToast]);

  const filtered = users.filter((user) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${user.fullName || ''} ${user.email || ''}`.toLowerCase().includes(q);
  });

  const currentTotal = dailySeries.reduce((sum, row) => sum + row.current, 0);
  const previousTotal = dailySeries.reduce((sum, row) => sum + row.previous, 0);
  const delta = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  const exportExcel = () => {
    const rows = filtered.map((user) => ({
      Nombre: user.fullName || user.nombre,
      Email: user.email,
      Registro: user.createdAt,
      Origen: user.authSource,
      Plan: user.plan,
      Eventos: user.eventsCount ?? 0,
      Boletos: user.ticketsBought ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, `nuevos_usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Nuevos usuarios</h2>
          <p className="text-sm text-muted-foreground">Registro diario desde la tabla de clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Hoy" value={stats.today} hint={`${stats.change >= 0 ? '+' : ''}${stats.change}% vs ayer`} positive={stats.change >= 0} icon={UserPlus} />
        <MetricCard label="Ayer" value={stats.yesterday} icon={Calendar} />
        <MetricCard label="7 días" value={stats.week} icon={TrendingUp} />
        <MetricCard label="Mostrados" value={filtered.length} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Registros — comparativo</h3>
            </div>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
              delta >= 0 ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
            }`}>
              {delta >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {delta}%
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" name="Actual" fill="#6979F8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-lg font-bold">Origen</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={(e) => `${e.name}: ${e.value}`}>
                  {sources.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-lg font-bold">Tendencia 14 días</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6979F8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {([
              ['today', 'Hoy'],
              ['yesterday', 'Ayer'],
              ['7d', '7 días'],
              ['all', 'Todos'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriod(id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  period === id ? 'bg-primary text-primary-foreground' : 'border border-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className="rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-sm md:w-72"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" onClick={exportExcel} className="inline-flex items-center rounded-xl border border-border px-3 py-2 text-xs font-semibold">
              <Download className="mr-1 h-4 w-4" />
              Excel
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <h3 className="text-lg font-bold">Listado</h3>
        </div>
        <div className="overflow-x-auto p-4">
          {loading && <p className="text-sm text-muted-foreground">Cargando usuarios...</p>}
          {!loading && filtered.length === 0 && <p className="text-sm text-muted-foreground">Sin usuarios para el período seleccionado.</p>}
          {filtered.length > 0 && (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <th className="py-2">Usuario</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Registro</th>
                  <th className="py-2">Origen</th>
                  <th className="py-2 text-center">Rating</th>
                  <th className="py-2 text-right">Eventos</th>
                  <th className="py-2 text-right">Boletos</th>
                  <th className="py-2">Plan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.userId} className="border-b border-border/60">
                    <td className="py-3">
                      <p className="font-medium">{user.fullName || user.nombre || user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.username || user.userId}</p>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{user.email}</td>
                    <td className="py-3 text-xs whitespace-nowrap">{user.createdAt || '—'}</td>
                    <td className="py-3"><span className="rounded-full border border-border px-2 py-0.5 text-xs">{user.authSource || 'Email'}</span></td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{(user.rating ?? 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">{user.eventsCount ?? 0}</td>
                    <td className="py-3 text-right font-medium">{user.ticketsBought ?? 0}</td>
                    <td className="py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{user.plan || 'free'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

function MetricCard({
  label,
  value,
  hint,
  positive,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint?: string;
  positive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {hint && <p className={`mt-1 text-xs ${positive ? 'text-emerald-600' : 'text-destructive'}`}>{hint}</p>}
        </div>
        <Icon className="h-8 w-8 text-primary/60" />
      </div>
    </div>
  );
}

export default AdminNewUsersTab;
