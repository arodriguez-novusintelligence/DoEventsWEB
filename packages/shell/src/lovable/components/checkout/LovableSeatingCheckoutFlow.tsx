import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Armchair,
  ChevronLeft,
  Grid3x3,
  Home as HomeIcon,
  Info,
  MapPin,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  Tag as TagIcon,
  Trash2,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import LovableVenueMap from '@lovable/components/venue/LovableVenueMap';
import MultiFloorVenueMap from '@lovable/components/venue/MultiFloorVenueMap';
import { CheckoutFeeBreakdown } from './CheckoutFeeBreakdown';
import { CheckoutPromoCodeBlock } from './CheckoutPromoCodeBlock';
import type { useTicketCheckout } from '../../../lovable-bridge/useTicketCheckout';
import { resolveImageUrl, type TicketCategory } from '@doevents/shared';

type SeatingCheckoutState = ReturnType<typeof useTicketCheckout>;

interface LovableSeatingCheckoutFlowProps extends SeatingCheckoutState {
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

function categoryUnitPrice(cat: TicketCategory) {
  const prices = (cat.seats || []).map((s) => s.price || 0).filter((p) => p > 0);
  return prices.length ? prices[0] : 0;
}

export const LovableSeatingCheckoutFlow: React.FC<LovableSeatingCheckoutFlowProps> = ({
  eventId,
  submitting,
  categories,
  mapCategories,
  selected,
  venueFloors,
  eventMeta,
  filterCategory,
  setFilterCategory,
  pendingOrderId,
  countdownLabel,
  remainingMs,
  seatingStep,
  setSeatingStep,
  mapZoom,
  setMapZoom,
  activeCategoryTab,
  setActiveCategoryTab,
  selectedByCategory,
  getCategoryColor,
  openFullMap,
  closeFullMap,
  goToSeatingConfirm,
  handleSeatingContinueToPay,
  continuePendingPayment,
  selectedIds,
  totalAmount,
  feeBreakdown,
  toggleSeat,
  removeSeat,
  seatCoverage,
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
}) => {
  const navigate = useNavigate();
  const [showVenueImages, setShowVenueImages] = useState(true);
  const timeStr = formatTimerParts(remainingMs);
  const hasActiveReservation = Boolean(pendingOrderId);

  const venueImages = useMemo(() => {
    const imgs = eventMeta.venueImages || [];
    if (imgs.length) return imgs.map((img) => resolveImageUrl(img) || img).filter(Boolean);
    if (eventMeta.image) return [resolveImageUrl(eventMeta.image) || eventMeta.image];
    return [];
  }, [eventMeta.venueImages, eventMeta.image]);

  const floorNumbers = useMemo(
    () => [...new Set(venueFloors.map((f) => f.floorNumber ?? 1))].sort((a, b) => a - b),
    [venueFloors],
  );

  const mapFilterIsCategory = filterCategory !== 'all';

  const selectedSeatsForMap = useMemo(
    () => selected.map((item) => ({
      categoryName: item.category.categoryName,
      label: item.label,
    })),
    [selected],
  );

  if (seatingStep === 'fullmap') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={closeFullMap}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Preview</p>
            <h2 className="text-lg font-extrabold">Vista completa del mapa</h2>
          </div>
        </div>

        <div className="border-b border-border bg-card/50">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            <button
              type="button"
              onClick={() => {
                setFilterCategory('all');
                setMapZoom((z) => Math.max(125, z));
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                filterCategory === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground'
              }`}
            >
              Todo
            </button>
            {categories.map((cat) => (
              <button
                key={cat.distributionId}
                type="button"
                onClick={() => setFilterCategory(cat.categoryName)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  filterCategory === cat.categoryName
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: getCategoryColor(cat.categoryName) }}
                />
                {cat.categoryName}
              </button>
            ))}
          </div>
        </div>

        {!mapFilterIsCategory && (
          <p className="border-b border-border bg-muted/30 px-4 py-2 text-center text-[11px] text-muted-foreground">
            Vista Todo: acerca con +/− o elige una categoría para seleccionar sillas con precisión.
          </p>
        )}
        {mapFilterIsCategory && (
          <p className="border-b border-border bg-muted/30 px-4 py-2 text-center text-[11px] text-muted-foreground">
            Vista {filterCategory}: usa +/− para acercar y seleccionar con precisión.
          </p>
        )}

        <div className="relative flex-1 overflow-auto bg-muted/20 p-4">
          <div
            className="origin-top-left mx-auto max-w-5xl"
            style={{
              transform: `scale(${mapZoom / 100})`,
              transformOrigin: 'top center',
              width: `${10000 / mapZoom}%`,
            }}
          >
            <MultiFloorVenueMap
              layoutMode="tabs"
              interactive={!hasActiveReservation}
              floors={venueFloors}
              ticketCategories={categories}
              displayCategories={mapCategories}
              filterCategoryName={filterCategory}
              selectedIds={selectedIds}
              selectedSeats={selectedSeatsForMap}
              onToggle={(cat, seat, label) => toggleSeat(cat, seat, label)}
              height={mapFilterIsCategory ? 'min(62vh, 560px)' : 'min(58vh, 520px)'}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 px-4 pb-4 pt-2 text-xs">
            {categories.map((cat) => (
              <div key={cat.distributionId} className="flex items-center gap-1.5">
                <span
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: getCategoryColor(cat.categoryName), opacity: 0.85 }}
                />
                <span className="text-muted-foreground">{cat.categoryName}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary" />
              <span className="text-muted-foreground">Seleccionada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: '#f97316' }} />
              <span className="text-muted-foreground">Reservada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-muted-foreground">Vendida</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-28 right-4 flex items-center gap-2 rounded-full bg-foreground px-2 py-2 text-background shadow-lg">
            <button
              type="button"
              onClick={() => setMapZoom((z) => Math.max(50, z - 25))}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background/10"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-1 text-xs font-semibold tabular-nums">{mapZoom}%</span>
            <button
              type="button"
              onClick={() => setMapZoom((z) => Math.min(300, z + 25))}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background/10"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

        {selected.length > 0 && (
          <div className="border-t border-border bg-card px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{selected.length} silla(s) seleccionada(s)</p>
              <p className="text-base font-bold text-primary">{fmt(feeBreakdown.total)}</p>
            </div>
            <Button
              className="w-full rounded-full py-5 text-sm font-semibold"
              disabled={submitting || hasActiveReservation}
              onClick={goToSeatingConfirm}
            >
              Confirmar selección
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (seatingStep === 'confirm') {
    return (
      <div className="mx-auto min-h-screen max-w-lg bg-background pb-32">
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => setSeatingStep('seatmap')}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground"
          >
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <p className="text-base font-bold text-primary">Confirmación de boletería</p>
          <h1 className="text-2xl font-extrabold leading-tight text-foreground">
            {eventMeta.name || 'Evento'}
          </h1>

          {hasActiveReservation && (
            <div className="mt-4 rounded-2xl border-2 border-primary bg-primary/5 px-4 py-3">
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

          {selected.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-card p-8 text-center text-muted-foreground">
              No has seleccionado boletas.
            </div>
          ) : (
            Array.from(selectedByCategory.entries()).map(([catId, seats]) => {
              const cat = categories.find((c) => c.distributionId === catId);
              if (!cat) return null;
              const unitPrice = categoryUnitPrice(cat);
              return (
                <div
                  key={catId}
                  className="mt-5 rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-lg font-extrabold text-primary">{cat.categoryName}</p>
                      </div>
                    </div>
                    <button type="button" onClick={openFullMap} className="text-foreground" aria-label="Editar">
                      <Pencil className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Sillas seleccionadas</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Armchair className="h-4 w-4 text-primary" />
                        <span className="text-base font-bold text-foreground">{seats.length}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Precio</p>
                      <p className="text-base font-bold text-foreground">{fmt(unitPrice)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-bold">Sillas ({seats.length})</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {seats.map((item) => (
                      <button
                        key={item.seat.ticketInstanceId}
                        type="button"
                        disabled={hasActiveReservation}
                        onClick={() => removeSeat(item.seat.ticketInstanceId)}
                        className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 p-2 text-foreground disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <Button
            variant="outline"
            className="mt-5 w-full rounded-full border-2 border-primary py-6 font-semibold text-primary"
            disabled={hasActiveReservation}
            onClick={openFullMap}
          >
            Agregar otra boleta
          </Button>

          {selected.length > 0 && (
            <div className="mt-5 space-y-2 rounded-2xl bg-card p-4 shadow-sm">
              <div className="grid grid-cols-3 pb-1 text-sm font-bold">
                <span>Categoría</span>
                <span className="text-center"># Boletas</span>
                <span className="text-right">Valor</span>
              </div>
              {Array.from(selectedByCategory.entries()).map(([catId, seats]) => {
                const cat = categories.find((c) => c.distributionId === catId);
                if (!cat) return null;
                const unitPrice = categoryUnitPrice(cat);
                return (
                  <div
                    key={catId}
                    className="grid grid-cols-3 border-t border-dashed border-border py-2 text-sm"
                  >
                    <div>
                      <p>{cat.categoryName}</p>
                    </div>
                    <span className="text-center text-muted-foreground">x{seats.length}</span>
                    <span className="text-right font-medium">{fmt(seats.length * unitPrice)}</span>
                  </div>
                );
              })}
              <CheckoutFeeBreakdown
                embedded
                subtotal={feeBreakdown.subtotal}
                serviceFee={feeBreakdown.serviceFee}
                total={payableTotal}
                ticketCount={feeBreakdown.ticketCount}
              />
              {promoApplied && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="inline-flex items-center gap-1">
                    <TagIcon className="h-3.5 w-3.5" /> Código {promoApplied.code}
                  </span>
                  <span>- {fmt(promoDiscount)}</span>
                </div>
              )}
            </div>
          )}

          {selected.length > 0 && !hasActiveReservation && (
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

          {hasActiveReservation ? (
            <>
              <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-primary bg-card px-4 py-3">
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
          ) : (
            <div className="mt-5 rounded-2xl border-2 border-primary/30 bg-primary/5 px-4 py-4 text-center shadow-sm">
              <p className="text-base font-bold text-foreground">
                Al continuar, tus sillas quedarán reservadas por 15 minutos
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Asegúrate de revisar todos los detalles antes de finalizar. Completa el pago con Wompi
                para confirmar tu compra.
              </p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
          <div className="mx-auto max-w-lg">
            {hasActiveReservation ? (
              <Button
                className="w-full rounded-full py-6 text-base font-semibold"
                onClick={continuePendingPayment}
              >
                Ir al pago
              </Button>
            ) : (
              <Button
                className="w-full rounded-full py-6 text-base font-semibold"
                disabled={selected.length === 0 || submitting}
                onClick={handleSeatingContinueToPay}
              >
                {submitting ? 'Reservando…' : 'Continuar'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
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

      {hasActiveReservation && (
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
                    Lugar con capacidad para {eventMeta.capacity} personas
                  </p>
                ) : null}
                {eventMeta.venueAddress ? (
                  <p className="text-xs text-muted-foreground">{eventMeta.venueAddress}</p>
                ) : null}
              </div>
            </div>
            {venueImages.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowVenueImages((v) => !v)}
                  className="mt-3 text-sm font-semibold text-primary"
                >
                  {showVenueImages ? '∧ Ocultar' : '∨ Ver'} imágenes del lugar
                </button>
                {showVenueImages && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {venueImages.map((img) => (
                      <img key={img} src={img} alt="" className="h-20 w-20 rounded-xl object-cover" />
                    ))}
                  </div>
                )}
              </>
            )}
            {eventMeta.venueAddress && (
              <button
                type="button"
                onClick={() => navigate(`/map?event=${eventId}&returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
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
          </div>

          <div className="relative mt-3">
            <div className="max-h-[65vh] overflow-auto rounded-xl bg-muted/20 p-2">
              <div
                className="origin-top-left"
                style={{
                  transform: `scale(${mapZoom / 100})`,
                  transformOrigin: 'top left',
                  width: `${10000 / mapZoom}%`,
                }}
              >
                <MultiFloorVenueMap
                  layoutMode="tabs"
                  interactive={!hasActiveReservation}
                  floors={venueFloors}
                  ticketCategories={categories}
                  displayCategories={mapCategories}
                  filterCategoryName={activeCategoryTab || 'all'}
                  selectedIds={selectedIds}
                  selectedSeats={selectedSeatsForMap}
                  onToggle={(cat, seat, label) => toggleSeat(cat, seat, label)}
                  height="min(52vh, 460px)"
                />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-foreground px-2 py-1.5 text-background shadow-lg">
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.max(50, z - 25))}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-background/10"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-1 text-xs font-semibold tabular-nums">{mapZoom}%</span>
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.min(300, z + 25))}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-background/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-border bg-white" />
              <span className="text-muted-foreground">Disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-primary" />
              <span className="text-muted-foreground">Seleccionada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: '#f97316' }} />
              <span className="text-muted-foreground">Reservada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: '#dc2626' }} />
              <span className="text-muted-foreground">Vendida</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <p className="text-sm font-bold">Selecciona tus sillas por categoría</p>
            <span className="text-xs text-muted-foreground">({categories.length})</span>
          </div>
          <div className="mt-2 flex gap-4 overflow-x-auto border-b border-border">
            <button
              type="button"
              onClick={() => {
                setActiveCategoryTab('');
                setMapZoom((z) => Math.max(125, z));
              }}
              className={`whitespace-nowrap pb-2 text-sm font-semibold ${
                !activeCategoryTab
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
                onClick={() => setActiveCategoryTab(cat.categoryName)}
                className={`whitespace-nowrap pb-2 text-sm font-semibold ${
                  activeCategoryTab === cat.categoryName
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {cat.categoryName}
              </button>
            ))}
          </div>

          {!activeCategoryTab && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              En Todo puedes ver todo el recinto; acerca el mapa o elige una categoría para marcar sillas.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={openFullMap}
              className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-md"
            >
              <Maximize2 className="h-4 w-4" /> Ver completo
            </button>
          </div>

          {seatCoverage && seatCoverage.venueSeats > 0 && seatCoverage.matchedOffers < seatCoverage.ticketSeats && (
            <p className="mt-3 text-xs text-amber-600">
              Algunas sillas del venue no tienen oferta de boletería vinculada ({seatCoverage.matchedOffers}/
              {seatCoverage.ticketSeats}).
            </p>
          )}
        </div>
      </div>

      {selected.length > 0 && !hasActiveReservation && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
          <div className="mx-auto max-w-lg">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{selected.length} silla(s) seleccionada(s)</p>
              <p className="text-base font-bold text-primary">{fmt(feeBreakdown.total)}</p>
            </div>
            <Button
              className="w-full rounded-full py-6 text-base font-semibold"
              onClick={() => setSeatingStep('confirm')}
            >
              Continuar a confirmación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LovableSeatingCheckoutFlow;
