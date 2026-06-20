import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  MoreVertical,
  Info,
  ArrowLeftRight,
  Banknote,
  Calendar,
  Clock,
  Check,
  MapPin,
  Ticket as TicketIcon,
} from 'lucide-react';
import type { Ticket, TicketStatus } from '@lovable/data/ticketsData';
import { useReservationTimer } from '@doevents/shared';
import TransferTicketFlow, { type BoletaEntry, type TransferRecipient } from './TransferTicketFlow';
import RefundTicketFlow from './RefundTicketFlow';
import SeatLocationModal from './SeatLocationModal';
import { ticketHasSeat } from '../../../lovable-bridge/ticketsAdapter';

export interface TicketDetailViewProps {
  ticket: Ticket;
  entries: BoletaEntry[];
  orderCode: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onBack: () => void;
  onViewEventDetail?: () => void;
  onTransfer?: (ticketInstanceIds: string[], recipient: TransferRecipient) => Promise<void>;
  onRefund?: (ticketInstanceIds: string[]) => Promise<void>;
  canTransfer?: boolean;
  canRefund?: boolean;
  refundEligible?: boolean;
  refundEligibilityMessage?: string;
  platformFeeRate?: number;
  currentUserId?: string;
  transferredAt?: Map<string, Date>;
  refundedAt?: Map<string, Date>;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  aprobada: 'Aprobada',
  pendiente: 'Pendiente de pago',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada',
};

const STATUS_CHIP: Record<TicketStatus, string> = {
  aprobada: 'bg-primary/10 text-primary border-primary/20',
  pendiente: 'bg-amber-500/15 text-amber-900 border-amber-500/30',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
  finalizada: 'bg-muted text-muted-foreground border-border',
};

const PendingCountdown = ({ expiresAtTs }: { expiresAtTs?: number }) => {
  const { isExpired, label } = useReservationTimer(expiresAtTs ?? null);
  if (!expiresAtTs) return null;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${
        isExpired ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/15 text-amber-800'
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      {isExpired ? 'Reserva expirada' : `Paga en ${label} para conservar tu boleta`}
    </div>
  );
};

