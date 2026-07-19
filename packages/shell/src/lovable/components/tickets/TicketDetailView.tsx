import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  Info,
  MoreVertical,
  ArrowLeftRight,
  Banknote,
  MapPin,
} from 'lucide-react';
import { buildTransferStampLabel, getPersistedUserDisplayName } from '@doevents/shared';
import { Ticket } from '@lovable/data/ticketsData';
import TransferTicketFlow, {
  type BoletaEntry,
  type TransferRecipient,
} from './TransferTicketFlow';
import RefundTicketFlow from './RefundTicketFlow';
import SeatLocationModal from './SeatLocationModal';
import { ticketHasSeat } from '../../../lovable-bridge/ticketsAdapter';
import TicketQrCard, { type TicketQrCardData } from '@lovable/components/purchases/TicketQrCard';
import OrderPurchasePills from '@lovable/components/purchases/OrderPurchasePills';

interface TicketDetailViewProps {
  ticket: Ticket;
  entries: BoletaEntry[];
  orderCode: string;
  orderDate?: string;
  orders?: Array<{ orderId: string; orderNumber: string; orderDate: string }>;
  selectedOrderId?: string;
  onOrderChange?: (orderId: string) => void;
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
  currentUserId?: string;
  /** Abre el flujo de transfer/refund al entrar (p.ej. desde menú de Mis boletas). */
  initialAction?: 'transfer' | 'refund';
}

