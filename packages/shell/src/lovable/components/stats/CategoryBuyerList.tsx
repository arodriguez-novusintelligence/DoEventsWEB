import { useState } from 'react';
import { ChevronLeft, Download, Users, Phone, Mail, Calendar, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import type { CategorySales, SeatInfo } from '@lovable/data/salesStatsData';

interface BuyerWithCategory extends SeatInfo {
  categoryName?: string;
  categoryColor?: string;
  categoryColorHex?: string;
}

interface CategoryBuyerListProps {
  category?: CategorySales;
  allCategories?: CategorySales[];
  currency: string;
  onBack: () => void;
  onExport: () => void;
  consolidated?: boolean;
}

const formatCurrency = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('es-CO')}`;

function resolveBuyerPaid(buyer: SeatInfo): boolean {
  if (typeof buyer.isPaid === 'boolean') return buyer.isPaid;
  if (buyer.paymentAuthorization === 'after') return false;
  return /pagado/i.test(String(buyer.paymentStatusLabel || ''));
}

function resolveBuyerStatusLabel(buyer: SeatInfo): string {
  if (buyer.paymentStatusLabel) return buyer.paymentStatusLabel;
  if (buyer.paymentAuthorization === 'after') return 'Post-evento (pendiente)';
  return resolveBuyerPaid(buyer) ? 'Pre-evento (pagado)' : 'Pre-evento (pendiente)';
}

const CategoryBuyerList = ({ category, allCategories, currency, onBack, onExport, consolidated }: CategoryBuyerListProps) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const buyers: BuyerWithCategory[] = consolidated && allCategories
    ? allCategories.flatMap(cat =>
        cat.seats.filter(s => s.sold).map(s => ({
          ...s,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryColorHex: cat.colorHex,
        }))
      )
    : (category?.seats.filter(s => s.sold) ?? []).map(s => ({
        ...s,
        categoryName: category?.name,
        categoryColor: category?.color,
        categoryColorHex: category?.colorHex,
      }));

  const title = consolidated ? 'Todos los compradores' : `Compradores — ${category?.name}`;
  const colorHex = category?.colorHex ?? '#6366f1';

  const prePaid = buyers.filter((b) => b.paymentAuthorization !== 'after' && resolveBuyerPaid(b));
  const prePending = buyers.filter((b) => b.paymentAuthorization !== 'after' && !resolveBuyerPaid(b));
  const postPending = buyers.filter((b) => b.paymentAuthorization === 'after');
  const sumTotal = (list: typeof buyers) => list.reduce((s, b) => s + (b.totalWithCommission ?? 0), 0);
  const totalSale = sumTotal(buyers);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 text-foreground" />
          {!consolidated && category && (
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: category.colorHex }}
            />
          )}
          <span className="text-sm font-extrabold text-foreground">{title}</span>
        </button>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-3.5 w-3.5" />
          Excel
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center rounded-xl bg-muted/50 p-2.5 shadow-sm">
          <span className="text-xs font-bold text-foreground">{formatCurrency(totalSale, currency)}</span>
          <span className="text-[10px] text-muted-foreground">Total venta ({buyers.length})</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-success/10 p-2.5 shadow-sm">
          <span className="text-xs font-bold text-success">{formatCurrency(sumTotal(prePaid), currency)}</span>
          <span className="text-[10px] text-success">Pre-evento pagado ({prePaid.length})</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-warning/10 p-2.5 shadow-sm">
          <span className="text-xs font-bold text-warning">{formatCurrency(sumTotal(prePending), currency)}</span>
          <span className="text-[10px] text-warning">Pre-evento pendiente ({prePending.length})</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border/60 p-2.5 shadow-sm">
          <span className="text-xs font-bold text-muted-foreground">{formatCurrency(sumTotal(postPending), currency)}</span>
          <span className="text-[10px] text-muted-foreground">Post-evento pendiente ({postPending.length})</span>
        </div>
      </div>

      <div className="space-y-2">
        {buyers.map((buyer, idx) => {
          const isExpanded = expandedIdx === idx;
          const isPre = buyer.paymentAuthorization !== 'after';
          const paid = resolveBuyerPaid(buyer);
          const statusLabel = resolveBuyerStatusLabel(buyer);
          const buyerColorHex = buyer.categoryColorHex ?? colorHex;

          return (
            <div
              key={`${buyer.row}${buyer.number}-${buyer.buyerName || 'x'}-${idx}`}
              className="overflow-hidden rounded-xl border border-border/60 shadow-sm transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/30"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: buyerColorHex }}
                >
                  {buyer.row}{buyer.number}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {buyer.buyerName || 'Comprador'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-muted-foreground">{buyer.purchaseDate || '—'}</p>
                    {consolidated && buyer.categoryName && (
                      <span
                        className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white"
                        style={{ backgroundColor: buyerColorHex }}
                      >
                        {buyer.categoryName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-foreground">
                    {formatCurrency(buyer.totalWithCommission ?? buyer.amountPaid ?? 0, currency)}
                  </p>
                  {isPre ? (
                    <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      paid ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                    }`}>
                      {paid ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                      {statusLabel}
                    </span>
                  ) : (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {statusLabel}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-2 border-t border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {buyer.buyerPhone || 'Sin teléfono'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {buyer.buyerEmail || 'Sin correo'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Fecha de compra: {buyer.purchaseDate || '—'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    Monto: {formatCurrency(buyer.amountPaid ?? 0, currency)} + Comisión:{' '}
                    {formatCurrency(buyer.platformCommission ?? 0, currency)}
                  </div>
                  {isPre && (
                    <div className="flex items-center gap-2 text-xs">
                      {paid ? (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pago aprobado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning">
                          <Clock className="h-3.5 w-3.5" /> Pago pendiente de confirmación
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {buyers.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">No hay compradores en esta categoría</p>
        </div>
      )}
    </div>
  );
};

export default CategoryBuyerList;
