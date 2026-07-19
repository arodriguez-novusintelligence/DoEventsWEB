import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CreditCard, Info } from 'lucide-react';
import type { UserServiceBooking } from '@doevents/shared';
import type { ServicePurchaseGroup } from '../../../lovable-bridge/purchasesAdapter';
import { formatCurrency, formatPurchaseDate, mapBookingStatus } from '../../../lovable-bridge/purchasesAdapter';
import OrderPurchasePills from '@lovable/components/purchases/OrderPurchasePills';

interface ServiceGroupOrdersViewProps {
  group: ServicePurchaseGroup;
  onBack: () => void;
  onViewServiceDetail?: () => void;
  onCompletePayment?: (booking: UserServiceBooking) => void;
}

export function ServiceGroupOrdersView({
  group,
  onBack,
  onViewServiceDetail,
  onCompletePayment,
}: ServiceGroupOrdersViewProps) {
  const [selectedOrderId, setSelectedOrderId] = useState(group.bookings[0]?.orderId || group.bookings[0]?.bookingId || '');

  const orderPills = useMemo(
    () => group.bookings.map((b) => ({
      orderId: b.orderId || b.bookingId,
      orderNumber: (b.orderId || b.bookingId).slice(-8).toUpperCase(),
      orderDate: formatPurchaseDate(b.createdAt),
    })),
    [group.bookings],
  );

  const selectedBooking = useMemo(
    () => group.bookings.find((b) => (b.orderId || b.bookingId) === selectedOrderId) || group.bookings[0],
    [group.bookings, selectedOrderId],
  );

  if (!selectedBooking) return null;

  const tabStatus = mapBookingStatus(selectedBooking.status);
  const dates = selectedBooking.selectedDates?.length
    ? selectedBooking.selectedDates.join(', ')
    : `${selectedBooking.startDate} — ${selectedBooking.endDate}`;

  return (
    <div className="min-h-screen bg-secondary pb-40">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-semibold text-primary">
          <ChevronLeft className="h-5 w-5" /> Atrás
        </button>

        <h1 className="mb-1 text-2xl font-extrabold text-primary">{group.serviceName}</h1>
        <p className="mb-4 text-sm text-muted-foreground">{group.serviceProvider || group.serviceSector || 'Proveedor'}</p>

        {orderPills.length > 1 ? (
          <OrderPurchasePills
            orders={orderPills}
            selectedOrderId={selectedOrderId}
            onSelect={setSelectedOrderId}
          />
        ) : (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Orden de compra</p>
            <span className="inline-flex flex-col rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow-sm">
              <span className="text-xs font-bold">N°{(selectedBooking.orderId || selectedBooking.bookingId).slice(-8).toUpperCase()}</span>
              <span className="text-[10px] opacity-90">{formatPurchaseDate(selectedBooking.createdAt)}</span>
            </span>
          </div>
        )}

        <article className="overflow-hidden rounded-3xl bg-card shadow-md">
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Estado</p>
              <span className="inline-block rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold uppercase text-white">
                {tabStatus}
              </span>
            </div>
            <div>
              <p className="mb-1.5 text-sm text-muted-foreground">Fechas reservadas</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm font-extrabold text-foreground">{dates}</span>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-extrabold text-primary">{formatCurrency(selectedBooking.pricing?.total)}</p>
            </div>
            {(selectedBooking.additionalServices || []).map((item) => (
              <div key={item.name} className="rounded-xl border border-border/50 px-3 py-2 text-sm">
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency((item.pricePerDay || 0) * (item.quantity ?? 1))}
                </p>
              </div>
            ))}
          </div>
        </article>

        {tabStatus === 'pendiente' && onCompletePayment && (
          <button
            type="button"
            onClick={() => onCompletePayment(selectedBooking)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3.5 text-sm font-bold text-white"
          >
            <CreditCard className="h-4 w-4" /> Completar pago
          </button>
        )}
      </div>

      {onViewServiceDetail && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-secondary via-secondary to-transparent px-4 pb-5 pt-6">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              onClick={onViewServiceDetail}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg"
            >
              <Info className="h-4 w-4" /> Ver detalle del servicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceGroupOrdersView;
