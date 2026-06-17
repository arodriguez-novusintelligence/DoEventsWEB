import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Armchair,
  ChevronLeft,
  Grid3x3,
  Home as HomeIcon,
  MapPin,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import LovableVenueMap from '@lovable/components/venue/LovableVenueMap';
import { LovableCheckoutConfirmSheet } from './LovableCheckoutConfirmSheet';
import { CheckoutFeeBreakdown } from './CheckoutFeeBreakdown';
import type { useTicketCheckout } from '../../../lovable-bridge/useTicketCheckout';
import { resolveSeatLabel, type AvailableSeat, type TicketCategory } from '@doevents/shared';

type CheckoutState = ReturnType<typeof useTicketCheckout>;

interface LovableTicketCheckoutProps extends CheckoutState {
  eventId: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const categoryMinPrice = (cat: TicketCategory) => {
  const prices = (cat.seats || []).map((s) => s.price || 0).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : 0;
};

const CATEGORY_COLORS = [
  'bg-primary',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
];

export const LovableTicketCheckout: React.FC<LovableTicketCheckoutProps> = ({
  eventId,
  loading,
  submitting,
  categories,
  selected,
  venueFloors,
  eventMeta,
  filterCategory,
  setFilterCategory,
  pendingOrderId,
  countdownLabel,
  confirmOpen,
  setConfirmOpen,
  confirmHighlightId,
  fullMapOpen,
  setFullMapOpen,
  seatCoverage,
  showSeatingMap,
  selectedIds,
  totalAmount,
  feeBreakdown,
  previewSeats,
  toggleSeat,
  removeSeat,
  handleReserveAndPay,
  executeReserveAndPay,
  continuePendingPayment,
}) => {
  const navigate = useNavigate();

  const displayMinPrice = useMemo(() => {
    if (filterCategory === 'all') {
      const prices = categories
        .flatMap((c) => (c.seats || []).map((s) => s.price || 0))
        .filter((p) => p > 0);
      return prices.length ? Math.min(...prices) : 0;
    }
    const cat = categories.find((c) => c.categoryName === filterCategory);
    return cat ? categoryMinPrice(cat) : 0;
  }, [categories, filterCategory]);

  const handleMapToggle = (category: TicketCategory, seat: AvailableSeat, label?: string) => {
    toggleSeat(category, seat, label);
  };

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

  if (fullMapOpen && showSeatingMap) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setFullMapOpen(false)}
            className="flex items-center gap-1 text-sm font-medium text-foreground"
          >
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <p className="text-sm font-bold text-primary">Mapa completo</p>
          <span className="w-16" />
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
              filterCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Todo
          </button>
          {categories.map((cat) => (
            <button
              key={cat.distributionId}
              type="button"
              onClick={() => setFilterCategory(cat.categoryName)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                filterCategory === cat.categoryName
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <LovableVenueMap
            interactive
            floors={venueFloors}
            ticketCategories={categories}
            filterCategoryName={filterCategory}
            selectedIds={selectedIds}
            onToggle={handleMapToggle}
            height="min(70vh, 520px)"
          />
        </div>

        {selected.length > 0 && (
          <div className="border-t border-border px-4 py-4">
            <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{selected.length} silla(s)</p>
                <p className="text-lg font-bold text-primary">{fmt(totalAmount)}</p>
              </div>
              <Button className="rounded-full px-8 py-6 font-semibold" onClick={handleReserveAndPay}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        <LovableCheckoutConfirmSheet
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={executeReserveAndPay}
          submitting={submitting}
          eventName={eventMeta.name}
          venueFloors={venueFloors}
          ticketCategories={categories}
          previewSeats={previewSeats}
          highlightSeatId={confirmHighlightId}
          totalAmount={totalAmount}
          feeBreakdown={feeBreakdown}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-background pb-32">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="h-5 w-5" /> Volver
        </button>
        <p className="text-base font-bold text-primary">Compra de boletería</p>
        <h1 className="text-2xl font-extrabold leading-tight text-foreground">
          {eventMeta.name || 'Evento'}
        </h1>
      </div>

      {pendingOrderId && (
        <div className="mx-4 mt-4 rounded-2xl border-2 border-primary bg-card px-4 py-3">
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

      {(eventMeta.venueName || eventMeta.venueAddress) && (
        <div className="mt-4 px-4">
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <HomeIcon className="mt-1 h-6 w-6 text-primary" />
              <div className="flex-1">
                <p className="font-bold text-foreground">{eventMeta.venueName || 'Lugar del evento'}</p>
                {eventMeta.capacity ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Capacidad aproximada: {eventMeta.capacity}
                  </p>
                ) : null}
                {eventMeta.venueAddress ? (
                  <p className="text-xs text-muted-foreground">{eventMeta.venueAddress}</p>
                ) : null}
              </div>
            </div>
            {eventMeta.venueAddress && (
              <button
                type="button"
                onClick={() => navigate(`/map?event=${eventId}`)}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary"
              >
                <MapPin className="h-4 w-4" /> Ver ubicación en el mapa
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 px-4">
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-primary" />
            <p className="font-bold">Mapa de silletería</p>
            <span className="text-xs text-muted-foreground">Categorías ({categories.length})</span>
          </div>

          <div className="mt-3 flex gap-4 overflow-x-auto border-b border-border">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`whitespace-nowrap pb-2 text-sm font-semibold ${
                filterCategory === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              Todo
            </button>
            {categories.map((cat) => (
              <button
                key={cat.distributionId}
                type="button"
                onClick={() => setFilterCategory(cat.categoryName)}
                className={`whitespace-nowrap pb-2 text-sm font-semibold ${
                  filterCategory === cat.categoryName
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>

          {showSeatingMap ? (
            <>
              <div className="mt-4 overflow-x-auto">
                <LovableVenueMap
                  interactive
                  floors={venueFloors}
                  ticketCategories={categories}
                  filterCategoryName={filterCategory}
                  selectedIds={selectedIds}
                  onToggle={handleMapToggle}
                  height={280}
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-primary" /> Disponible
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-foreground/70" /> Ocupada
                  </span>
                </div>
                {displayMinPrice > 0 && (
                  <span className="font-bold text-primary">
                    desde {fmt(displayMinPrice)}
                  </span>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setFullMapOpen(true)}
                  className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-md"
                >
                  <Maximize2 className="h-4 w-4" /> Ver completo
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 space-y-4">
              {categories.map((cat, catIdx) => (
                <div key={cat.distributionId}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{cat.categoryName}</p>
                    <span className="text-sm font-semibold text-primary">{fmt(categoryMinPrice(cat))}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(cat.seats || []).map((seat) => {
                      const isSelected = selectedIds.has(seat.ticketInstanceId);
                      const label = resolveSeatLabel(seat) || seat.ticketInstanceId.slice(0, 6);
                      return (
                        <button
                          key={seat.ticketInstanceId}
                          type="button"
                          disabled={!!pendingOrderId}
                          onClick={() => toggleSeat(cat, seat, label)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/60 text-foreground hover:bg-muted'
                          }`}
                        >
                          <Armchair className="mr-1 inline h-3 w-3" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <span className={`mt-1 inline-block h-2 w-2 rounded-full ${CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length]}`} />
                </div>
              ))}
            </div>
          )}

          {seatCoverage && seatCoverage.venueSeats > 0 && seatCoverage.matchedOffers < seatCoverage.ticketSeats && (
            <p className="mt-3 text-xs text-amber-600">
              Algunas sillas del venue no tienen oferta de boletería vinculada ({seatCoverage.matchedOffers}/
              {seatCoverage.ticketSeats}).
            </p>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-5 px-4">
          <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm">
            <p className="text-sm font-bold">Sillas seleccionadas ({selected.length})</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {selected.map((item) => (
                <button
                  key={item.seat.ticketInstanceId}
                  type="button"
                  onClick={() => removeSeat(item.seat.ticketInstanceId)}
                  className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 p-2 text-foreground"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected.length > 0 && !pendingOrderId && (
        <div className="mt-5 px-4">
          <CheckoutFeeBreakdown
            subtotal={feeBreakdown.subtotal}
            serviceFee={feeBreakdown.serviceFee}
            total={feeBreakdown.total}
            ticketCount={feeBreakdown.ticketCount}
          />
        </div>
      )}

      {selected.length > 0 && !pendingOrderId && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
          <div className="mx-auto max-w-lg">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{selected.length} silla(s) seleccionada(s)</p>
              <p className="text-base font-bold text-primary">{fmt(feeBreakdown.total)}</p>
            </div>
            <Button
              className="w-full rounded-full py-6 text-base font-semibold"
              onClick={handleReserveAndPay}
              disabled={submitting}
            >
              Reservar y continuar al pago
            </Button>
          </div>
        </div>
      )}

      <LovableCheckoutConfirmSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={executeReserveAndPay}
        submitting={submitting}
        eventName={eventMeta.name}
        venueFloors={venueFloors}
        ticketCategories={categories}
        previewSeats={previewSeats}
        highlightSeatId={confirmHighlightId}
        totalAmount={totalAmount}
        feeBreakdown={feeBreakdown}
      />
      </div>
    );
  };

export default LovableTicketCheckout;
