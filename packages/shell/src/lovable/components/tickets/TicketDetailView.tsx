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
} from 'lucide-react';
import type { Ticket } from '@lovable/data/ticketsData';
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
  transferredAt?: Map<string, Date>;
  refundedAt?: Map<string, Date>;
}

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

        <div className="relative mt-4 rounded-3xl border border-border/60 bg-card shadow-lg overflow-hidden">
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
                  <span className="inline-block rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800 uppercase max-w-full">
                    {ticket.category}
                  </span>
                  <p className="mt-3 text-base font-extrabold text-foreground">Silla - {seatLabel}</p>
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
                  <div className="h-5 w-5 rounded-full bg-emerald-500 grid place-items-center">
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
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-orange-500 px-5 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">Reembolsada</span>
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
