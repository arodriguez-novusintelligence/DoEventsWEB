import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@lovable/components/ui/switch';
import {
  SEATING_CURRENCIES,
  type EventGate,
  type TicketCategory,
} from '@lovable/data/eventFormData';

interface TicketCategoriesSectionProps {
  categories: TicketCategory[];
  gates?: EventGate[];
  totalCapacity: number;
  showErrors: boolean;
  onChange: (next: TicketCategory[]) => void;
}

const TicketCategoriesSection = ({
  categories,
  gates = [],
  totalCapacity,
  showErrors,
  onChange,
}: TicketCategoriesSectionProps) => {
  const [draft, setDraft] = useState<TicketCategory>({
    id: '',
    name: '',
    quantity: 0,
    hasPrice: false,
    price: 0,
    currency: 'COP',
    description: '',
  });

  const usedSeats = categories.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const cap = Math.max(0, totalCapacity);
  const within = cap === 0 || usedSeats <= cap;
  const usedPct = cap > 0 ? Math.min(100, Math.round((usedSeats / cap) * 100)) : 0;
  const remaining = Math.max(0, cap - usedSeats);

  const updateCategory = (id: string, patch: Partial<TicketCategory>) =>
    onChange(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCategory = (id: string) =>
    onChange(categories.filter((c) => c.id !== id));

  const addCategory = () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error('Ingresa un nombre para la categoría.');
      return;
    }
    if (!draft.quantity || draft.quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0.');
      return;
    }
    if (draft.hasPrice && draft.price <= 0) {
      toast.error('El precio debe ser mayor a 0 si la categoría tiene costo.');
      return;
    }
    if (cap > 0 && usedSeats + draft.quantity > cap) {
      toast.error('La suma de boletas supera el aforo del evento.');
      return;
    }
    const defaultGateId = gates[0]?.id;
    onChange([
      ...categories,
      {
        ...draft,
        id: `tc-${Date.now()}`,
        name,
        gateId: draft.gateId || defaultGateId,
      },
    ]);
    setDraft({
      id: '',
      name: '',
      quantity: 0,
      hasPrice: false,
      price: 0,
      currency: 'COP',
      description: '',
    });
    toast.success('Categoría agregada.');
  };

  const empty = categories.length === 0;

  return (
    <div className="space-y-3">
      <h3 className="px-1 text-lg font-bold text-foreground">
        Categorías de boletería
      </h3>

      <div
        className={`rounded-2xl border-l-4 p-4 ${
          within
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-destructive bg-destructive/10'
        }`}
      >
        <p
          className={`mb-1 text-sm font-bold ${
            within ? 'text-emerald-700' : 'text-destructive'
          }`}
        >
          {within ? '✓ Dentro del aforo del evento' : '⚠ Excede el aforo del evento'}
        </p>
        <p className="mb-1 text-xs text-muted-foreground">Boletas utilizadas</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={within ? 'h-full bg-emerald-500' : 'h-full bg-destructive'}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-foreground">
            {usedSeats} de {cap} boletas
          </span>
          <span
            className={
              within ? 'font-bold text-emerald-700' : 'font-bold text-destructive'
            }
          >
            {usedPct}%
          </span>
        </div>
        <p
          className={`mt-1 text-xs font-semibold ${
            within ? 'text-emerald-700' : 'text-destructive'
          }`}
        >
          {remaining} boletas disponibles
        </p>
      </div>

      {categories.map((c) => (
        <div
          key={c.id}
          className="space-y-3 rounded-2xl bg-card p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {c.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.quantity} boletas ·{' '}
                {c.hasPrice ? `${c.currency} ${c.price.toLocaleString()}` : 'Gratis'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeCategory(c.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive"
              aria-label="Eliminar categoría"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {c.description && (
            <p className="text-xs text-muted-foreground">{c.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Cantidad
              </span>
              <input
                type="number"
                min={1}
                value={c.quantity || ''}
                onChange={(e) =>
                  updateCategory(c.id, { quantity: Number(e.target.value) || 0 })
                }
                className="border-b border-input bg-transparent pb-1 text-sm outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Precio
              </span>
              <input
                type="number"
                min={0}
                disabled={!c.hasPrice}
                value={c.hasPrice ? c.price || '' : ''}
                onChange={(e) =>
                  updateCategory(c.id, { price: Number(e.target.value) || 0 })
                }
                className="border-b border-input bg-transparent pb-1 text-sm outline-none disabled:opacity-50"
              />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">¿Tiene precio?</span>
            <Switch
              checked={c.hasPrice}
              onCheckedChange={(v) =>
                updateCategory(c.id, { hasPrice: v, price: v ? c.price : 0 })
              }
            />
          </div>
          {gates.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Puerta de ingreso <span className="text-destructive">*</span>
              </span>
              <select
                value={c.gateId ?? ''}
                onChange={(e) =>
                  updateCategory(c.id, { gateId: e.target.value || undefined })
                }
                className={`border-b bg-transparent pb-1 text-sm outline-none ${
                  showErrors && !c.gateId ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">Selecciona una puerta</option>
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.number}. {g.name}
                  </option>
                ))}
              </select>
              {showErrors && !c.gateId && (
                <span className="text-[11px] font-medium text-destructive">
                  Selecciona la puerta de ingreso.
                </span>
              )}
            </label>
          )}
        </div>
      ))}

      <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
        <label className="block">
          <span className="block text-sm font-bold text-foreground">Categoría</span>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nombre de la categoría"
            className="mt-1 w-full border-b border-input bg-transparent pb-1 text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-sm font-bold text-foreground">Cantidad</span>
            <input
              type="number"
              min={0}
              value={draft.quantity || ''}
              onChange={(e) =>
                setDraft({ ...draft, quantity: Number(e.target.value) || 0 })
              }
              placeholder="0"
              className="mt-1 w-full border-b border-input bg-transparent pb-1 text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </label>
          <label className="block">
            <span className="block text-sm font-bold text-foreground">
              Precio (valor)
            </span>
            <input
              type="number"
              min={0}
              disabled={!draft.hasPrice}
              value={draft.hasPrice ? draft.price || '' : ''}
              onChange={(e) =>
                setDraft({ ...draft, price: Number(e.target.value) || 0 })
              }
              placeholder="0"
              className="mt-1 w-full border-b border-input bg-transparent pb-1 text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="block text-sm font-bold text-foreground">¿Tiene precio?</span>
            <span className="text-xs text-muted-foreground">
              Desactívalo para crear boletería gratuita (sin costo).
            </span>
          </div>
          <Switch
            checked={draft.hasPrice}
            onCheckedChange={(v) =>
              setDraft({ ...draft, hasPrice: v, price: v ? draft.price : 0 })
            }
          />
        </div>

        <label className="block">
          <span className="block text-sm font-bold text-foreground">Moneda</span>
          <select
            value={draft.currency}
            disabled={!draft.hasPrice}
            onChange={(e) =>
              setDraft({ ...draft, currency: e.target.value as TicketCategory['currency'] })
            }
            className="mt-1 w-full border-b border-input bg-transparent pb-1 text-sm outline-none disabled:opacity-50"
          >
            {SEATING_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {gates.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Puerta de ingreso <span className="text-destructive">*</span>
            </span>
            <select
              value={draft.gateId ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, gateId: e.target.value || undefined })
              }
              className={`border-b bg-transparent pb-1 text-sm outline-none ${
                showErrors && !draft.gateId ? 'border-destructive' : 'border-input'
              }`}
            >
              <option value="">Selecciona una puerta</option>
              {gates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.number}. {g.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="block text-sm font-bold text-foreground">
            Descripción <span className="font-normal text-muted-foreground">(opcional)</span>
          </span>
          <input
            value={draft.description ?? ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Descripción"
            className="mt-1 w-full border-b border-input bg-transparent pb-1 text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </label>

        <button
          type="button"
          onClick={addCategory}
          className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <Plus className="h-4 w-4" /> Agregar categoría
        </button>
      </div>

      {showErrors && empty && (
        <p className="px-1 text-xs font-medium text-destructive">
          Agrega al menos una categoría de boletería.
        </p>
      )}

      <p className="px-1 text-[11px] text-muted-foreground">
        Las boletas QR generadas para este evento no incluirán numeración de sillas
        (admisión general).
      </p>
    </div>
  );
};

export default TicketCategoriesSection;
