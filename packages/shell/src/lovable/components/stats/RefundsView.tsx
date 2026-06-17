import { useMemo, useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronDown, ChevronUp, RefreshCw, CheckCircle2, XCircle,
  Clock, ShieldCheck, AlertTriangle, Mail, Phone, Calendar, Ticket, Filter,
  Building2, Landmark, Wallet, Info, User, CalendarX, Download,
} from 'lucide-react';
import { exportRefundsExcel } from '@lovable/utils/exportRefundsExcel';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Button } from '@lovable/components/ui/button';
import { cn } from '@lovable/lib/utils';
import type { EventChatRoom } from '@lovable/data/chatData';
import type { RefundRequest, RefundStatus, RefundSource } from '@lovable/data/refundsData';
import { getEmptyRefundsData, resolveRefundsData } from '../../../lovable-bridge/statsAdapter';
import { useLiveEventStats } from '../../../lovable-bridge/useLiveEventStats';

interface RefundsViewProps {
  event: EventChatRoom;
  onBack: () => void;
}

const formatCurrency = (n: number, c = 'COP') =>
  `${c === 'USD' ? 'US$' : c === 'EUR' ? '€' : '$'} ${n.toLocaleString('es-CO')}`;

const statusMeta: Record<RefundStatus, { label: string; icon: typeof Clock; className: string; dot: string }> = {
  pending:   { label: 'Pendiente', icon: Clock,        className: 'bg-amber-500/10 text-amber-600',   dot: 'bg-amber-500' },
  approved:  { label: 'Aprobado',  icon: CheckCircle2, className: 'bg-primary/10 text-primary',       dot: 'bg-primary' },
  rejected:  { label: 'Rechazado', icon: XCircle,      className: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  processed: { label: 'Procesado', icon: ShieldCheck,  className: 'bg-emerald-500/10 text-emerald-600', dot: 'bg-emerald-500' },
};

const sourceMeta: Record<RefundSource, { label: string; icon: typeof User; className: string; bgClass: string }> = {
  user_request:       { label: 'Solicitud de usuario', icon: User,       className: 'text-muted-foreground', bgClass: 'bg-muted border-border' },
  event_cancellation: { label: 'Cancelación de evento', icon: CalendarX, className: 'text-destructive',    bgClass: 'bg-destructive/10 border-destructive/30' },
};

const FILTERS: Array<{ id: 'all' | RefundStatus; label: string }> = [
  { id: 'all',       label: 'Todas' },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'approved',  label: 'Aprobadas' },
  { id: 'rejected',  label: 'Rechazadas' },
  { id: 'processed', label: 'Procesadas' },
];