const formatPrice = (value?: number) => {
  if (typeof value !== 'number' || value <= 0) return null;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

const TicketDetailView = ({
  ticket,
  entries,
  orderCode,
  activeIndex,
  onActiveIndexChange,
  onBack,
  onViewEventDetail,
  onTransfer,
  onRefund,
  canTransfer = false,
  canRefund = false,
  refundEligible = true,
  refundEligibilityMessage,
  platformFeeRate,
  currentUserId,
  transferredAt,
  refundedAt,
}: TicketDetailViewProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [seatMapOpen, setSeatMapOpen] = useState(false);
  const [localTransferred, setLocalTransferred] = useState<Map<string, Date>>(new Map());
  const [localRefunded, setLocalRefunded] = useState<Map<string, Date>>(new Map());
  const menuRef = useRef<HTMLDivElement>(null);

  const activeEntry = entries[activeIndex] || entries[0];
  const transferMap = transferredAt || localTransferred;
  const refundMap = refundedAt || localRefunded;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const seatLabel = activeEntry?.code || ticket.seatLabel || ticket.seat?.match(/[A-Z]+\d+/i)?.[0] || '—';
  const entranceLabel = (ticket.entrance || 'Entrada principal').replace(/^Puerta\s+/i, '').replace(/^Entrando\s+/i, '');
  const qrData = activeEntry?.qrData || ticket.qrCode || ticket.ticketInstanceId || ticket.id;
  const qrImageUrl = activeEntry?.qrUrl || ticket.qrUrl;
  const qrUrl = qrImageUrl
    || (qrData && !/^https?:\/\//i.test(String(qrData))
      ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=0&data=${encodeURIComponent(String(qrData))}`
      : (qrData && /^https?:\/\//i.test(String(qrData)) ? String(qrData) : ''));

  const qrDescription = [
    ticket.eventTitle,
    ticket.category,
    seatLabel !== '—' ? `Silla ${seatLabel}` : null,
    ticket.entrance,
  ].filter(Boolean).join(' · ');
  const isTransferred = activeEntry ? transferMap.has(activeEntry.id) : false;
  const isRefunded = activeEntry ? refundMap.has(activeEntry.id) : false;
  const isPending = ticket.status === 'pendiente';
  const ticketPrice = activeEntry?.value || ticket.price;
  const priceLabel = formatPrice(ticketPrice);
  const boletaPosition = entries.length > 1 ? `${activeIndex + 1} de ${entries.length}` : null;

  const handleTransferComplete = async (ids: string[], recipient: TransferRecipient) => {
    if (!onTransfer) return;
    const instanceIds = entries
      .filter((e) => ids.includes(e.id))
      .map((e) => e.ticketInstanceId)
      .filter(Boolean);
    await onTransfer(instanceIds, recipient);
    const now = new Date();
    setLocalTransferred((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.set(id, now));
      return next;
    });
    setTransferOpen(false);
  };

  const handleRefundComplete = async (ids: string[]) => {
    if (!onRefund) return;
    const instanceIds = entries
      .filter((e) => ids.includes(e.id))
      .map((e) => e.ticketInstanceId)
      .filter(Boolean);
    await onRefund(instanceIds);
    const now = new Date();
    setLocalRefunded((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.set(id, now));
      return next;
    });
    setRefundOpen(false);
  };

  return (
    <div className="min-h-screen bg-secondary pb-28">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-primary font-medium">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          {(canTransfer || canRefund) && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm border border-border"
              >
                <MoreVertical className="h-5 w-5 text-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 z-30 w-60 rounded-2xl bg-card shadow-lg border border-border overflow-hidden">
                  {canTransfer && onTransfer && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setTransferOpen(true); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent"
                    >
                      <ArrowLeftRight className="h-5 w-5 text-primary" />
                      Compartir boleta
                    </button>
                  )}
                  {canRefund && onRefund && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setRefundOpen(true); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent border-t border-border"
                    >
                      <Banknote className="h-5 w-5 text-primary" />
                      Solicitar reembolso
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-3 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-extrabold text-foreground leading-tight line-clamp-2">
                {ticket.eventTitle}
              </h1>
              {ticket.orderDate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Comprada el {ticket.orderDate}
                </p>
              )}
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                STATUS_CHIP[ticket.status]
              }`}
            >
              {STATUS_LABELS[ticket.status]}
            </span>
          </div>
          {isPending && <PendingCountdown expiresAtTs={ticket.paymentExpiresAtTs} />}
        </div>

        <p className="text-sm font-semibold text-muted-foreground mb-2">Orden de compra</p>
        {entries.length > 1 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {entries.map((entry, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onActiveIndexChange(i)}
                  className={`shrink-0 min-w-[120px] rounded-2xl border px-4 py-3 text-center transition-all ${
                    active ? 'bg-primary border-primary shadow-md' : 'bg-card border-border'
                  }`}
                >
                  <p className={`text-sm font-bold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {orderCode}
                  </p>
                  <p className={`text-xs mt-0.5 ${active ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                    Silla {entry.code}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-primary px-4 py-3 text-center">
            <p className="text-sm font-bold text-primary-foreground">{orderCode}</p>
          </div>
        )}

        <div
          className={`relative mt-4 rounded-3xl border border-border/60 bg-card shadow-lg overflow-hidden ${
            isPending ? 'opacity-90' : ''
          }`}
        >
          {boletaPosition && (
            <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm backdrop-blur">
              <TicketIcon className="h-3 w-3 text-primary" />
              Boleta {boletaPosition}
            </div>
          )}
          <div className={(isTransferred || isRefunded) ? 'opacity-30' : ''}>
            <div className="p-3 pb-0">
              <div className="h-40 w-full overflow-hidden rounded-2xl">
                {ticket.eventVideo ? (
                  <video
                    src={ticket.eventVideo}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                ) : ticket.eventImage ? (
                  <img src={ticket.eventImage} alt={ticket.eventTitle} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Categoría</p>
                  <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary uppercase max-w-full">
                    {ticket.category}
                  </span>
                  <p className="mt-3 text-base font-extrabold text-foreground">Silla - {seatLabel}</p>
                  {priceLabel && (
                    <p className="mt-1 text-sm font-semibold text-primary">{priceLabel}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-2">Puerta de ingreso</p>
                  <p className="text-base font-extrabold text-foreground">{entranceLabel}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1.5">Fecha</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-base font-extrabold text-foreground">{ticket.eventDate}</span>
                  </div>
                </div>
                {ticket.startTime && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1.5">Hora inicio</p>
                    <div className="flex items-center justify-end gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-base font-extrabold text-foreground">{ticket.startTime}</span>
                    </div>
                  </div>
                )}
              </div>

              {qrUrl && (
                <div className="pt-2">
                  <div className="flex justify-center">
                    <img src={qrUrl} alt="QR de la boleta" className="h-64 w-64" />
                  </div>
                  <p className="mt-3 text-center text-sm font-semibold text-foreground leading-snug px-2">
                    {qrDescription}
                  </p>
                  <p className="mt-2 text-center text-xs font-medium text-muted-foreground tracking-wide break-all">
                    {qrData}
                  </p>
                </div>
              )}

              {ticketHasSeat(ticket) && ticket.eventId && (
                <button
                  type="button"
                  onClick={() => setSeatMapOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/5 py-3 text-sm font-bold text-primary hover:bg-primary/10"
                >
                  <MapPin className="h-4 w-4" />
                  Ver ubicación de la silla
                </button>
              )}
            </div>
          </div>

          {isTransferred && activeEntry && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-foreground px-5 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary grid place-items-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={4} />
                  </div>
                  <span className="text-sm font-bold text-background">Transferida</span>
                </div>
                <span className="text-[11px] font-medium text-background/80">
                  {transferMap.get(activeEntry.id)?.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}

          {isRefunded && activeEntry && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-destructive px-5 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-destructive-foreground" />
                  <span className="text-sm font-bold text-destructive-foreground">Reembolsada</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-secondary via-secondary to-transparent pt-6 pb-5 px-4">
        <div className="mx-auto max-w-lg">
          {onViewEventDetail && (
            <button
              type="button"
              onClick={onViewEventDetail}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                <Info className="h-4 w-4" />
              </span>
              Ver detalle del evento
            </button>
          )}
        </div>
      </div>

      {transferOpen && onTransfer && (
        <TransferTicketFlow
          ticket={ticket}
          entries={entries.filter((e) => !transferMap.has(e.id) && !refundMap.has(e.id))}
          currentUserId={currentUserId}
          onClose={() => setTransferOpen(false)}
          onCompleted={handleTransferComplete}
        />
      )}

      {refundOpen && onRefund && (
        <RefundTicketFlow
          ticket={ticket}
          entries={entries.filter((e) => !refundMap.has(e.id))}
          orderCode={orderCode}
          onClose={() => setRefundOpen(false)}
          onCompleted={handleRefundComplete}
          eligible={refundEligible}
          eligibilityMessage={refundEligibilityMessage}
          platformFeeRate={platformFeeRate}
        />
      )}

      <SeatLocationModal
        open={seatMapOpen}
        onOpenChange={setSeatMapOpen}
        ticket={ticket}
      />
    </div>
  );
};

export default TicketDetailView;
