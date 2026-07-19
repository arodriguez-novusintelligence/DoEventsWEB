import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  CalendarDays,
  Lock,
  Loader2,
  ShieldCheck,
  Tag as TagIcon,
  Check as CheckIcon,
} from 'lucide-react';
import { validateServicePromoCode } from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { Checkbox } from '@lovable/components/ui/checkbox';
import { cn } from '@lovable/lib/utils';

export interface ServiceRentalCheckoutViewProps {
  orderId: string;
  serviceId: string;
  serviceName: string;
  startDate: string;
  endDate: string;
  days: number;
  totalAmount: number;
  currency?: string;
  remainingMs?: number | null;
  disabled?: boolean;
  onConfirmPayment: (payload: {
    email: string;
    promoCode?: string;
    discountedAmount: number;
  }) => Promise<void>;
  onAbort?: () => void;
  onPayLater?: () => void;
  defaultEmail?: string;
}

function formatCurrency(amount: number, currency = 'COP') {
  return `${currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$'} ${amount.toLocaleString('es-CO')}`;
}

function formatWompiTimer(remainingMs: number | null | undefined) {
  if (remainingMs == null) return { h: '00', m: '00', s: '00', low: false };
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    h: pad(h),
    m: pad(m),
    s: pad(s),
    low: totalSec < 6 * 60,
  };
}

function formatDateLabel(iso: string) {
  return iso.split('-').reverse().join('/');
}

const ServiceRentalCheckoutView: React.FC<ServiceRentalCheckoutViewProps> = ({
  orderId,
  serviceId,
  serviceName,
  startDate,
  endDate,
  days,
  totalAmount,
  currency = 'COP',
  remainingMs,
  disabled = false,
  onConfirmPayment,
  onAbort,
  onPayLater,
  defaultEmail = '',
}) => {
  const [processing, setProcessing] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState(defaultEmail);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; value: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEmail && !buyerEmail) setBuyerEmail(defaultEmail);
  }, [defaultEmail, buyerEmail]);

  const timeStr = useMemo(() => formatWompiTimer(remainingMs), [remainingMs]);
  const promoDiscount = promoApplied?.value ?? 0;
  const totalToPay = Math.max(0, totalAmount - promoDiscount);
  const emailValid = /.+@.+\..+/.test(buyerEmail.trim());
  const canPay = emailValid && !disabled && (remainingMs == null || remainingMs > 0);

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Ingresa un código.');
      return;
    }
    const res = await validateServicePromoCode(serviceId, code);
    if (!res.ok || !res.value) {
      setPromoError(
        res.reason === 'already_used'
          ? 'Este código ya fue utilizado.'
          : 'Código no válido.',
      );
      setPromoApplied(null);
      return;
    }
    setPromoApplied({ code, value: res.value });
    setPromoError(null);
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoInput('');
    setPromoError(null);
  };

  const handlePay = () => {
    if (!canPay || processing) return;
    setProcessing(true);
    void onConfirmPayment({
      email: buyerEmail.trim(),
      promoCode: promoApplied?.code,
      discountedAmount: totalToPay,
    })
      .catch(() => undefined)
      .finally(() => setProcessing(false));
  };

  if (processing) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center space-y-5 bg-muted/40 px-6">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <p className="text-base font-bold text-foreground">Redirigiendo a Wompi…</p>
        <p className="text-sm text-muted-foreground">No cierres esta pantalla</p>
        <div className="w-full space-y-1 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total a pagar</span>
            <span className="font-bold text-foreground">{formatCurrency(totalToPay, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Orden</span>
            <span className="font-medium">{orderId.slice(-8)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-muted/40 pb-36">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-muted/40 px-4 pb-2 pt-4 backdrop-blur">
        {onAbort ? (
          <button
            type="button"
            onClick={onAbort}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        ) : (
          <div />
        )}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm">
          <Lock className="h-3 w-3 text-emerald-600" />
          SSL seguro
        </div>
      </div>

      <div className="space-y-4 px-4">
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="truncate text-sm font-bold text-foreground">{serviceName}</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Fechas</span>
              <span className="text-right font-semibold text-foreground">
                {formatDateLabel(startDate)} → {formatDateLabel(endDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración</span>
              <span className="font-semibold text-foreground">
                {days} día{days !== 1 ? 's' : ''}
              </span>
            </div>
            {promoApplied && (
              <div className="flex justify-between text-emerald-600">
                <span className="inline-flex items-center gap-1">
                  <TagIcon className="h-3.5 w-3.5" />
                  Descuento ({promoApplied.code})
                </span>
                <span className="font-semibold">- {formatCurrency(promoDiscount, currency)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
              <span className="text-base font-bold text-foreground">Total a pagar</span>
              <span className="text-lg font-extrabold text-primary">
                {formatCurrency(totalToPay, currency)}
              </span>
            </div>
            <p className="-mt-1 text-right text-[11px] text-muted-foreground">IVA incluido</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={promoEnabled}
              onCheckedChange={(v) => setPromoEnabled(Boolean(v))}
              className="h-5 w-5"
            />
            <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
              <TagIcon className="h-4 w-4 text-primary" />
              Tengo un código promocional
            </span>
          </label>
          {promoEnabled && (
            <div className="mt-3">
              {promoApplied ? (
                <div className="flex items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Código aplicado</p>
                      <p className="font-mono text-sm font-bold text-emerald-700">{promoApplied.code}</p>
                    </div>
                  </div>
                  <button type="button" onClick={removePromo} className="text-xs font-bold text-rose-600">
                    Quitar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Ej. DOE-AB12CD"
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm uppercase outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => void applyPromo()}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                    >
                      Aplicar
                    </button>
                  </div>
                  {promoError && <p className="mt-1 text-xs text-rose-600">{promoError}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    El descuento se aplica al total de la compra.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex items-center justify-between rounded-2xl border-2 bg-card px-4 py-3',
            timeStr.low ? 'border-rose-500' : 'border-primary',
          )}
        >
          <span className={cn('text-sm font-bold', timeStr.low ? 'text-rose-600' : 'text-primary')}>
            Tiempo restante
          </span>
          <div className="text-right">
            <p className="text-xl font-extrabold tabular-nums text-foreground">
              {timeStr.h}:{timeStr.m}:{timeStr.s}
            </p>
            <div className="flex justify-end gap-3 text-[10px] text-muted-foreground">
              <span>Hr</span>
              <span>Min</span>
              <span>Seg</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm space-y-3">
          <p className="text-sm font-bold text-foreground">Confirmar correo para Wompi</p>
          <input
            type="email"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            placeholder="correo@dominio.com"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">
              El cobro se procesa de forma segura con Wompi (tarjeta o PSE). Serás redirigido a la pasarela oficial.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span>Encriptado 256-bit</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Pago seguro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-lg space-y-2">
          {onPayLater && (
            <button
              type="button"
              onClick={onPayLater}
              disabled={disabled}
              className="w-full rounded-full border-2 border-primary bg-card py-3 text-sm font-bold text-primary disabled:opacity-50"
            >
              Pagar más tarde
            </button>
          )}
          <Button
            className="w-full gap-2 rounded-full py-6 text-base font-semibold"
            disabled={!canPay}
            onClick={handlePay}
          >
            <Lock className="h-4 w-4" />
            Pagar {formatCurrency(totalToPay, currency)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRentalCheckoutView;
