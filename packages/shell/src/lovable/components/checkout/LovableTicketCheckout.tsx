import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Armchair, ChevronLeft, Info, Minus, Plus, Tag as TagIcon } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { CheckoutFeeBreakdown } from './CheckoutFeeBreakdown';
import { CheckoutPromoCodeBlock } from './CheckoutPromoCodeBlock';
import { LovableSeatingCheckoutFlow } from './LovableSeatingCheckoutFlow';
import type { useTicketCheckout } from '../../../lovable-bridge/useTicketCheckout';

type CheckoutState = ReturnType<typeof useTicketCheckout>;

interface LovableTicketCheckoutProps extends CheckoutState {
  eventId: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

function formatTimerParts(remainingMs: number | null | undefined) {
  if (remainingMs == null) return { h: '00', m: '00', s: '00' };
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export const LovableTicketCheckout: React.FC<LovableTicketCheckoutProps> = (props) => {
  const navigate = useNavigate();
  const {
    eventId,
    loading,
    submitting,
    categories,
    pendingOrderId,
    countdownLabel,
    remainingMs,
    showSeatingMap,
    feeBreakdown,
    totalOnlyTicketQty,
    adjustCategoryQuantity,
    getCategoryQuantity,
    getCategoryUnitPrice,
    handleReserveAndPay,
    continuePendingPayment,
    promoEnabled,
    setPromoEnabled,
    promoInput,
    setPromoInput,
    promoApplied,
    promoError,
    promoApplying,
    promoDiscount,
    payableTotal,
    applyPromoCode,
    removePromoCode,
  } = props;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando boletas…</p>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center bg-background">
        <p className="text-lg font-bold text-foreground">Sin boletas disponibles</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Este evento no tiene entradas a la venta en este momento.
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  if (!showSeatingMap) {
    const timeStr = formatTimerParts(remainingMs);
    const hasActiveReservation = Boolean(pendingOrderId);

    return (
      <div className="mx-auto max-w-lg min-h-screen bg-[#EEF0FB] pb-32">
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground"
          >
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <h1 className="text-2xl font-extrabold leading-tight text-primary mb-4">
            Confirmación de boletería
          </h1>

          {hasActiveReservation && (
            <div className="mb-4 rounded-2xl border-2 border-primary bg-primary/5 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-primary">Reserva activa</p>
                  <p className="text-xs text-muted-foreground">Tiempo restante: {countdownLabel}</p>
                </div>
                <Button size="sm" className="rounded-full" onClick={continuePendingPayment}>
                  Ir al pago
                </Button>
              </div>
            </div>
          )}

          {props.categories.map((cat) => {
            const qty = getCategoryQuantity(cat.distributionId);
            const unitPrice = getCategoryUnitPrice(cat);
            const maxQty = (cat.seats || []).length;
            return (
              <div key={cat.distributionId} className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <p className="text-base font-extrabold text-foreground">{cat.categoryName}</p>
                  </div>
                  <Armchair className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor</span>
                  <span className="text-base font-bold text-primary">{fmt(unitPrice)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cantidad</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={hasActiveReservation || submitting}
                      onClick={() => adjustCategoryQuantity(cat, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 rounded-lg border border-border py-1 text-center text-sm font-semibold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={hasActiveReservation || submitting || qty >= maxQty}
                      onClick={() => adjustCategoryQuantity(cat, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {maxQty > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">{maxQty} disponible(s)</p>
                )}
              </div>
            );
          })}

          {totalOnlyTicketQty > 0 && !hasActiveReservation && (
            <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm">
              <div className="grid grid-cols-3 pb-1 text-sm font-bold">
                <span>Categoría</span>
                <span className="text-center"># Boletas</span>
                <span className="text-right">Valor</span>
              </div>
              {props.categories
                .filter((cat) => getCategoryQuantity(cat.distributionId) > 0)
                .map((cat) => {
                  const qty = getCategoryQuantity(cat.distributionId);
                  const unitPrice = getCategoryUnitPrice(cat);
                  return (
                    <div
                      key={cat.distributionId}
                      className="grid grid-cols-3 border-t border-dashed border-border py-2 text-sm"
                    >
                      <span>{cat.categoryName}</span>
                      <span className="text-center text-muted-foreground">x{qty}</span>
                      <span className="text-right font-medium">{fmt(qty * unitPrice)}</span>
                    </div>
                  );
                })}
              <div className="mt-2 border-t border-dashed border-border pt-2">
                <CheckoutFeeBreakdown
                  embedded
                  subtotal={feeBreakdown.subtotal}
                  serviceFee={feeBreakdown.serviceFee}
                  total={payableTotal}
                  ticketCount={feeBreakdown.ticketCount}
                />
              </div>
              {promoApplied && (
                <div className="mt-2 flex justify-between text-sm text-emerald-600">
                  <span className="inline-flex items-center gap-1">
                    <TagIcon className="h-3.5 w-3.5" /> Código {promoApplied.code}
                  </span>
                  <span>- {fmt(promoDiscount)}</span>
                </div>
              )}
            </div>
          )}

          {totalOnlyTicketQty > 0 && !hasActiveReservation && (
            <CheckoutPromoCodeBlock
              enabled={promoEnabled}
              onEnabledChange={setPromoEnabled}
              code={promoInput}
              onCodeChange={setPromoInput}
              applied={promoApplied}
              error={promoError}
              applying={promoApplying}
              onApply={() => { void applyPromoCode(); }}
              onRemove={removePromoCode}
              disabled={submitting}
            />
          )}

          {hasActiveReservation && (
            <>
              <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-primary bg-primary/5 px-4 py-3">
                <span className="text-sm font-bold text-primary">Tiempo restante</span>
                <div className="text-right">
                  <p className="text-xl font-extrabold tabular-nums">
                    {timeStr.h}:{timeStr.m}:{timeStr.s}
                  </p>
                  <div className="flex justify-end gap-3 text-[10px] text-muted-foreground">
                    <span>Hr</span><span>Min</span><span>Seg</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-card p-4 text-center shadow-sm">
                <p className="text-base font-bold">
                  Tus boletas te esperan... pero solo por 15 minutos más
                </p>
              </div>
            </>
          )}
        </div>

        {!hasActiveReservation && totalOnlyTicketQty > 0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-[#EEF0FB] px-4 py-4">
            <div className="mx-auto max-w-lg">
              <Button
                className="w-full rounded-full py-6 text-base font-semibold"
                disabled={submitting || totalOnlyTicketQty === 0}
                onClick={handleReserveAndPay}
              >
                {submitting ? 'Reservando…' : 'Pagar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <LovableSeatingCheckoutFlow eventId={eventId} {...props} />;
};

export default LovableTicketCheckout;
