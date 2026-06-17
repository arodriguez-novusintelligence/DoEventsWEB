import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';

export interface WompiMockPaymentViewProps {
  orderId: string;
  totalAmount: number;
  remainingMs?: number | null;
  disabled?: boolean;
  onConfirmPayment: () => Promise<void>;
  onAbort?: () => void;
  onPayLater?: () => void;
  onOpenMenu?: () => void;
  defaultBuyer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

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

export const WompiMockPaymentView: React.FC<WompiMockPaymentViewProps> = ({
  orderId,
  totalAmount,
  remainingMs,
  disabled = false,
  onConfirmPayment,
  onAbort,
  onPayLater,
  onOpenMenu,
  defaultBuyer,
}) => {
  const [processing, setProcessing] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [acceptedData, setAcceptedData] = useState(true);

  useEffect(() => {
    if (defaultBuyer?.name && !buyerName) setBuyerName(defaultBuyer.name);
    if (defaultBuyer?.email && !buyerEmail) setBuyerEmail(defaultBuyer.email);
    if (defaultBuyer?.phone && !buyerPhone) {
      setBuyerPhone(defaultBuyer.phone.replace(/\D/g, '').slice(-10));
    }
  }, [defaultBuyer?.name, defaultBuyer?.email, defaultBuyer?.phone, buyerName, buyerEmail, buyerPhone]);

  const handlePayWithWompi = () => {
    if (disabled || processing || !buyerValid) return;
    setProcessing(true);
    void onConfirmPayment()
      .catch(() => undefined)
      .finally(() => setProcessing(false));
  };

  const timeStr = useMemo(() => formatWompiTimer(remainingMs), [remainingMs]);
  const buyerValid = buyerName.trim().length > 2
    && /.+@.+\..+/.test(buyerEmail)
    && buyerPhone.length >= 7
    && acceptedTerms
    && acceptedData;

  if (processing) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center bg-background px-6 py-12">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <p className="mt-5 text-base font-bold text-foreground">Redirigiendo a Wompi…</p>
        <p className="text-sm text-muted-foreground">No cierres esta pantalla</p>
        <div className="mt-6 w-full space-y-1 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total a pagar</span>
            <span className="font-bold text-foreground">{fmt(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Referencia</span>
            <span className="font-medium">{orderId.slice(-8).toUpperCase()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg bg-[#EEF0FB] pb-36">
      {onOpenMenu && (
        <div className="hidden lg:flex px-4 pt-4">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
          >
            ☰ Menú
          </button>
        </div>
      )}
      <div className="px-4 pt-4">
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
            timeStr.low ? 'border-2 border-rose-400 bg-rose-100' : 'border-2 border-primary bg-card'
          }`}
        >
          <span className={`text-sm font-bold ${timeStr.low ? 'text-rose-600' : 'text-primary'}`}>
            Tiempo restante
          </span>
          <div className="text-right">
            <p className={`text-xl font-extrabold tabular-nums ${timeStr.low ? 'text-rose-600' : 'text-foreground'}`}>
              {timeStr.h}:{timeStr.m}:{timeStr.s}
            </p>
            <div className="flex justify-end gap-3 text-[10px] text-muted-foreground">
              <span>Hr</span><span>Min</span><span>Seg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between bg-[#6366E5] px-5 py-4 text-white">
        <div>
          <p className="text-[11px] opacity-80">{orderId}</p>
          <p className="text-sm font-medium">Total a pagar</p>
        </div>
        <p className="text-xl font-extrabold">COP {fmt(totalAmount).replace('$', '$ ')}</p>
      </div>

      <div className="bg-emerald-50/40 px-5 py-6 text-center">
        <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground font-extrabold text-background">
          W
        </span>
        <p className="text-sm text-muted-foreground">Pago a</p>
        <p className="text-xl font-extrabold text-foreground">Do.Events Software SAS</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Serás redirigido a la pasarela segura de Wompi para completar tu pago.
        </p>
      </div>

      <div className="mt-5 px-4">
        <p className="mb-2 text-sm font-bold">Método de pago</p>
        <div className="flex items-center justify-between rounded-2xl border-2 border-primary/40 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
              <CreditCard className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Tarjeta, PSE y más vía Wompi</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <span className="rounded border bg-white px-1.5 py-0.5 text-blue-700">VISA</span>
            <span className="rounded border bg-white px-1.5 py-0.5 text-red-600">MC</span>
            <span className="rounded bg-blue-700 px-1.5 py-0.5 text-white">AMEX</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4 px-4">
        <p className="font-bold">Datos del comprador</p>
        <div>
          <label className="text-xs">Nombres y Apellidos</label>
          <Input className="mt-1" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs">Correo electrónico</label>
          <Input className="mt-1" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-xs">Número de celular</label>
          <div className="mt-1 grid grid-cols-[80px_1fr] gap-2">
            <div className="flex items-center justify-between rounded-md border border-border bg-background px-2 text-sm">+57 ▾</div>
            <Input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              inputMode="numeric"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 h-4 w-4 accent-emerald-500"
          />
          <span>
            Acepto haber leído <span className="font-semibold underline">el reglamento</span>.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={acceptedData}
            onChange={(e) => setAcceptedData(e.target.checked)}
            className="mt-1 h-4 w-4 accent-emerald-500"
          />
          <span>
            Acepto la <span className="font-semibold underline">autorización para la administración de datos personales</span>
            {' '}y conozco la <span className="font-semibold underline">política para el tratamiento de datos personales</span>.
          </span>
        </label>

        <Button
          disabled={!buyerValid || disabled}
          className="w-full gap-2 rounded-full bg-foreground py-6 text-base font-semibold text-background hover:bg-foreground/90"
          onClick={handlePayWithWompi}
        >
          <ShieldCheck className="h-4 w-4 text-yellow-300" />
          <span className="text-yellow-300">Pagar con Wompi</span>
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          PAGOS SEGUROS POR <span className="font-extrabold text-foreground">W Wompi</span>
        </div>
      </div>

      {onAbort && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#6366E5]/30 bg-[#EEF0FB] px-4 py-3">
          {onPayLater && (
            <button
              type="button"
              onClick={onPayLater}
              disabled={disabled}
              className="mb-2 w-full rounded-full border-2 border-primary bg-card py-3 text-sm font-bold text-primary disabled:opacity-50"
            >
              Pagar más tarde
            </button>
          )}
          <div className="rounded-full bg-[#6366E5] px-4 py-3 text-center text-white">
            <button type="button" onClick={onAbort} className="w-full text-sm font-semibold">
              No deseo continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WompiMockPaymentView;
