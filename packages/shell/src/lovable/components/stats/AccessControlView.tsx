import { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Users,
  X,
  Check,
  Clock,
  Loader2,
  ScanLine,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@lovable/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lovable/components/ui/table';
import type { EventChatRoom } from '@lovable/data/chatData';
import type { CategoryAccessData, SeatAccessInfo, TicketTypeAttendees } from '@lovable/data/accessControlData';
import { getEmptyAccessData, resolveAccessData } from '../../../lovable-bridge/statsAdapter';
import { useLiveEventStats } from '../../../lovable-bridge/useLiveEventStats';
import { exportAccessExcel } from '@lovable/utils/exportAccessExcel';
import StatsSectionBanner from './StatsSectionBanner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AccessControlViewProps {
  event: EventChatRoom;
  onBack: () => void;
}

const statusBadgeClass: Record<string, string> = {
  'Óptimo': 'bg-primary/10 text-primary',
  'Normal': 'bg-muted text-muted-foreground',
  'Alerta': 'bg-destructive/10 text-destructive',
};

const AttendeeGroup = ({ group }: { group: TicketTypeAttendees }) => {
  const [expanded, setExpanded] = useState(group.type === 'VIP');
  const total = group.attendees.length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-accent/30"
      >
        <span className="text-sm font-bold text-card-foreground">{group.type}</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {group.grantedCount}/{total} ({total > 0 ? Math.round((group.grantedCount / total) * 100) : 0}%)
        </span>
        <div className="ml-auto">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-3">
            {group.attendees.map((att, i) => (
              <div key={i} className="flex flex-col items-center gap-1 w-14">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={att.avatar} alt={att.name} />
                    <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                      {(att.name || '?').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                    {att.status === 'granted' && <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />}
                    {att.status === 'denied' && <XCircle className="h-4 w-4 text-destructive fill-destructive/20" />}
                    {att.status === 'pending' && <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                  {att.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Category Seat Map Detail ── */
const CategorySeatMap = ({ category, onBack }: { category: CategoryAccessData; onBack: () => void }) => {
  const [selectedSeat, setSelectedSeat] = useState<SeatAccessInfo | null>(null);

  const rows = category.seats.reduce<Record<string, SeatAccessInfo[]>>((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const getSeatIcon = (seat: SeatAccessInfo) => {
    if (!seat.sold) return <span className="text-[10px] text-muted-foreground">{seat.number}</span>;
    if (seat.accessStatus === 'granted') return <Check className="h-4 w-4 text-white" />;
    if (seat.accessStatus === 'denied') return <X className="h-4 w-4 text-white" />;
    return <Clock className="h-3.5 w-3.5 text-white" />;
  };

  const getSeatColor = (seat: SeatAccessInfo) => {
    if (!seat.sold) return undefined;
    if (seat.accessStatus === 'granted') return '#22c55e';
    if (seat.accessStatus === 'denied') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <>
      <div className="rounded-2xl bg-card p-4 shadow-sm mb-4">
        <button onClick={onBack} className="flex items-center gap-2 mb-3">
          <ChevronLeft className="h-4 w-4 text-foreground" />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.colorHex }} />
          <span className="text-sm font-bold text-foreground">{category.name}</span>
        </button>

        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-muted/50 p-2.5">
            <span className="text-lg font-bold text-foreground">{category.total}</span>
            <span className="text-[10px] text-muted-foreground">Total</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-primary/10 p-2.5">
            <span className="text-lg font-bold text-primary">{category.granted}</span>
            <span className="text-[10px] text-primary">Accedidos</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-destructive/10 p-2.5">
            <span className="text-lg font-bold text-destructive">{category.denied}</span>
            <span className="text-[10px] text-destructive">Denegados</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-amber-500/10 p-2.5">
            <span className="text-lg font-bold text-amber-500">{category.pending}</span>
            <span className="text-[10px] text-amber-500">Pendientes</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-1">Mapa de sillería — Accesos</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Toca un asiento para ver detalles del acceso</p>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-green-500"><Check className="h-3 w-3 text-white" /></span>
            <span className="text-[11px] text-muted-foreground">Accedió</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-destructive"><X className="h-3 w-3 text-white" /></span>
            <span className="text-[11px] text-muted-foreground">Denegado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500"><Clock className="h-3 w-3 text-white" /></span>
            <span className="text-[11px] text-muted-foreground">Pendiente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-muted border border-border" />
            <span className="text-[11px] text-muted-foreground">Sin vender</span>
          </div>
        </div>

        {/* Seat grid */}
        <div className="flex flex-col items-center gap-2">
          {Object.entries(rows).map(([row, seats]) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-xs font-medium text-muted-foreground text-center">{row}</span>
              <div className="flex gap-1.5">
                {seats.map(seat => (
                  <button
                    key={`${seat.row}${seat.number}`}
                    onClick={() => seat.sold && setSelectedSeat(seat)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      seat.sold
                        ? 'shadow-sm cursor-pointer hover:opacity-80'
                        : 'bg-muted border border-border cursor-default'
                    }`}
                    style={seat.sold ? { backgroundColor: getSeatColor(seat) } : undefined}
                  >
                    {getSeatIcon(seat)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected seat info */}
        {selectedSeat && (
          <div className="mt-4 rounded-xl border border-border bg-accent/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Asiento <span className="font-semibold text-foreground">{selectedSeat.row}{selectedSeat.number}</span>
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{selectedSeat.buyerName}</p>
            <p className="text-xs mt-1">
              {selectedSeat.accessStatus === 'granted' && <span className="text-primary font-medium">✓ Acceso concedido</span>}
              {selectedSeat.accessStatus === 'denied' && <span className="text-destructive font-medium">✗ Acceso denegado</span>}
              {selectedSeat.accessStatus === 'pending' && <span className="text-amber-500 font-medium">⏳ Pendiente</span>}
            </p>
            <button onClick={() => setSelectedSeat(null)} className="mt-2 text-[11px] text-primary hover:underline">Cerrar</button>
          </div>
        )}
      </div>
    </>
  );
};

const AccessControlView = ({ event, onBack }: AccessControlViewProps) => {
  const { data, loading, loadError, reload } = useLiveEventStats(
    event,
    resolveAccessData,
    getEmptyAccessData(),
    undefined,
    'access',
  );
  const [selectedCategory, setSelectedCategory] = useState<CategoryAccessData | null>(null);

  const accessStatus = data.accessStatus ?? { valid: 0, invalid: 0, duplicate: 0 };
  const pieData = [
    { name: 'Valid', value: accessStatus.valid || 0, color: 'hsl(var(--primary))' },
    { name: 'Invalid', value: accessStatus.invalid || 0, color: 'hsl(var(--muted))' },
    { name: 'Duplicate', value: accessStatus.duplicate || 0, color: 'hsl(var(--destructive))' },
  ].filter((entry) => entry.value > 0);

  const barData = (data.trafficByType || []).map((t) => ({
    name: t.type,
    Concedidos: t.granted,
    Denegados: t.denied,
  }));

  const categoryAccess = data.categoryAccess || [];
  const gates = data.gates || [];
  const attendeesByType = data.attendeesByType || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <StatsSectionBanner
        title="Control de Accesos"
        subtitle={event.eventName}
        icon={ScanLine}
        onBack={onBack}
        stats={[
          { value: loading ? '…' : data.totalTickets.toLocaleString('es-CO'), label: 'Boletos' },
          { value: loading ? '…' : data.accessGranted.toLocaleString('es-CO'), label: 'Concedidos' },
          { value: loading ? '…' : `${data.attendance}%`, label: 'Asistencia' },
        ]}
        summary={
          <>
            Dentro ahora:{' '}
            <span className="font-bold">{loading ? '…' : data.currentInside.toLocaleString('es-CO')}</span>
            {' · '}
            Denegaciones:{' '}
            <span className="font-bold">{loading ? '…' : data.denials}</span>
          </>
        }
        rightAction={(
          <button
            type="button"
            onClick={() => exportAccessExcel(data, event.eventName)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary-foreground/25"
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </button>
        )}
      />

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-5">
        {loading && (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Cargando control de accesos…
          </p>
        )}
        {loadError && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground">No se pudieron cargar los accesos</p>
            <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 rounded-full"
              onClick={reload}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
          </div>
        )}
        {!loading && !loadError && data.totalTickets === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Sin datos de acceso</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cuando se registren escaneos QR para este evento, verás métricas aquí.
            </p>
          </div>
        )}
        {!loading && !loadError && data.totalTickets > 0 && (
          selectedCategory ? (
          <CategorySeatMap category={selectedCategory} onBack={() => setSelectedCategory(null)} />
        ) : (
          <>
            {/* Donut chart */}
            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-foreground mb-4">Estados de Acceso</h2>
              {pieData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aún no hay escaneos registrados. Los {data.totalTickets} boletos están pendientes de acceso.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" formatter={(value) => {
                      const item = pieData.find(d => d.name === value);
                      return <span className="text-xs text-muted-foreground">{value}: {item?.value}</span>;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Bar chart */}
            <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <h2 className="text-base font-extrabold text-foreground mb-4">Tráfico por Tipo de Boleta</h2>
              {barData.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Sin tráfico por categoría aún.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="Concedidos" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Denegados" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            {/* Venue Map — Access */}
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-bold text-foreground mb-1">Mapa de sillería por categoría</h2>
              <p className="text-[11px] text-muted-foreground mb-4">Selecciona una categoría para ver el detalle de accesos</p>

              <div className="flex flex-col items-center gap-3">
                <div className="w-48 rounded-lg border-2 border-border bg-muted/50 py-3 text-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escenario</span>
                </div>

                <div className="flex gap-2 mt-2">
                  {categoryAccess.slice(0, 3).map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className="flex flex-col items-center rounded-xl border-2 p-3 transition-colors hover:bg-accent/30"
                      style={{ borderColor: cat.colorHex }}
                    >
                      <Users className="h-3.5 w-3.5 mb-1" style={{ color: cat.colorHex }} />
                      <span className="text-xs font-semibold" style={{ color: cat.colorHex }}>{cat.name}</span>
                      <span className="text-[10px] text-primary font-medium">{cat.granted} ✓</span>
                      <span className="text-[10px] text-destructive font-medium">{cat.denied} ✗</span>
                      <span className="text-[10px] text-amber-500 font-medium">{cat.pending} ⏳</span>
                    </button>
                  ))}
                </div>

                {categoryAccess.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground">Sin categorías de acceso aún.</p>
                )}

                <div className="w-56 rounded-full border border-border bg-muted/30 py-1.5 text-center mt-1">
                  <span className="text-[10px] text-primary font-medium">Pista de Baile</span>
                </div>

                {categoryAccess[3] && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(categoryAccess[3])}
                    className="flex flex-col items-center rounded-xl border-2 px-10 py-3 transition-colors hover:bg-accent/30"
                    style={{ borderColor: categoryAccess[3].colorHex }}
                  >
                    <Users className="h-3.5 w-3.5 mb-1" style={{ color: categoryAccess[3].colorHex }} />
                    <span className="text-xs font-semibold" style={{ color: categoryAccess[3].colorHex }}>{categoryAccess[3].name}</span>
                    <span className="text-[10px] text-primary font-medium">{categoryAccess[3].granted} ✓</span>
                    <span className="text-[10px] text-destructive font-medium">{categoryAccess[3].denied} ✗</span>
                    <span className="text-[10px] text-amber-500 font-medium">{categoryAccess[3].pending} ⏳</span>
                  </button>
                )}
              </div>
            </section>

            {/* Gate table */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold text-foreground mb-4">Estado de Acceso por Puerta</h2>
              {gates.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin puertas registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Puerta</TableHead>
                        <TableHead className="text-xs text-center">Total Intentos</TableHead>
                        <TableHead className="text-xs text-center">Concedidos</TableHead>
                        <TableHead className="text-xs text-center">Denegados</TableHead>
                        <TableHead className="text-xs text-center">Porcentaje</TableHead>
                        <TableHead className="text-xs text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gates.map((gate) => (
                        <TableRow key={gate.name}>
                          <TableCell className="text-sm font-medium text-card-foreground">{gate.name}</TableCell>
                          <TableCell className="text-sm text-center text-muted-foreground">{gate.totalAttempts}</TableCell>
                          <TableCell className="text-sm text-center font-semibold text-primary">{gate.granted}</TableCell>
                          <TableCell className="text-sm text-center font-semibold text-destructive">{gate.denied}</TableCell>
                          <TableCell className="text-sm text-center text-muted-foreground">{gate.percentage}%</TableCell>
                          <TableCell className="text-center">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadgeClass[gate.status] || statusBadgeClass.Normal}`}>{gate.status}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            {/* Attendees */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base font-bold text-foreground">Asistentes al Evento</h2>
              </div>
              {attendeesByType.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Sin asistentes registrados.</p>
              ) : (
                <div className="space-y-3">
                  {attendeesByType.map((group) => (
                    <AttendeeGroup key={group.type} group={group} />
                  ))}
                </div>
              )}
            </section>
          </>
        )
        )}
      </div>
    </div>
  );
};

export default AccessControlView;
