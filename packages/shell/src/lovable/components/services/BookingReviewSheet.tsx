import { Calendar, CreditCard, Clock, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';

export interface BookingReviewSummary {
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  datesLabel?: string;
  total?: number;
  currency?: string;
  lines?: Array<{ label: string; value: string }>;
}

interface BookingReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: BookingReviewSummary;
  onConfirm: () => void;
  confirming?: boolean;
  confirmLabel?: string;
  confirmError?: string | null;
}

function formatCurrency(amount?: number, currency = 'COP') {
  if (!amount) return '—';
  const prefix = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
  return `${prefix} ${amount.toLocaleString('es-CO')}`;
}

function formatDate(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const BookingReviewSheet = ({
  open,
  onOpenChange,
  summary,
  onConfirm,
  confirming = false,
  confirmLabel = 'Confirmar reserva',
  confirmError = null,
}: BookingReviewSheetProps) => {
  const dateLabel = summary.datesLabel
    || (summary.startDate
      ? summary.endDate && summary.endDate !== summary.startDate
        ? `${formatDate(summary.startDate)} – ${formatDate(summary.endDate)}`
        : formatDate(summary.startDate)
      : null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-lg mx-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Revisar reserva
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-muted/40 p-4">
            <p className="text-base font-bold text-foreground">{summary.title}</p>
            {summary.subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{summary.subtitle}</p>
            )}
          </div>

          {dateLabel && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span>{dateLabel}</span>
            </div>
          )}

          {summary.lines?.map((line) => (
            <div key={line.label} className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{line.label}</span>
              <span className="font-medium text-foreground">{line.value}</span>
            </div>
          ))}

          {summary.total != null && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Total
                </div>
                <span className="text-base font-bold text-primary">
                  {formatCurrency(summary.total, summary.currency)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Al confirmar, aceptas los términos de reserva del proveedor y la política de cancelación aplicable.
            </p>
          </div>

          {confirmError && (
            <p className="text-xs text-center text-destructive">{confirmError}</p>
          )}

          <Button
            type="button"
            className="w-full rounded-full"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              confirmLabel
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingReviewSheet;
