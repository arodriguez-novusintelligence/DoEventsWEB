import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, BedDouble, ChevronLeft, ChevronRight, Download, LineChart,
  Loader2, Percent, Users, CalendarDays, AlertCircle,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { toast } from 'sonner';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import {
  formatRentalMoney,
  MONTH_LABELS_ES,
  MONTH_NAMES_ES,
  type RentalStatisticsPayload,
} from '@doevents/shared';
import { cn } from '@lovable/lib/utils';
import type { User } from '@lovable/data/';

export interface RentalStatsEntity {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
}

interface RentalStatsViewProps {
  entity: RentalStatsEntity;
  entityType: 'venue' | 'service';
  nightsLabel?: string;
  onBack: () => void;
  onViewProfile?: (user: User | { name: string; initials: string; id?: string }) => void;
  loadStats: (id: string, year: number, month: number) => Promise<RentalStatisticsPayload>;
  exportStats: (id: string, name: string) => Promise<void>;
}

const formatDay = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const RentalStatsView = ({
  entity,
  entityType,
  nightsLabel = 'Noches',
  onBack,
  onViewProfile,
  loadStats,
  exportStats,
}: RentalStatsViewProps) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [mode, setMode] = useState<'performance' | 'comparison'>('performance');
  const [data, setData] = useState<RentalStatisticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await loadStats(entity.id, year, month);
      setData(payload);
      setYear(payload.year);
      setMonth(payload.month);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las estadísticas');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [entity.id, loadStats, month, year]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const chartData = useMemo(() => {
    if (!data) return [];
    if (mode === 'comparison') {
      return data.comparison.series.map((row) => ({
        label: row.label,
        current: row.current,
        previous: row.previous,
      }));
    }
    return data.monthly.map((row) => ({
      label: row.label,
      received: row.received,
      pending: row.pending,
      total: row.received + row.pending,
    }));
  }, [data, mode]);

  const calendarCells = useMemo(() => {
    if (!data) return [];
    const firstDay = new Date(data.calendar.year, data.calendar.month - 1, 1);
    const daysInMonth = new Date(data.calendar.year, data.calendar.month, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const reserved = new Set(data.calendar.reservedDates);
    const cells: Array<{ day?: number; reserved?: boolean }> = [];
    for (let i = 0; i < startOffset; i += 1) cells.push({});
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${data.calendar.year}-${String(data.calendar.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, reserved: reserved.has(iso) });
    }
    return cells;
  }, [data]);

  const shiftMonth = (delta: number) => {
    const date = new Date(year, month - 1 + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportStats(entity.id, entity.name);
      toast.success(`Excel descargado · ${data?.reservations.length || 0} pagos incluidos`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo exportar');
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <ProfileSectionBanner
        title={entity.name}
        subtitle={entity.subtitle || (entityType === 'venue' ? 'Lugar' : 'Servicio')}
        icon={entityType === 'venue' ? BedDouble : BarChart3}
        onBack={onBack}
        rightAction={(
          <button
            type="button"
            onClick={() => { void handleExport(); }}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary-foreground/25 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Excel de ingresos
          </button>
        )}
      />

      <div className="mx-auto max-w-lg px-4 -mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: BedDouble, label: nightsLabel, value: summary?.nights ?? 0 },
            { icon: Users, label: 'Media/estancia', value: summary?.avgStay ?? 0 },
            { icon: Percent, label: 'Ocupación', value: `${summary?.occupancyPercent ?? 0}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-card p-3 text-center shadow-sm">
              <item.icon className="mx-auto h-4 w-4 text-primary" />
              <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-1 shadow-sm">
          {([
            { id: 'performance' as const, label: 'Rendimiento', icon: BarChart3 },
            { id: 'comparison' as const, label: 'Comparación', icon: LineChart },
          ]).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
                mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-foreground">
              {mode === 'performance' ? 'Rendimiento' : 'Comparación de ingresos'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === 'performance' ? 'Vista mensual' : `${year} vs. ${year - 1}`}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Cargando estadísticas…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {mode === 'performance' ? (
                    <BarChart data={chartData} barCategoryGap="18%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => formatRentalMoney(Number(v))} width={56} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => formatRentalMoney(value)} />
                      <Bar dataKey="received" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pending" stackId="a" fill="hsl(var(--primary) / 0.35)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <ReLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => formatRentalMoney(Number(v))} width={56} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => formatRentalMoney(value)} />
                      <Line type="monotone" dataKey="current" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="previous" stroke="hsl(var(--primary) / 0.35)" strokeDasharray="5 5" dot={false} />
                    </ReLineChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {MONTH_LABELS_ES.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setMonth(idx + 1)}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold',
                      month === idx + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    Cobros recibidos
                  </span>
                  <span className="font-semibold">{formatRentalMoney(data?.selectedMonth.received || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/35" />
                    Cobros pendientes
                  </span>
                  <span className="font-semibold">{formatRentalMoney(data?.selectedMonth.pending || 0)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="flex items-center gap-2 font-semibold text-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
                    Total {MONTH_NAMES_ES[month - 1]}
                  </span>
                  <span className="font-bold">{formatRentalMoney(data?.selectedMonth.total || 0)}</span>
                </div>
                {mode === 'comparison' && (
                  <p className="text-xs text-muted-foreground">
                    {MONTH_NAMES_ES[month - 1]} {year - 1}: {formatRentalMoney(data?.selectedMonth.previousYearTotal || 0)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Calendario de reservas</h3>
              <p className="text-xs text-muted-foreground">
                {MONTH_NAMES_ES[month - 1]} {year} · {data?.calendar.nights || 0} {nightsLabel.toLowerCase()}
              </p>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={() => shiftMonth(-1)} className="rounded-full p-1 hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => shiftMonth(1)} className="rounded-full p-1 hover:bg-muted">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => (
              <div
                key={`${cell.day || 'e'}-${idx}`}
                className={cn(
                  'flex h-8 items-center justify-center rounded-full text-xs',
                  cell.day && cell.reserved && 'bg-primary text-primary-foreground font-semibold',
                  cell.day && !cell.reserved && 'bg-muted/60 text-muted-foreground',
                )}
              >
                {cell.day || ''}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-3 w-6 rounded-full bg-primary" /> Reservado</span>
            <span className="flex items-center gap-1"><span className="h-3 w-6 rounded-full bg-muted" /> Disponible</span>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            Reservas de {MONTH_NAMES_ES[month - 1]}
          </h3>
          {!data?.reservations.length ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin reservas en este mes</p>
          ) : (
            <div className="space-y-3">
              {data.reservations.map((row) => (
                <div key={row.bookingId} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {row.guestName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    {row.guestUserId && onViewProfile ? (
                      <button
                        type="button"
                        onClick={() => onViewProfile({
                          id: row.guestUserId!,
                          name: row.guestName,
                          initials: row.guestName.charAt(0).toUpperCase(),
                        })}
                        className="truncate text-sm font-semibold text-primary text-left hover:underline"
                      >
                        {row.guestName}
                      </button>
                    ) : (
                      <p className="truncate text-sm font-semibold text-foreground">{row.guestName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDay(row.startDate)} → {formatDay(row.endDate)} · {row.nights} {nightsLabel.toLowerCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatRentalMoney(row.amount)}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{row.statusLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalStatsView;
