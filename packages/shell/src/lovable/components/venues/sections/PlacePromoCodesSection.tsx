import { useState } from 'react';
import {
  Check, ChevronDown, Copy, Plus, TicketIcon, Trash2,
} from 'lucide-react';
import { toast } from '@lovable/components/ui/sonner';
import { generateUniquePromoCodes } from '@lovable/data/promoCodesData';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';
import type { PlacePromoCodeBatch } from '@lovable/data/placeData';

const PROMO_CURRENCIES = ['COP', 'USD', 'EUR', 'MXN', 'DOP'] as const;
type PromoCurrency = (typeof PROMO_CURRENCIES)[number];

function fmtMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('es-CO')}`;
  }
}

const PlacePromoCodesSection = () => {
  const { form, update } = usePlaceForm();
  const batches = form.promoCodes ?? [];
  const [enabled, setEnabled] = useState(batches.length > 0);
  const [draft, setDraft] = useState<{
    currency: PromoCurrency;
    value: string;
    quantity: string;
    description: string;
  }>({ currency: 'COP', value: '', quantity: '10', description: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openBatch, setOpenBatch] = useState<string | null>(null);

  const handleToggle = (next: boolean) => {
    setEnabled(next);
    if (!next) update({ promoCodes: [] });
  };

  const addBatch = () => {
    const value = parseInt(draft.value || '0', 10);
    const quantity = parseInt(draft.quantity || '0', 10);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Ingresa un valor válido para el código.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 500) {
      toast.error('La cantidad debe estar entre 1 y 500.');
      return;
    }
    if (!draft.description.trim()) {
      toast.error('Agrega una descripción para el lote.');
      return;
    }
    const existing = new Set<string>(batches.flatMap((b) => b.codes));
    const codes = generateUniquePromoCodes(quantity, existing, 'DOV');
    const batch: PlacePromoCodeBatch = {
      id: `venue-promo-${Date.now()}`,
      currency: draft.currency,
      value,
      quantity,
      description: draft.description.trim(),
      codes,
    };
    update({ promoCodes: [...batches, batch] });
    setDraft({ currency: 'COP', value: '', quantity: '10', description: '' });
    setOpenBatch(batch.id);
    toast.success(`${quantity} códigos generados para alquiler`);
  };

  const removeBatch = (id: string) => {
    update({ promoCodes: batches.filter((b) => b.id !== id) });
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <div className="min-w-0 p-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => handleToggle(!enabled)}
            className="flex items-start gap-3 text-left"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                enabled ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card'
              }`}
            >
              {enabled && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
            </span>
            <span>
              <span className="block text-base font-bold text-foreground">Códigos promocionales de alquiler</span>
              <span className="block text-xs text-muted-foreground">
                Genera códigos con descuento para que tus clientes los rediman al reservar el lugar.
              </span>
            </span>
          </button>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <TicketIcon className="h-5 w-5 text-primary" />
          </div>
        </div>

      {enabled && (
        <div className="mt-5 space-y-5">
          {batches.map((b) => {
            const open = openBatch === b.id;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-background/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Descuento por código</p>
                    <p className="text-base font-bold text-foreground">{fmtMoney(b.value, b.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cantidad</p>
                    <p className="text-base font-bold text-foreground">{b.quantity}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBatch(b.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Quitar
                  </button>
                </div>
                {b.description && (
                  <p className="mt-2 text-xs text-muted-foreground">{b.description}</p>
                )}
                <button
                  type="button"
                  onClick={() => setOpenBatch(open ? null : b.id)}
                  className="mt-3 flex w-full items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-xs font-semibold text-primary"
                >
                  <span>Ver códigos ({b.codes.length})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => copy(b.codes.join('\n'), `${b.id}-all`)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary"
                    >
                      {copiedId === `${b.id}-all` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      Copiar todos
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      {b.codes.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => copy(code, code)}
                          className="flex items-center justify-between rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-mono font-semibold text-foreground">{code}</span>
                          {copiedId === code ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-2xl border border-dashed border-primary/40 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Moneda</label>
                <select
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value as PromoCurrency })}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {PROMO_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Valor del descuento</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.value}
                  onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                  placeholder="$ 0"
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Cantidad de códigos</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  value={draft.quantity}
                  onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Descripción</label>
                <textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Ej. Descuento de lanzamiento para alquileres de fin de semana."
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addBatch}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Agregar lote de códigos
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PlacePromoCodesSection;
