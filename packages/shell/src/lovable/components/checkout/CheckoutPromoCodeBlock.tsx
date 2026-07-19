import React from 'react';
import { Check as CheckIcon, Tag as TagIcon } from 'lucide-react';
import { Checkbox } from '@lovable/components/ui/checkbox';

export interface CheckoutPromoApplied {
  code: string;
  value: number;
}

interface CheckoutPromoCodeBlockProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  code: string;
  onCodeChange: (code: string) => void;
  applied: CheckoutPromoApplied | null;
  error?: string | null;
  applying?: boolean;
  onApply: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const CheckoutPromoCodeBlock: React.FC<CheckoutPromoCodeBlockProps> = ({
  enabled,
  onEnabledChange,
  code,
  onCodeChange,
  applied,
  error,
  applying = false,
  onApply,
  onRemove,
  disabled = false,
}) => (
  <div className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
    <label className="flex cursor-pointer items-center gap-3">
      <Checkbox
        checked={enabled}
        disabled={disabled}
        onCheckedChange={(value) => onEnabledChange(Boolean(value))}
        className="h-5 w-5"
      />
      <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
        <TagIcon className="h-4 w-4 text-primary" />
        Tengo un código promocional
      </span>
    </label>

    {enabled && (
      <div className="mt-3">
        {applied ? (
          <div className="flex items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">Código aplicado</p>
                <p className="font-mono text-sm font-bold text-emerald-700">{applied.code}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={onRemove}
              className="text-xs font-bold text-rose-600 disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                value={code}
                disabled={disabled || applying}
                onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onApply();
                  }
                }}
                placeholder="Ej. DOE-AB12CD"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm uppercase outline-none focus:border-primary disabled:opacity-50"
              />
              <button
                type="button"
                disabled={disabled || applying || !code.trim()}
                onClick={onApply}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {applying ? 'Validando…' : 'Aplicar'}
              </button>
            </div>
            {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
            <p className="mt-1 text-[11px] text-muted-foreground">
              El descuento se aplica al total de la compra.
            </p>
          </>
        )}
      </div>
    )}
  </div>
);

export default CheckoutPromoCodeBlock;
