import { useState } from 'react';
import { ChevronLeft, Download, Users, Phone, Mail, Calendar, CreditCard, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import type { GuestInfo } from '@lovable/data/guestStatsData';
import { isPaymentCompleted, getPaymentStatusLabel } from '@lovable/utils/paymentStatus';

interface GuestBuyerListProps {
  guests: GuestInfo[];
  currency: string;
  onBack: () => void;
  onExport: () => void;
  refundedNames?: Set<string>;
}

const formatCurrency = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('es-CO')}`;

const GuestBuyerList = ({ guests, currency, onBack, onExport, refundedNames }: GuestBuyerListProps) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const buyers = guests.filter(g => g.confirmed);

  const totalSale = buyers.reduce((s, b) => s + (b.totalWithCommission ?? 0), 0);
  const prePaid = buyers.filter(b => b.paymentAuthorization === 'before' && b.purchaseDate && isPaymentCompleted(b.purchaseDate));
  const prePending = buyers.filter(b => b.paymentAuthorization === 'before' && (!b.purchaseDate || !isPaymentCompleted(b.purchaseDate)));
  const postPending = buyers.filter(b => b.paymentAuthorization === 'after');
  const sumTotal = (list: GuestInfo[]) => list.reduce((s, b) => s + (b.totalWithCommission ?? 0), 0);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 text-foreground" />
          <span className="text-sm font-bold text-foreground">Lista de compradores</span>
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Download className="h-3.5 w-3.5" />
          Excel
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex flex-col items-center rounded-xl bg-muted/50 p-2.5">
          <span className="text-xs font-bold text-foreground">{formatCurrency(totalSale, currency)}</span>
          <span className="text-[10px] text-muted-foreground">Total venta ({buyers.length})</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-emerald-500/10 p-2.5">
          <span className="text-xs font-bold text-emerald-600">{formatCurrency(sumTotal(prePaid), currency)}</span>
          <span className="text-[10px] text-emerald-600">Pre-evento pagado ({prePaid.length})</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-amber-500/10 p-2.5">
          <span className="text-xs font-bold text-amber-600">{formatCurrency(sumTotal(prePending), currency)}</span>
          <span className="text-[10px] text-amber-600">Pre-evento pendiente ({prePending.length})</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-border p-2.5">
          <span className="text-xs font-bold text-muted-foreground">{formatCurrency(sumTotal(postPending), currency)}</span>
          <span className="text-[10px] text-muted-foreground">Post-evento pendiente ({postPending.length})</span>
        </div>
      </div>

      {/* Buyer list */}
      <div className="space-y-2">
        {buyers.map((buyer, idx) => {
          const isExpanded = expandedIdx === idx;
          const isPre = buyer.paymentAuthorization === 'before';
          const paid = isPre && buyer.purchaseDate ? isPaymentCompleted(buyer.purchaseDate) : false;
          const statusLabel = getPaymentStatusLabel(buyer.paymentAuthorization!, buyer.purchaseDate);
          const isRefunded = refundedNames?.has(buyer.name.split(' ')[0]) ?? false;

          return (
            <div key={`${buyer.name}-${idx}`} className="rounded-xl border border-border overflow-hidden transition-all">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/30 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  {buyer.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{buyer.name}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] text-muted-foreground">{buyer.purchaseDate}</p>
                    {buyer.category && (
                      <span className="inline-block rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-accent-foreground">
                        {buyer.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">
                    {formatCurrency(buyer.totalWithCommission ?? 0, currency)}
                  </p>
                  {isRefunded ? (
                    <span className="inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-orange-500/15 text-orange-600">
                      <RotateCcw className="h-2.5 w-2.5" />
                      Reembolsado
                    </span>
                  ) : isPre ? (
                    <span className={`inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      paid ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                    }`}>
                      {paid ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                      {statusLabel}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-muted text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {statusLabel}
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {buyer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {buyer.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Fecha de compra: {buyer.purchaseDate}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    Monto: {formatCurrency(buyer.amountPaid ?? 0, currency)} + Comisión: {formatCurrency(buyer.platformCommission ?? 0, currency)}
                  </div>
                  {isPre && (
                    <div className="flex items-center gap-2 text-xs">
                      {paid ? (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pago procesado (3 días hábiles cumplidos)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3.5 w-3.5" /> Pago pendiente (se procesa 3 días hábiles después de la compra)
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
        <p className="text-center text-sm text-muted-foreground py-8">No hay compradores confirmados</p>
      )}
    </div>
  );
};

export default GuestBuyerList;
