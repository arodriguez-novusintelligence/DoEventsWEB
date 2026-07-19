import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Info, MoreVertical, CreditCard, MapPin, ArrowLeftRight, Banknote } from 'lucide-react';
import { buildTransferStampLabel } from '@doevents/shared';
import type { TicketEventListGroup } from '../../../lovable-bridge/ticketsAdapter';
import { ticketHasSeat } from '../../../lovable-bridge/ticketsAdapter';
import type { Ticket } from '@lovable/data/ticketsData';
import OrderPurchasePills from '@lovable/components/purchases/OrderPurchasePills';
import TicketQrCard, { type TicketQrCardData } from '@lovable/components/purchases/TicketQrCard';
import SeatLocationModal from './SeatLocationModal';

export type TicketOrderOpenAction = 'transfer' | 'refund';

interface EventTicketOrdersViewProps {
  eventGroup: TicketEventListGroup;
  onBack: () => void;
  onOpenOrder?: (ticket: Ticket, action?: TicketOrderOpenAction) => void;
  onViewEventDetail?: () => void;
  onCompletePayment?: (ticket: Ticket) => void;
}

function ticketToQrCard(ticket: Ticket, eventGroup: TicketEventListGroup): TicketQrCardData {
  const isTransferredOut = Boolean(
    ticket.isTransferredOut
    || (ticket.isTransferred && !ticket.qrUrl && !ticket.qrCode),
  );
  const isRefunded = Boolean(ticket.isRefunded);
  const showTransferMeta = Boolean(ticket.isTransferred || isTransferredOut) && !isRefunded;
  return {
    id: ticket.ticketInstanceId || ticket.id,
    category: ticket.category || 'General',
    categoryColor: ticket.categoryColor,
    eventImage: eventGroup.eventImage,
    eventTitle: eventGroup.eventTitle,
    eventDate: ticket.eventDate || eventGroup.eventDate,
    startTime: ticket.startTime || eventGroup.startTime,
    qrUrl: isTransferredOut || isRefunded ? undefined : ticket.qrUrl,
    qrData: isTransferredOut || isRefunded ? undefined : (ticket.qrCode || undefined),
    seatLabel: ticket.seatLabel || (ticket.seat !== '—' ? ticket.seat : undefined),
    isTransferredOut,
    isTransferred: showTransferMeta,
    isRefunded,
    transferredLabel: showTransferMeta
      ? buildTransferStampLabel({
        fromName: ticket.transferredFromName,
        toName: ticket.transferredToName,
        transferredAt: ticket.transferredAt,
      })
      : undefined,
  };
}

const EventTicketOrdersView = ({
  eventGroup,
  onBack,
  onOpenOrder,
  onViewEventDetail,
  onCompletePayment,
}: EventTicketOrdersViewProps) => {
  const [selectedOrderId, setSelectedOrderId] = useState(eventGroup.orders[0]?.orderId || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [seatMapTicket, setSeatMapTicket] = useState<Ticket | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const orderPills = useMemo(
    () => eventGroup.orders.map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber.replace(/^N°/, ''),
      orderDate: order.orderDate,
    })),
    [eventGroup.orders],
  );

  const selectedOrder = useMemo(
    () => eventGroup.orders.find((o) => o.orderId === selectedOrderId) || eventGroup.orders[0],
    [eventGroup.orders, selectedOrderId],
  );

  const orderTickets = selectedOrder?.tickets || [];

  const ticketCards = useMemo(
    () => orderTickets.map((t) => ticketToQrCard(t, eventGroup)),
    [orderTickets, eventGroup],
  );

  const handleOpenExternal = (action?: TicketOrderOpenAction) => {
    if (!onOpenOrder || !selectedOrder?.tickets[0]) return;
    onOpenOrder(selectedOrder.tickets[0], action);
  };

  return (
    <div className="min-h-screen bg-secondary pb-40">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
            Atrás
          </button>
          {onOpenOrder && (
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
                    onClick={() => { setMenuOpen(false); handleOpenExternal('transfer'); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-accent"
                  >
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                    Compartir boletas
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); handleOpenExternal('refund'); }}
                    className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm font-medium hover:bg-accent"
                  >
                    <Banknote className="h-5 w-5 text-primary" />
                    Solicitar reembolso
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h1 className="mb-4 text-2xl font-extrabold leading-tight text-primary">
          {eventGroup.eventTitle}
        </h1>

        {orderPills.length > 1 ? (
          <OrderPurchasePills
            orders={orderPills}
            selectedOrderId={selectedOrder?.orderId || ''}
            onSelect={setSelectedOrderId}
          />
        ) : selectedOrder && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Orden de compra</p>
            <span className="inline-flex flex-col rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow-sm">
              <span className="text-xs font-bold">N°{selectedOrder.orderNumber.replace(/^N°/, '')}</span>
              <span className="text-[10px] opacity-90">{selectedOrder.orderDate}</span>
            </span>
          </div>
        )}

        <div className="space-y-4">
          {ticketCards.map((card, index) => {
            const ticket = orderTickets[index];
            const showSeatMap = ticket && ticketHasSeat(ticket) && !ticket.isRefunded;
            return (
              <div key={card.id} className="space-y-2">
                <TicketQrCard ticket={card} />
                {showSeatMap && (
                  <button
                    type="button"
                    onClick={() => setSeatMapTicket(ticket)}
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

      {onViewEventDetail && eventGroup.status === 'pendiente' && onCompletePayment && selectedOrder?.tickets[0] && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-secondary via-secondary to-transparent px-4 pb-5 pt-6">
          <div className="mx-auto max-w-lg space-y-2">
            <button
              type="button"
              onClick={() => onCompletePayment(selectedOrder.tickets[0])}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-4 text-sm font-bold text-white shadow-lg"
            >
              <CreditCard className="h-4 w-4" />
              Completar pago
            </button>
            <button
              type="button"
              onClick={onViewEventDetail}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-card py-3 text-sm font-bold text-primary"
            >
              <Info className="h-4 w-4" />
              Ver detalle del evento
            </button>
          </div>
        </div>
      )}

      {onViewEventDetail && eventGroup.status !== 'pendiente' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-secondary via-secondary to-transparent px-4 pb-5 pt-6">
          <div className="mx-auto max-w-lg">
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
          </div>
        </div>
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

export default EventTicketOrdersView;