const RefundsView = ({ event, onBack }: RefundsViewProps) => {
  const { data: initial, loading } = useLiveEventStats(
    event,
    resolveRefundsData,
    getEmptyRefundsData(event),
  );
  // Reglas de negocio:
  // 0) Ningún reembolso dentro de política puede estar Rechazado: si llega así,
  //    se reclasifica como Aprobado para que sea gestionado.
  // 1) Reembolsos asumidos por la plataforma (dentro de política) y pendientes
  //    -> se aprueban automáticamente.
  // 2) Reembolsos de plataforma aprobados se procesan automáticamente al
  //    cumplirse el plazo comprometido (5 días hábiles desde la solicitud).
  const autoManaged = useMemo(
    () => initial.requests.map(r => {
      let next = r;
      if (next.withinPolicy && next.status === 'rejected') {
        next = { ...next, status: 'approved' as RefundStatus };
      }
      if (next.payer === 'platform' && next.withinPolicy) {
        const deadlineReached = next.businessDaysRemaining <= 0;
        if (next.status === 'pending') {
          next = { ...next, status: (deadlineReached ? 'processed' : 'approved') as RefundStatus };
        } else if (next.status === 'approved' && deadlineReached) {
          next = { ...next, status: 'processed' as RefundStatus };
        }
      }
      return next;
    }),
    [initial.requests],
  );
  const [requests, setRequests] = useState<RefundRequest[]>(autoManaged);
  const [filter, setFilter] = useState<'all' | RefundStatus>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setRequests(autoManaged);
  }, [autoManaged]);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const stats = useMemo(() => {
    const pending   = requests.filter(r => r.status === 'pending').length;
    const approved  = requests.filter(r => r.status === 'approved').length;
    const rejected  = requests.filter(r => r.status === 'rejected').length;
    const processed = requests.filter(r => r.status === 'processed').length;
    const paidStates = (r: RefundRequest) => r.status === 'approved' || r.status === 'processed';
    const totalAmt  = requests.filter(paidStates).reduce((s, r) => s + r.totalAmount, 0);
    const platformAmt = requests.filter(r => paidStates(r) && r.payer === 'platform').reduce((s, r) => s + r.totalAmount, 0);
    const organizerAmt = requests.filter(r => paidStates(r) && r.payer === 'organizer').reduce((s, r) => s + r.totalAmount, 0);
    const caseByCase = requests.filter(r => r.requiresOrganizerReview && r.status === 'pending').length;
    return { pending, approved, rejected, processed, totalAmt, platformAmt, organizerAmt, caseByCase };
  }, [requests]);

  const updateStatus = (id: string, status: RefundStatus) =>
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      // Salvaguarda: nunca rechazar una solicitud dentro de política
      if (status === 'rejected' && r.withinPolicy) return r;
      return { ...r, status };
    }));

  return (
    <div className="min-h-screen bg-background pt-16 pb-20">
      {/* Header */}
      <div className="bg-primary px-6 pb-6 pt-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <RefreshCw className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-primary-foreground line-clamp-1">Solicitudes de reembolso</h2>
            <p className="text-xs text-primary-foreground/70 line-clamp-1">{event.eventName}</p>
          </div>
          <button
            onClick={() => exportRefundsExcel(initial, requests)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 text-primary-foreground transition-colors hover:bg-primary-foreground/25"
            aria-label="Descargar Excel"
            title="Descargar Excel"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {/* Policy banner */}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-foreground/10 p-3 text-primary-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Política del evento: </span>
            <span className="opacity-90">{initial.policyLabel}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-5">
        {loading && (
          <p className="mb-4 py-4 text-center text-sm text-muted-foreground">Cargando reembolsos…</p>
        )}
        {/* KPIs */}
        <div className="mb-5 grid grid-cols-4 gap-2">
          {([
            { label: 'Pendientes', value: stats.pending,   className: statusMeta.pending.className },
            { label: 'Aprobadas',  value: stats.approved,  className: statusMeta.approved.className },
            { label: 'Procesadas', value: stats.processed, className: statusMeta.processed.className },
            { label: 'Rechazadas', value: stats.rejected,  className: statusMeta.rejected.className },
          ] as const).map(k => (
            <div key={k.label} className="flex flex-col items-center rounded-xl bg-card p-3 shadow-sm">
              <span className="text-xl font-bold text-card-foreground">{k.value}</span>
              <span className={cn('mt-1 rounded-full px-2 py-0.5 text-[9px] font-medium', k.className)}>{k.label}</span>
            </div>
          ))}
        </div>

        {/* Total reembolsado */}
        <div className="mb-3 rounded-2xl bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total reembolsado (aprobado + procesado)</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(stats.totalAmt, initial.currency)}</p>
        </div>

        {/* Distribución del costo */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 text-primary">
              <Landmark className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">Asume Plataforma</span>
            </div>
            <p className="mt-1 text-base font-bold text-primary">{formatCurrency(stats.platformAmt, initial.currency)}</p>
            <p className="text-[10px] text-muted-foreground">Post-evento dentro de política</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">Asume Organizador</span>
            </div>
            <p className="mt-1 text-base font-bold text-amber-600">{formatCurrency(stats.organizerAmt, initial.currency)}</p>
            <p className="text-[10px] text-muted-foreground">Pre-evento o fuera de política</p>
          </div>
        </div>

        {stats.caseByCase > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs">
              <span className="font-semibold">{stats.caseByCase}</span> solicitud{stats.caseByCase !== 1 ? 'es' : ''} pendiente{stats.caseByCase !== 1 ? 's' : ''} de evaluación caso a caso por el organizador.
            </p>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filter === f.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtered.map(req => {
            const meta = statusMeta[req.status];
            const StatusIcon = meta.icon;
            const isOpen = expanded === req.id;
            return (
              <div key={req.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <button
                  onClick={() => setExpanded(isOpen ? null : req.id)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/30"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={req.buyerAvatar} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {req.buyerName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-card-foreground">{req.buyerName}</p>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', meta.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {(() => {
                        const src = sourceMeta[req.source];
                        const SrcIcon = src.icon;
                        return (
                          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', src.bgClass, src.className)}>
                            <SrcIcon className="h-3 w-3" />
                            {src.label}
                          </span>
                        );
                      })()}
                      <span className="text-[11px] text-muted-foreground">
                        {req.tickets.length} boleta{req.tickets.length !== 1 ? 's' : ''} · {formatCurrency(req.totalAmount, initial.currency)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Motivo: {req.reason}</p>
                    {(req.status === 'pending' || req.status === 'approved') && (
                      <span className={cn(
                        'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        req.isOverdue
                          ? 'bg-destructive/10 text-destructive'
                          : req.businessDaysRemaining <= 1
                            ? 'bg-amber-500/15 text-amber-700'
                            : 'bg-primary/10 text-primary'
                      )}>
                        <Clock className="h-3 w-3" />
                        {req.isOverdue
                          ? `Vencida hace ${Math.abs(req.businessDaysRemaining)} día${Math.abs(req.businessDaysRemaining) !== 1 ? 's' : ''} hábil${Math.abs(req.businessDaysRemaining) !== 1 ? 'es' : ''}`
                          : req.businessDaysRemaining === 0
                            ? 'Vence hoy'
                            : `${req.businessDaysRemaining} día${req.businessDaysRemaining !== 1 ? 's' : ''} hábil${req.businessDaysRemaining !== 1 ? 'es' : ''} restante${req.businessDaysRemaining !== 1 ? 's' : ''}`}
                      </span>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="space-y-4 border-t border-border bg-muted/30 p-4">
                    {/* Política */}
                    <div className={cn(
                      'flex items-start gap-2 rounded-xl border p-3 text-xs',
                      req.withinPolicy
                        ? 'border-primary/20 bg-primary/5 text-primary'
                        : 'border-destructive/20 bg-destructive/5 text-destructive'
                    )}>
                      {req.withinPolicy ? <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                      <div>
                        <p className="font-semibold">
                          {req.withinPolicy ? 'Dentro de la política' : 'Fuera de la política'}
                        </p>
                        <p className="opacity-90">
                          Solicitado a {req.daysBeforeEvent} día{req.daysBeforeEvent !== 1 ? 's' : ''} del evento. Límite: {req.policyLimitDays}.
                        </p>
                      </div>
                    </div>

                    {/* SLA: Plazo de gestión (5 días hábiles) */}
                    <div className={cn(
                      'rounded-xl border p-3 text-xs',
                      req.isOverdue
                        ? 'border-destructive/30 bg-destructive/5 text-destructive'
                        : req.businessDaysRemaining <= 1 && (req.status === 'pending' || req.status === 'approved')
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                          : 'border-border bg-card text-foreground'
                    )}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="font-semibold">Plazo de gestión: 5 días hábiles</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="opacity-70">Fecha de solicitud</p>
                          <p className="font-semibold">{req.requestDate}</p>
                        </div>
                        <div>
                          <p className="opacity-70">Fecha límite</p>
                          <p className="font-semibold">{req.resolutionDeadline}</p>
                        </div>
                      </div>
                      {(req.status === 'pending' || req.status === 'approved') && (
                        <p className="mt-2 text-[11px] font-medium opacity-90">
                          {req.isOverdue
                            ? `⚠ Vencida hace ${Math.abs(req.businessDaysRemaining)} día${Math.abs(req.businessDaysRemaining) !== 1 ? 's' : ''} hábil${Math.abs(req.businessDaysRemaining) !== 1 ? 'es' : ''}`
                            : req.businessDaysRemaining === 0
                              ? 'Vence hoy — gestionar de inmediato'
                              : `Quedan ${req.businessDaysRemaining} día${req.businessDaysRemaining !== 1 ? 's' : ''} hábil${req.businessDaysRemaining !== 1 ? 'es' : ''} para resolver`}
                        </p>
                      )}
                    </div>

                    {/* Fuente del reembolso */}
                    {(() => {
                      const src = sourceMeta[req.source];
                      const SrcIcon = src.icon;
                      return (
                        <div className={cn(
                          'flex items-start gap-2 rounded-xl border p-3 text-xs',
                          req.source === 'event_cancellation'
                            ? 'border-destructive/30 bg-destructive/5 text-destructive'
                            : 'border-border bg-card text-foreground'
                        )}>
                          <SrcIcon className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold">
                              {src.label}
                            </p>
                            <p className="mt-0.5 opacity-90">
                              {req.source === 'event_cancellation'
                                ? 'Este reembolso fue generado automáticamente por la cancelación del evento. Aplica a todos los compradores.'
                                : 'Este reembolso fue solicitado directamente por el usuario desde su cuenta.'}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    <div className={cn(
                      'flex items-start gap-2 rounded-xl border p-3 text-xs',
                      req.requiresOrganizerReview
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                        : req.payer === 'platform'
                          ? 'border-primary/20 bg-primary/5 text-primary'
                          : 'border-amber-500/20 bg-amber-500/5 text-amber-600'
                    )}>
                      {req.payer === 'platform' ? <Landmark className="mt-0.5 h-4 w-4 shrink-0" /> : <Building2 className="mt-0.5 h-4 w-4 shrink-0" />}
                      <div className="flex-1">
                        <p className="font-semibold">
                          {req.requiresOrganizerReview
                            ? 'Gestión del organizador (caso a caso)'
                            : req.payer === 'platform'
                              ? 'Reembolso asumido por la Plataforma'
                              : 'Reembolso asumido por el Organizador'}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 opacity-90">
                          <Wallet className="h-3 w-3" />
                          Pago: {req.paymentTiming === 'post_event' ? 'Post-evento' : 'Pre-evento'}
                          {!req.requiresOrganizerReview && req.payer === 'organizer' && req.paymentTiming === 'pre_event' && req.withinPolicy && (
                            <span className="opacity-75"> · pre-evento no aplica reembolso de plataforma</span>
                          )}
                          {!req.requiresOrganizerReview && req.payer === 'organizer' && !req.withinPolicy && (
                            <span className="opacity-75"> · fuera de política</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span>{req.buyerEmail}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{req.buyerPhone}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /><span>Solicitud: {req.requestDate}</span></div>
                      <div className="flex items-center gap-2"><Ticket className="h-3.5 w-3.5" /><span>Orden: {req.orderId}</span></div>
                    </div>

                    {/* Boletas */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">Boletas a reembolsar</p>
                      <div className="space-y-2">
                        {req.tickets.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-card-foreground">{t.category}</p>
                                <p className="text-[11px] text-muted-foreground">Fila {t.row} · Asiento {t.seat}</p>
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-foreground">{formatCurrency(t.amount, initial.currency)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {req.comment && (
                      <div className="rounded-xl bg-card border border-border p-3">
                        <p className="text-[11px] font-semibold text-muted-foreground">Comentario del comprador</p>
                        <p className="mt-1 text-xs text-foreground">{req.comment}</p>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5">
                      <span className="text-xs font-semibold text-foreground">Total a reembolsar</span>
                      <span className="text-base font-bold text-primary">{formatCurrency(req.totalAmount, initial.currency)}</span>
                    </div>

                    {/* Acciones */}
                    {req.status === 'pending' && (
                      <div className="space-y-2">
                        {req.withinPolicy && (
                          <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-[11px] text-primary">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>No puede rechazarse: la solicitud está dentro de la política de reembolso.</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            disabled={req.withinPolicy}
                            className="flex-1 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => updateStatus(req.id, 'rejected')}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Rechazar
                          </Button>
                          <Button
                            className="flex-1 rounded-full"
                            onClick={() => updateStatus(req.id, 'approved')}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Aprobar
                          </Button>
                        </div>
                      </div>
                    )}
                    {req.status === 'approved' && req.payer === 'platform' && req.withinPolicy && (
                      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="font-semibold">Aprobada automáticamente</span> por la plataforma. Se procesará el {req.resolutionDeadline} (al cumplirse los 5 días hábiles).
                        </span>
                      </div>
                    )}
                    {req.status === 'processed' && req.payer === 'platform' && req.withinPolicy && (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          <span className="font-semibold">Procesada automáticamente</span> por la plataforma el {req.resolutionDeadline} (dentro del plazo comprometido).
                        </span>
                      </div>
                    )}
                    {req.status === 'approved' && !(req.payer === 'platform' && req.withinPolicy) && (
                      <Button
                        className="w-full rounded-full"
                        onClick={() => updateStatus(req.id, 'processed')}
                      >
                        <ShieldCheck className="mr-1 h-4 w-4" /> Marcar como procesado
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No hay solicitudes en este estado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundsView;
