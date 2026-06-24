import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreVertical, Info, ArrowLeftRight, Banknote, Calendar, Clock, Check, Armchair, MapPin } from 'lucide-react';
import { Ticket } from '@lovable/data/ticketsData';
import TransferTicketFlow from './TransferTicketFlow';
import RefundTicketFlow from './RefundTicketFlow';
import SeatLocationModal from './SeatLocationModal';
import { useReservationTimer } from '@doevents/shared';
import { ticketHasSeat } from '../../../lovable-bridge/ticketsAdapter';

interface TicketDetailViewProps {
  ticket: Ticket;
  onBack: () => void;
  onViewEventDetail?: () => void;
}

const TicketDetailView = ({ ticket, onBack, onViewEventDetail }: TicketDetailViewProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [seatMapOpen, setSeatMapOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [transferredIds, setTransferredIds] = useState<Map<string, Date>>(new Map());
  const [refundedIds, setRefundedIds] = useState<Map<string, Date>>(new Map());
  const menuRef = useRef<HTMLDivElement>(null);

  const orders = [
    { id: 'o-1', code: `N°${ticket.orderNumber.slice(-6).toUpperCase()}`, date: ticket.orderDate },
    { id: 'o-2', code: 'N°6C0951', date: '24/04/2026' },
    { id: 'o-3', code: 'N°TEST_A', date: '22/04/2026' },
    { id: 'o-4', code: 'N°TEST_9', date: '01/04/2026' },
  ];

  const entries = orders.map((o, i) => ({
    id: o.id,
    code: `A${i + 3}`,
    date: o.date,
    qrData: `${ticket.qrCode}-${i + 1}`,
    value: 280000,
  }));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const qrCode = `${ticket.qrCode}-${activeIndex + 1}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=0&data=${encodeURIComponent(qrCode)}`;

  const seatLabel = ticket.seat.match(/[A-Z]+\d+/i)?.[0] || 'A3';
  const entranceLabel = ticket.entrance.replace(/^Puerta\s+/i, '').replace(/^Entrando\s+/i, '') || 'Entrada Derecha';

  return (
    <div className="min-h-screen bg-secondary pb-40">
      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm border border-border"
            >
              <MoreVertical className="h-5 w-5 text-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-30 w-60 rounded-2xl bg-card shadow-lg border border-border overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); setTransferOpen(true); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent"
                >
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  Transferir boletas
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setRefundOpen(true); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent border-t border-border"
                >
                  <Banknote className="h-5 w-5 text-primary" />
                  Solicitar reembolso
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Orden de compra selector */}
        <p className="text-sm font-semibold text-muted-foreground mb-2">Orden de compra</p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {orders.map((o, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={o.id}
                onClick={() => setActiveIndex(i)}
                className={`shrink-0 min-w-[120px] rounded-2xl border px-4 py-3 text-center transition-all ${
                  active
                    ? 'bg-primary border-primary shadow-md'
                    : 'bg-card border-border'
                }`}
              >
                <p className={`text-sm font-bold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {o.code}
                </p>
                <p className={`text-xs mt-0.5 ${active ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                  {o.date}
                </p>
              </button>
            );
          })}
        </div>

        {/* Ticket card */}
        <div className="relative mt-4 rounded-3xl bg-card shadow-md overflow-hidden">
          <div className={(transferredIds.has(orders[activeIndex].id) || refundedIds.has(orders[activeIndex].id)) ? 'opacity-30' : ''}>
            <div className="p-3 pb-0">
              <div className="h-40 w-full overflow-hidden rounded-2xl">
                <img src={ticket.eventImage} alt={ticket.eventTitle} className="h-full w-full object-cover" />
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
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1.5">Hora inicio</p>
                  <div className="flex items-center justify-end gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-base font-extrabold text-foreground">{ticket.startTime}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-center">
                  <img src={qrUrl} alt="QR" className="h-64 w-64" />
                </div>
                <p className="mt-3 text-center text-sm font-medium text-foreground tracking-wide break-all">
                  {qrCode}
                </p>
                {ticket.pulepCode && (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Código PULEP
                    </span>
                    <span className="font-mono text-sm font-bold tracking-widest text-primary">
                      {ticket.pulepCode}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSeatMapOpen(true)}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <span className="flex items-center gap-2">
                  <Armchair className="h-4 w-4" /> Ubicación silla
                </span>
                <span className="flex flex-col items-end gap-0.5">
                  <span className="flex items-center gap-1.5 font-bold">
                    {ticket.seat}
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-medium opacity-70">
                    Ver en mapa <ChevronRight className="h-3 w-3" />
                  </span>
                </span>
              </button>
            </div>
          </div>

          {transferredIds.has(orders[activeIndex].id) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-foreground px-5 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-emerald-500 grid place-items-center">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={4} />
                  </div>
                  <span className="text-sm font-bold text-background">Transferida</span>
                </div>
                <span className="text-[11px] font-medium text-background/80">
                  {transferredIds.get(orders[activeIndex].id)?.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {' · '}
                  {transferredIds.get(orders[activeIndex].id)?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
          )}

          {refundedIds.has(orders[activeIndex].id) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-orange-500 px-5 py-3 shadow-xl">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm font-bold text-primary-foreground">Reembolsada</span>
                </div>
                <span className="text-[11px] font-medium text-primary-foreground/90">
                  {refundedIds.get(orders[activeIndex].id)?.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {' · '}
                  {refundedIds.get(orders[activeIndex].id)?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-secondary via-secondary to-transparent pt-6 pb-5 px-4">
        <div className="mx-auto max-w-lg">
          <button
            onClick={onViewEventDetail}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
              <Info className="h-4 w-4" />
            </span>
            Ver detalle del evento
          </button>
        </div>
      </div>

      {transferOpen && (
        <TransferTicketFlow
          ticket={ticket}
          entries={entries}
          onClose={() => setTransferOpen(false)}
          onCompleted={(ids) => {
            setTransferredIds((prev) => {
              const next = new Map(prev);
              const now = new Date();
              ids.forEach((id) => next.set(id, now));
              return next;
            });
          }}
        />
      )}

      {refundOpen && (
        <RefundTicketFlow
          ticket={ticket}
          entries={entries}
          orderCode={orders[activeIndex].code}
          onClose={() => setRefundOpen(false)}
          onCompleted={(ids) => {
            setRefundedIds((prev) => {
              const next = new Map(prev);
              const now = new Date();
              ids.forEach((id) => next.set(id, now));
              // Mark the current order as refunded too (so badge shows on the order view)
              next.set(orders[activeIndex].id, now);
              return next;
            });
          }}
        />
      )}

      <SeatLocationModal open={seatMapOpen} onOpenChange={setSeatMapOpen} ticket={ticket} />
    </div>
  );
};

export default TicketDetailView;