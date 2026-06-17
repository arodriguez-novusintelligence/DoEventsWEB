import React from 'react';
import { Armchair, X } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { FullVenueMapViewer } from '../../../components/FullVenueMapViewer';
import { CheckoutFeeBreakdown } from './CheckoutFeeBreakdown';
import type { TicketCategory, VenueFloorDetail } from '@doevents/shared';

interface PreviewSeat {
  ticketInstanceId: string;
  categoryName: string;
  label: string;
  price: number;
  color: string;
}

interface LovableCheckoutConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  eventName: string;
  venueFloors: VenueFloorDetail[];
  ticketCategories: TicketCategory[];
  previewSeats: PreviewSeat[];
  highlightSeatId: string | null;
  totalAmount: number;
  feeBreakdown?: {
    subtotal: number;
    serviceFee: number;
    total: number;
    ticketCount: number;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const LovableCheckoutConfirmSheet: React.FC<LovableCheckoutConfirmSheetProps> = ({
  open,
  onClose,
  onConfirm,
  submitting,
  eventName,
  venueFloors,
  ticketCategories,
  previewSeats,
  highlightSeatId,
  totalAmount,
  feeBreakdown,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-auto w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-primary">Confirmar selección</p>
            <p className="text-sm font-bold text-foreground line-clamp-1">{eventName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {venueFloors.length > 0 && previewSeats.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="mb-2 text-xs font-semibold text-primary">Mapa completo</p>
              <FullVenueMapViewer
                floors={venueFloors}
                ticketCategories={ticketCategories}
                selectedIds={new Set(previewSeats.map((s) => s.ticketInstanceId))}
                highlightSeats={previewSeats.map((s) => ({
                  categoryName: s.categoryName,
                  label: s.label,
                }))}
                readOnly
                height="min(55vh, 420px)"
              />
            </div>
          )}

          <div className="space-y-2">
            {previewSeats.map((seat) => (
              <div
                key={seat.ticketInstanceId}
                className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Armchair className="h-4 w-4" style={{ color: seat.color }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{seat.label}</p>
                    <p className="text-xs text-muted-foreground">{seat.categoryName}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">{fmt(seat.price)}</span>
              </div>
            ))}
          </div>

          <CheckoutFeeBreakdown
            subtotal={feeBreakdown?.subtotal ?? totalAmount}
            serviceFee={feeBreakdown?.serviceFee ?? 0}
            total={feeBreakdown?.total ?? totalAmount}
            ticketCount={feeBreakdown?.ticketCount ?? previewSeats.length}
          />

          <p className="text-center text-xs text-muted-foreground">
            Al confirmar, tus sillas quedarán reservadas por 15 minutos mientras completas el pago.
          </p>

          <Button
            className="w-full rounded-full py-6 text-base font-semibold"
            disabled={submitting || previewSeats.length === 0}
            onClick={onConfirm}
          >
            {submitting ? 'Reservando…' : 'Reservar y continuar al pago'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LovableCheckoutConfirmSheet;
