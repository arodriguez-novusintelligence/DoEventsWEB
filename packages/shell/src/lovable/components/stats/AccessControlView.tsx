import { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Download, Ticket, ShieldCheck, Percent, XCircle, Users, CheckCircle, X, Check, Clock, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@lovable/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@lovable/components/ui/table';
import type { EventChatRoom } from '@lovable/data/chatData';
import type { CategoryAccessData, SeatAccessInfo, TicketTypeAttendees } from '@lovable/data/accessControlData';
import { getEmptyAccessData, resolveAccessData } from '../../../lovable-bridge/statsAdapter';
import { useLiveEventStats } from '../../../lovable-bridge/useLiveEventStats';
import { exportAccessExcel } from '@lovable/utils/exportAccessExcel';
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
                      {att.name.substring(0, 2).toUpperCase()}
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
  const { data, loading } = useLiveEventStats(event, resolveAccessData, getEmptyAccessData());
  const [selectedCategory, setSelectedCategory] = useState<CategoryAccessData | null>(null);

  const pieData = [
    { name: 'Valid', value: data.accessStatus.valid, color: 'hsl(var(--primary))' },
    { name: 'Invalid', value: data.accessStatus.invalid, color: 'hsl(var(--muted))' },
    { name: 'Duplicate', value: data.accessStatus.duplicate, color: 'hsl(var(--destructive))' },
  ];

  const barData = data.trafficByType.map(t => ({
    name: t.type,
    Concedidos: t.granted,
    Denegados: t.denied,
  }));

  const summaryCards = [
    { label: 'Total\nBoletos', value: data.totalTickets.toLocaleString('es-CO'), icon: Ticket },
    { label: 'Accesos\nConcedidos', value: data.accessGranted.toLocaleString('es-CO'), color: 'text-primary' },
    { label: 'Asistencia', value: `${data.attendance}%`, icon: Percent },
    { label: 'Denegaciones', value: data.denials.toString(), color: 'text-destructive' },
    { label: 'Dentro\nActual', value: data.currentInside.toLocaleString('es-CO'), icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background pt-16 pb-24">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button onClick={onBack} className="text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h1 className="text-base font-bold text-foreground truncate">Control de accesos</h1>
          </div>
          <p className="text-xs text-muted-foreground truncate">{event.eventName}</p>
        </div>
        <button
          onClick={() => exportAccessExcel(data, event.eventName)}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4 space-y-6">
        {loading && (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Cargando control de accesos…
          </p>
        )}
        {!loading && data.totalTickets === 0 && (
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
        {!loading && data.totalTickets > 0 && (
          selectedCategory ? (
          <CategorySeatMap category={selectedCategory} onBack={() => setSelectedCategory(null)} />
        ) : (
          <>
            {/* Summary cards row */}
            <section className="grid grid-cols-5 gap-2">
              {summaryCards.map(card => (
                <div key={card.label} className="flex flex-col items-center rounded-xl border border-border bg-card p-3 text-center">
                  {card.icon && <card.icon className="h-4 w-4 text-muted-foreground mb-1" />}
                  <span className="text-[10px] text-muted-foreground whitespace-pre-line leading-tight">{card.label}</span>
                  <span className={`text-lg font-bold mt-0.5 ${card.color || 'text-card-foreground'}`}>{card.value}</span>
                </div>
              ))}
            </section>

            {/* Donut chart */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold text-foreground mb-4">Estados de Acceso</h2>
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
            </section>

            {/* Bar chart */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold text-foreground mb-4">Tráfico por Tipo de Boleta</h2>
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
                  {(data.categoryAccess.length ? data.categoryAccess : []).slice(0, 3).map((cat) => (
                    <button
                      key={cat.name}
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

                <div className="w-56 rounded-full border border-border bg-muted/30 py-1.5 text-center mt-1">
                  <span className="text-[10px] text-primary font-medium">Pista de Baile</span>
                </div>

                {data.categoryAccess[3] && (
                  <button
                    onClick={() => setSelectedCategory(data.categoryAccess[3])}
                    className="flex flex-col items-center rounded-xl border-2 px-10 py-3 transition-colors hover:bg-accent/30"
                    style={{ borderColor: data.categoryAccess[3].colorHex }}
                  >
                    <Users className="h-3.5 w-3.5 mb-1" style={{ color: data.categoryAccess[3].colorHex }} />
                    <span className="text-xs font-semibold" style={{ color: data.categoryAccess[3].colorHex }}>{data.categoryAccess[3].name}</span>
                    <span className="text-[10px] text-primary font-medium">{data.categoryAccess[3].granted} ✓</span>
                    <span className="text-[10px] text-destructive font-medium">{data.categoryAccess[3].denied} ✗</span>
                    <span className="text-[10px] text-amber-500 font-medium">{data.categoryAccess[3].pending} ⏳</span>
                  </button>
                )}
              </div>
            </section>

            {/* Gate table */}
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-bold text-foreground mb-4">Estado de Acceso por Puerta</h2>
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
                    {data.gates.map(gate => (
                      <TableRow key={gate.name}>
                        <TableCell className="text-sm font-medium text-card-foreground">{gate.name}</TableCell>
                        <TableCell className="text-sm text-center text-muted-foreground">{gate.totalAttempts}</TableCell>
                        <TableCell className="text-sm text-center font-semibold text-primary">{gate.granted}</TableCell>
                        <TableCell className="text-sm text-center font-semibold text-destructive">{gate.denied}</TableCell>
                        <TableCell className="text-sm text-center text-muted-foreground">{gate.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadgeClass[gate.status]}`}>{gate.status}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* Attendees */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-base font-bold text-foreground">Asistentes al Evento</h2>
              </div>
              <div className="space-y-3">
                {data.attendeesByType.map(group => (
                  <AttendeeGroup key={group.type} group={group} />
                ))}
              </div>
            </section>
          </>
        )
        )}
      </div>
    </div>
  );
};

export default AccessControlView;
