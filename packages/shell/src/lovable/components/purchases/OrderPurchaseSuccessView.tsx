import { Calendar, Clock, Smile } from 'lucide-react';
import TicketQrCard, { type TicketQrCardData } from '@lovable/components/purchases/TicketQrCard';
import { formatDisplayTicketId } from '@doevents/shared';
import type { CreateOrderResponse } from '@doevents/shared';

interface OrderPurchaseSuccessViewProps {
  eventName: string;
  orderId: string;
  orderDate?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  venueLabel?: string;
  venueCapacity?: string;
  eventImage?: string;
  tickets: CreateOrderResponse['tickets'];
  onFinish: () => void;
  finishLabel?: string;
}

function formatEventTime(value?: string): string {
  if (!value) return '—';
  return value;
}

export function OrderPurchaseSuccessView({
  eventName,
  orderId,
  orderDate,
  eventDate = '—',
  startTime,
  endTime,
  venueLabel,
  venueCapacity,
  eventImage,
  tickets = [],
  onFinish,
  finishLabel = 'Finalizar compra',
}: OrderPurchaseSuccessViewProps) {
  const ticketCards: TicketQrCardData[] = (tickets || []).map((ticket, index) => ({
    id: ticket.ticket_id || `ticket-${index}`,
    category: ticket.category || 'General',
    categoryColor: ticket.category_color || ticket.categoryColor,
    eventImage,
    eventTitle: eventName,
    eventDate,
    startTime,
    qrUrl: ticket.qr_url,
    qrData: formatDisplayTicketId(ticket),
    seatLabel: ticket.seatLabel,
  }));

  return (
    <div className="min-h-screen bg-secondary pb-32">
      <div className="mx-auto max-w-lg px-4 pt-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <Smile className="h-9 w-9 text-emerald-500" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-600">¡Estupendo!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tu pago ha sido aprobado exitosamente</p>
          <p className="mt-1 text-xs text-muted-foreground">Ya tienes tu boleta para el siguiente evento</p>
        </div>

        <h2 className="mb-3 text-xl font-extrabold text-primary">{eventName}</h2>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Calendar className="h-4 w-4" /> Fecha
            </div>
            <p className="text-[10px] text-muted-foreground">Inicio</p>
            <p className="text-sm font-bold text-foreground">{eventDate}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">Finalización</p>
            <p className="text-sm font-bold text-foreground">{eventDate}</p>
          </div>
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Clock className="h-4 w-4" /> Hora
            </div>
            <p className="text-[10px] text-muted-foreground">Inicio</p>
            <p className="text-sm font-bold text-foreground">{formatEventTime(startTime)}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">Finalización</p>
            <p className="text-sm font-bold text-foreground">{formatEventTime(endTime || startTime)}</p>
          </div>
        </div>

        {venueLabel && (
          <div className="mb-4 rounded-2xl bg-card p-3 shadow-sm">
            <p className="text-sm font-bold text-foreground">{venueLabel}</p>
            {venueCapacity && (
              <p className="text-xs text-muted-foreground">{venueCapacity}</p>
            )}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Orden de compra</p>
          <p className="text-sm font-bold text-foreground">N° {orderId}</p>
        </div>

        <div className="space-y-4">
          {ticketCards.map((card) => (
            <TicketQrCard key={card.id} ticket={card} />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-4">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-full border-2 border-primary bg-card py-4 text-sm font-bold text-primary shadow-sm hover:bg-primary/5"
          >
            {finishLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderPurchaseSuccessView;
