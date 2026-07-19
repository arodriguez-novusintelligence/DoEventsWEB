import { useState } from 'react';
import { ChevronLeft, Ticket, Users, Download, Loader2, DollarSign, List } from 'lucide-react';
import type { EventChatRoom } from '@lovable/data/chatData';
import type { EventSalesData, CategorySales } from '@lovable/data/salesStatsData';
import { getEmptySalesData, resolveSalesData } from '../../../lovable-bridge/statsAdapter';
import { useLiveEventStats } from '../../../lovable-bridge/useLiveEventStats';
import { exportSalesExcel, exportCategoryBuyersExcel, exportAllBuyersExcel } from '@lovable/utils/exportSalesExcel';
import CategoryBuyerList from './CategoryBuyerList';
import StatsSectionBanner from './StatsSectionBanner';

interface SalesStatsViewProps {
  event: EventChatRoom;
  onBack: () => void;
}

const formatCurrency = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('es-CO')}`;

const SalesStatsView = ({ event, onBack }: SalesStatsViewProps) => {
  const { data: salesData, loading } = useLiveEventStats(
    event,
    resolveSalesData,
    getEmptySalesData(event),
    undefined,
    'sales',
  );
  const [selectedCategory, setSelectedCategory] = useState<CategorySales | null>(null);
  const [showBuyerList, setShowBuyerList] = useState(false);
  const [showConsolidatedBuyers, setShowConsolidatedBuyers] = useState(false);

  const totalSold = salesData.categories.reduce((s, c) => s + c.sold, 0);
  const totalCapacity = salesData.categories.reduce((s, c) => s + c.total, 0);
  const totalRevenue = salesData.categories.reduce((s, c) => s + c.revenue, 0);
  const totalOccupancy = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <StatsSectionBanner
        title="Estadísticas de Ventas"
        subtitle={event.eventName}
        icon={DollarSign}
        onBack={onBack}
        stats={[
          { value: loading ? '…' : `${totalSold}/${totalCapacity || totalSold}`, label: 'Vendidos' },
          { value: loading ? '…' : formatCurrency(totalRevenue, salesData.currency), label: 'Ingresos' },
          { value: loading ? '…' : `${totalOccupancy}%`, label: 'Ocupación' },
        ]}
        summary={
          <>
            Ingreso total:{' '}
            <span className="font-bold">{formatCurrency(totalRevenue, salesData.currency)}</span>
          </>
        }
        rightAction={(
          <button
            type="button"
            onClick={() => exportSalesExcel(salesData)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary-foreground/25"
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </button>
        )}
      />

      <div className="mx-auto max-w-lg px-4 pt-5">
        {loading && (
          <p className="mb-4 flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Cargando estadísticas de ventas…
          </p>
        )}
        {!loading && salesData.categories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Ticket className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Sin ventas registradas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cuando se vendan boletos para este evento, verás el desglose por categoría aquí.
            </p>
          </div>
        )}
        {!loading && salesData.categories.length > 0 && (
        <>
        {showConsolidatedBuyers ? (
          <CategoryBuyerList
            consolidated
            allCategories={salesData.categories}
            currency={salesData.currency}
            onBack={() => setShowConsolidatedBuyers(false)}
            onExport={() => exportAllBuyersExcel(salesData)}
          />
        ) : selectedCategory && showBuyerList ? (
          <CategoryBuyerList
            category={selectedCategory}
            currency={salesData.currency}
            onBack={() => setShowBuyerList(false)}
            onExport={() => exportCategoryBuyersExcel(selectedCategory, salesData.eventName, salesData.currency)}
          />
        ) : selectedCategory ? (
          <CategoryDetail
            category={selectedCategory}
            currency={salesData.currency}
            onBack={() => setSelectedCategory(null)}
            onShowBuyers={() => setShowBuyerList(true)}
          />
        ) : (
          <>
            {/* Consolidated buyers button */}
            <button
              onClick={() => setShowConsolidatedBuyers(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-card border border-primary/30 p-3.5 shadow-sm hover:bg-accent/30 transition-colors mb-5"
            >
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Ver todos los compradores</span>
            </button>
            {/* Category table */}
            <div className="rounded-2xl bg-card p-4 shadow-sm mb-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Resumen por categoría</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2 text-left font-medium">Categoría</th>
                      <th className="pb-2 text-center font-medium">Vendidos</th>
                      <th className="pb-2 text-center font-medium">Disp.</th>
                      <th className="pb-2 text-center font-medium">Ocup.</th>
                      <th className="pb-2 text-right font-medium">Neto vendido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.categories.map(cat => (
                      <tr
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat)}
                        className="border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <td className="py-2.5 flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: cat.colorHex }}
                          />
                          <span className="font-medium text-foreground">{cat.name}</span>
                        </td>
                        <td className="py-2.5 text-center text-foreground">{cat.sold}/{cat.total}</td>
                        <td className="py-2.5 text-center text-foreground">{cat.available}</td>
                        <td className="py-2.5 text-center text-foreground">{cat.occupancy}%</td>
                        <td className="py-2.5 text-right font-medium text-foreground">
                          {formatCurrency(cat.revenue, salesData.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Venue map */}
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-1">Selecciona una categoría para ver detalle</h3>

              <div className="mt-4 flex flex-col items-center gap-3">
                {/* Stage */}
                <div className="w-48 rounded-lg border-2 border-border bg-muted/50 py-3 text-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escenario</span>
                </div>

                {/* Categories around stage */}
                <div className="flex gap-2 mt-2">
                  {salesData.categories.slice(0, 3).map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat)}
                      className="flex flex-col items-center rounded-xl border-2 p-3 transition-colors hover:bg-accent/30"
                      style={{ borderColor: cat.colorHex }}
                    >
                      <Users className="h-3.5 w-3.5 mb-1" style={{ color: cat.colorHex }} />
                      <span className="text-xs font-semibold" style={{ color: cat.colorHex }}>{cat.name}</span>
                      <span className="text-[10px] font-medium" style={{ color: cat.colorHex }}>
                        {cat.sold}/{cat.total} vendidos
                      </span>
                      <span className="text-[9px] text-muted-foreground">{cat.occupancy}% ocupación</span>
                      <span className="text-[10px] font-bold text-foreground mt-0.5">
                        {formatCurrency(cat.revenue, salesData.currency)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Dance floor */}
                <div className="w-56 rounded-full border border-border bg-muted/30 py-1.5 text-center mt-1">
                  <span className="text-[10px] text-primary font-medium">Pista de Baile</span>
                </div>

                {/* General */}
                {salesData.categories[3] && (
                  <button
                    onClick={() => setSelectedCategory(salesData.categories[3])}
                    className="flex flex-col items-center rounded-xl border-2 px-10 py-3 transition-colors hover:bg-accent/30"
                    style={{ borderColor: salesData.categories[3].colorHex }}
                  >
                    <Users className="h-3.5 w-3.5 mb-1" style={{ color: salesData.categories[3].colorHex }} />
                    <span className="text-xs font-semibold" style={{ color: salesData.categories[3].colorHex }}>
                      {salesData.categories[3].name}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: salesData.categories[3].colorHex }}>
                      {salesData.categories[3].sold}/{salesData.categories[3].total} vendidos
                    </span>
                    <span className="text-[9px] text-muted-foreground">{salesData.categories[3].occupancy}% ocupación</span>
                    <span className="text-[10px] font-bold text-foreground mt-0.5">
                      {formatCurrency(salesData.categories[3].revenue, salesData.currency)}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
};

/* ── Category Detail Sub-view ── */

const CategoryDetail = ({
  category,
  currency,
  onBack,
  onShowBuyers,
}: {
  category: CategorySales;
  currency: string;
  onBack: () => void;
  onShowBuyers: () => void;
}) => {
  const [selectedSeat, setSelectedSeat] = useState<{
    row: string;
    number: number;
    buyerName?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    purchaseDate?: string;
  } | null>(null);

  const rows = category.seats.reduce<Record<string, typeof category.seats>>((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const hasSeats = category.seats.length > 0;

  return (
    <>
      <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm">
        <button type="button" onClick={onBack} className="mb-3 flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 text-foreground" />
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: category.colorHex }}
          />
          <span className="text-sm font-bold text-foreground">{category.name}</span>
        </button>

        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-muted/50 p-2.5">
            <span className="text-lg font-bold text-foreground">{category.total}</span>
            <span className="text-[10px] text-muted-foreground">Total</span>
          </div>
          <div className="flex flex-col items-center rounded-xl p-2.5" style={{ backgroundColor: `${category.colorHex}15` }}>
            <span className="text-lg font-bold" style={{ color: category.colorHex }}>{category.sold}</span>
            <span className="text-[10px]" style={{ color: category.colorHex }}>Vendidos</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-muted/50 p-2.5">
            <span className="text-lg font-bold text-foreground">{category.available}</span>
            <span className="text-[10px] text-muted-foreground">Disponibles</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-2.5">
            <span className="text-sm font-bold text-foreground">{formatCurrency(category.revenue, currency)}</span>
            <span className="text-[10px] text-muted-foreground">Neto vendido</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onShowBuyers}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-card p-3.5 shadow-sm transition-colors hover:bg-accent/30"
      >
        <List className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Ver lista de compradores</span>
      </button>

      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-bold text-foreground">Mapa de sillería</h3>
        <p className="mb-4 text-[11px] text-muted-foreground">
          Haz clic en un asiento vendido para ver los datos del comprador
        </p>

        <div className="mb-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: category.colorHex }}
            />
            <span className="text-[11px] text-muted-foreground">Vendido</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-border bg-muted" />
            <span className="text-[11px] text-muted-foreground">Disponible</span>
          </div>
        </div>

        {!hasSeats ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay sillas registradas para esta categoría.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {Object.entries(rows)
              .sort(([a], [b]) => a.localeCompare(b, 'es'))
              .map(([row, seats]) => (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-medium text-muted-foreground">{row}</span>
                  <div className="flex gap-1.5">
                    {[...seats]
                      .sort((a, b) => a.number - b.number)
                      .map((seat) => (
                        <button
                          key={`${seat.row}${seat.number}`}
                          type="button"
                          onClick={() => seat.sold && setSelectedSeat(seat)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all ${
                            seat.sold
                              ? 'cursor-pointer text-white shadow-sm hover:opacity-80'
                              : 'cursor-default border border-border bg-muted text-muted-foreground'
                          }`}
                          style={seat.sold ? { backgroundColor: category.colorHex } : undefined}
                          title={seat.sold ? (seat.buyerName || 'Vendido') : 'Disponible'}
                        >
                          {seat.number}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {selectedSeat && (
          <div className="mt-4 rounded-xl border border-border bg-accent/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Asiento{' '}
              <span className="font-semibold text-foreground">
                {selectedSeat.row}{selectedSeat.number}
              </span>
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {selectedSeat.buyerName || 'Comprador no identificado'}
            </p>
            {(selectedSeat.buyerPhone || selectedSeat.buyerEmail || selectedSeat.purchaseDate) && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {[selectedSeat.purchaseDate, selectedSeat.buyerPhone, selectedSeat.buyerEmail]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            <button
              type="button"
              onClick={() => setSelectedSeat(null)}
              className="mt-2 text-[11px] text-primary hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SalesStatsView;
