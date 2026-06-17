import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { PLATFORM_FEE_LABEL, PLATFORM_PRICING } from '@doevents/shared';

interface CheckoutFeeBreakdownProps {
  subtotal: number;
  serviceFee: number;
  total: number;
  ticketCount: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export const CheckoutFeeBreakdown: React.FC<CheckoutFeeBreakdownProps> = ({
  subtotal,
  serviceFee,
  total,
  ticketCount,
}) => {
  const [feeInfo, setFeeInfo] = useState<'with' | 'without' | null>(null);

  return (
    <>
      <div className="rounded-2xl bg-card p-4 shadow-sm space-y-2">
        <div className="flex justify-between text-sm border-b border-dashed border-border pb-2">
          <span>Boletas</span>
          <span>{ticketCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            onClick={() => setFeeInfo('with')}
            className="flex items-center gap-1 text-left"
          >
            Cargo por servicio <Info className="h-4 w-4 text-primary" />
          </button>
          <span>{fmt(serviceFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <button
            type="button"
            onClick={() => setFeeInfo('without')}
            className="flex items-center gap-1 text-left"
          >
            Sub total <Info className="h-4 w-4 text-primary" />
          </button>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t border-dashed border-border pt-2">
          <span>Total</span>
          <span className="text-primary text-xl">{fmt(total)}</span>
        </div>
      </div>

      {feeInfo && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-6"
          onClick={() => setFeeInfo(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary">
              <Info className="h-8 w-8 text-primary" />
            </div>
            {feeInfo === 'with' ? (
              <>
                <p className="text-lg font-bold text-primary">Boletas más comisión</p>
                <p className="mt-2 text-sm text-foreground">Cargo por servicio por boleto comprado:</p>
                <p className="mt-2 text-base font-bold text-primary">{PLATFORM_FEE_LABEL}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {PLATFORM_PRICING.ivaNote}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-primary">Boletas sin comisión</p>
                <p className="mt-2 text-sm text-foreground">
                  Valor de las boletas antes del cargo por servicio de la plataforma.
                </p>
              </>
            )}
            <Button
              variant="outline"
              className="mt-5 w-full rounded-full border-2 border-primary text-primary font-semibold"
              onClick={() => setFeeInfo(null)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CheckoutFeeBreakdown;