const TicketDetailView = ({
  ticket,
  entries,
  orderCode,
  orderDate,
  orders = [],
  selectedOrderId,
  onOrderChange,
  activeIndex,
  onActiveIndexChange,
  onBack,
  onViewEventDetail,
  onTransfer,
  onRefund,
  canTransfer = false,
  canRefund = false,
  refundEligible = true,
  refundEligibilityMessage = '',
  currentUserId,
  initialAction,
}: TicketDetailViewProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [seatMapTicket, setSeatMapTicket] = useState<Ticket | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [transferredIds, setTransferredIds] = useState<Set<string>>(new Set());
  const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());
  const [localTransferMeta, setLocalTransferMeta] = useState<Record<string, { toName?: string; fromName?: string; at?: string }>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const initialActionConsumed = useRef(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (initialActionConsumed.current || !initialAction) return;
    if (initialAction === 'transfer' && canTransfer && onTransfer) {
      initialActionConsumed.current = true;
      setTransferOpen(true);
      return;
    }
    if (initialAction === 'refund' && canRefund && onRefund) {
      initialActionConsumed.current = true;
      setRefundOpen(true);
    }
  }, [initialAction, canTransfer, canRefund, onTransfer, onRefund]);

  const ticketCards: TicketQrCardData[] = useMemo(() => entries.map((entry, i) => {
    const entryId = entry.id || '';
    const isTransferredOut = Boolean(entry.isTransferredOut) || transferredIds.has(entryId);
    const isReceivedByTransfer = Boolean(entry.isReceivedByTransfer);
    const isRefunded = Boolean(entry.isRefunded) || refundedIds.has(entryId);
    const seatLabel = entry.seatLabel || entry.code;
    const showTransferMeta = isTransferredOut || isReceivedByTransfer;
    const localMeta = localTransferMeta[entryId];
    return {
      id: entryId || `entry-${i}`,
      category: entry.category || ticket.category,
      categoryColor: ticket.categoryColor,
      eventImage: ticket.eventImage,
      eventTitle: ticket.eventTitle,
      eventDate: ticket.eventDate,
      startTime: ticket.startTime,
      qrUrl: isTransferredOut || isRefunded ? undefined : entry.qrUrl,
      qrData: isTransferredOut || isRefunded ? undefined : entry.qrData,
      seatLabel,
      isTransferredOut,
      isTransferred: showTransferMeta,
      isRefunded,
      transferredLabel: showTransferMeta
        ? buildTransferStampLabel({
          fromName: entry.transferredFromName
            || localMeta?.fromName
            || (isTransferredOut ? getPersistedUserDisplayName() || undefined : undefined),
          toName: entry.transferredToName || localMeta?.toName,
          transferredAt: entry.transferredAt || localMeta?.at,
        })
        : undefined,
    };
  }), [entries, ticket, transferredIds, refundedIds, localTransferMeta]);

  const activeEntry = entries[Math.min(Math.max(activeIndex, 0), Math.max(entries.length - 1, 0))];

  const buildTicketForEntry = (entry: BoletaEntry): Ticket => {
    const seatLabel = entry.seatLabel || entry.code || ticket.seatLabel || ticket.seat;
    return {
      ...ticket,
      seat: seatLabel,
      seatLabel,
      category: entry.category || ticket.category,
      qrCode: entry.qrData,
      qrUrl: entry.qrUrl,
      ticketInstanceId: entry.ticketInstanceId || entry.id,
    };
  };

  const activeTicket: Ticket = useMemo(() => {
    if (!activeEntry) return ticket;
    return buildTicketForEntry(activeEntry);
  }, [ticket, activeEntry]);

  const displayOrderNumber = orderCode.replace(/^N°/, '');

  return (
    <div className="min-h-screen bg-secondary pb-40">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={onBack} className="flex items-center gap-1 font-semibold text-primary">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          {/* Menú siempre con las dos opciones separadas (como Lovable) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm"
            >
              <MoreVertical className="h-5 w-5 text-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-30 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                <button
                  type="button"
                  disabled={!canTransfer || !onTransfer}
                  onClick={() => {
                    if (!canTransfer || !onTransfer) return;
                    setMenuOpen(false);
                    setTransferOpen(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  Compartir boletas
                </button>
                <button
                  type="button"
                  disabled={!canRefund || !onRefund}
                  onClick={() => {
                    if (!canRefund || !onRefund) return;
                    setMenuOpen(false);
                    setRefundOpen(true);
                  }}
                  className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Banknote className="h-5 w-5 text-primary" />
                  Solicitar reembolso
                </button>
              </div>
            )}
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-extrabold leading-tight text-primary">{ticket.eventTitle}</h1>

        {orders.length > 1 && onOrderChange ? (
          <OrderPurchasePills
            orders={orders}
            selectedOrderId={selectedOrderId || orders[0]?.orderId || ''}
            onSelect={onOrderChange}
          />
        ) : (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Orden de compra</p>
            <span className="inline-flex flex-col rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow-sm">
              <span className="text-xs font-bold">N°{displayOrderNumber}</span>
              {orderDate && <span className="text-[10px] opacity-90">{orderDate}</span>}
            </span>
          </div>
        )}

        <div className="space-y-4">
          {ticketCards.map((card, i) => {
            const entry = entries[i];
            const entryTicket = entry ? buildTicketForEntry(entry) : ticket;
            const showSeatMap = entry && ticketHasSeat(entryTicket) && !entry.isRefunded && !card.isRefunded;
            return (
              <div key={card.id} className="space-y-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onActiveIndexChange(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onActiveIndexChange(i);
                  }}
                >
                  <TicketQrCard ticket={card} />
                </div>
                {showSeatMap && (
                  <button
                    type="button"
                    onClick={() => setSeatMapTicket(entryTicket)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
                  >
                    <MapPin className="h-4 w-4" />
                    Ver boleta en mapa de silletería
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-secondary via-secondary to-transparent px-4 pb-5 pt-6">
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
          ticket={activeTicket}
          entries={entries.filter((e) => !e.isTransferredOut && !transferredIds.has(e.id))}
          initialSelectedIds={
            activeEntry?.ticketInstanceId || activeEntry?.id
              ? [activeEntry.ticketInstanceId || activeEntry.id]
              : undefined
          }
          currentUserId={currentUserId}
          onClose={() => setTransferOpen(false)}
          onCompleted={async (ids, recipient) => {
            await onTransfer(ids, recipient);
            const stamp = new Date().toLocaleString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            setTransferredIds((prev) => {
              const next = new Set(prev);
              ids.forEach((id) => next.add(id));
              return next;
            });
            setLocalTransferMeta((prev) => {
              const next = { ...prev };
              const fromName = getPersistedUserDisplayName() || undefined;
              ids.forEach((id) => {
                next[id] = {
                  fromName,
                  toName: recipient.name,
                  at: stamp.replace(',', ' -'),
                };
              });
              return next;
            });
            setTransferOpen(false);
          }}
        />
      )}

      {refundOpen && onRefund && (
        <RefundTicketFlow
          ticket={activeTicket}
          entries={entries.filter((e) => !e.isRefunded && !e.isTransferredOut && !refundedIds.has(e.id))}
          orderCode={orderCode}
          eligible={refundEligible}
          eligibilityMessage={refundEligibilityMessage}
          onClose={() => setRefundOpen(false)}
          onCompleted={async (ids) => {
            await onRefund(ids);
            setRefundedIds((prev) => {
              const next = new Set(prev);
              ids.forEach((id) => next.add(id));
              return next;
            });
            setRefundOpen(false);
          }}
        />
      )}

      <SeatLocationModal
        open={Boolean(seatMapTicket)}
        onOpenChange={(open) => {
          if (!open) setSeatMapTicket(null);
        }}
        ticket={seatMapTicket}
      />
    </div>
  );
};

export default TicketDetailView;
