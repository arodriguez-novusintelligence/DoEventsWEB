import { useEffect, useState } from 'react';
import { Calendar, Clock, Ticket as TicketIcon, Plus, Trash2, Copy, Check, ChevronDown } from 'lucide-react';
import {
  EventFormData,
  REFUND_POLICY_OPTIONS,
  RefundPolicy,
  PromoCodeBatch,
  PromoCurrency,
} from '@lovable/data/eventFormData';
import { generateUniquePromoCodes } from '@lovable/data/promoCodesData';
import { toast } from 'sonner';


interface Props {
  formData: EventFormData;
  updateForm: (partial: Partial<EventFormData> | ((prev: EventFormData) => Partial<EventFormData>)) => void;
  showErrors?: boolean;
}

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const StepRefundPolicy = ({ formData, updateForm, showErrors }: Props) => {
  const selected = formData.refundPolicy;

  // Auto-populate sales window: start = now (publish moment), end = event end
  useEffect(() => {
    const patch: Partial<EventFormData> = {};
    if (!formData.salesStartDate) patch.salesStartDate = todayISO();
    if (!formData.salesStartTime) patch.salesStartTime = nowHM();
    if (!formData.salesEndDate && formData.endDate) patch.salesEndDate = formData.endDate;
    if (!formData.salesEndTime && formData.endTime) patch.salesEndTime = formData.endTime;
    if (Object.keys(patch).length > 0) updateForm(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary">Reembolsos y fecha de venta</h2>
        <p className="mt-1 text-sm text-foreground">
          Define la política de reembolsos y la ventana de venta de boletería de tu evento.
        </p>
      </div>

      {/* Fecha y hora de venta de boletería */}
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <h3 className="text-base font-bold text-primary">Fecha y hora venta de boletería</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Por defecto la venta inicia al momento de publicar el evento y finaliza con el cierre del mismo. Puedes ajustarla a tu necesidad.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Fecha de inicio
            </label>
            <input
              type="date"
              value={formData.salesStartDate ?? ''}
              onChange={(e) => updateForm({ salesStartDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" /> Hora de inicio
            </label>
            <input
              type="time"
              value={formData.salesStartTime ?? ''}
              onChange={(e) => updateForm({ salesStartTime: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Fecha de finalización
            </label>
            <input
              type="date"
              value={formData.salesEndDate ?? ''}
              onChange={(e) => updateForm({ salesEndDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" /> Hora de finalización
            </label>
            <input
              type="time"
              value={formData.salesEndTime ?? ''}
              onChange={(e) => updateForm({ salesEndTime: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Política de reembolso */}
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <p className="mb-4 text-base font-bold text-foreground">
          ¿Cuándo pueden los asistentes solicitar reembolsos?
        </p>
        <div className="space-y-3">
          {REFUND_POLICY_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateForm({ refundPolicy: opt.value as RefundPolicy })}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className="text-sm text-foreground">{opt.label}</span>
              </button>
            );
          })}
        </div>
        {showErrors && !selected && (
          <p className="mt-3 text-xs font-semibold text-destructive">
            Selecciona una política de reembolso para continuar.
          </p>
        )}
      </div>

      <PromoCodesSection formData={formData} updateForm={updateForm} />
    </div>
  );
};

const PROMO_CURRENCIES: PromoCurrency[] = ['COP', 'USD', 'EUR', 'MXN', 'DOP'];

const fmtMoney = (n: number, c: PromoCurrency) => `${c} $ ${(n || 0).toLocaleString('es-CO')}`;

interface PromoSectionProps {
  formData: EventFormData;
  updateForm: Props['updateForm'];
}

const PromoCodesSection = ({ formData, updateForm }: PromoSectionProps) => {
  const batches = formData.promoCodes ?? [];
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
    if (!next) updateForm({ promoCodes: [] });
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
    const existing = new Set<string>(batches.flatMap((b) => b.codes));
    const codes = generateUniquePromoCodes(quantity, existing);
    const batch: PromoCodeBatch = {
      id: `promo-${Date.now()}`,
      currency: draft.currency,
      value,
      quantity,
      description: draft.description.trim(),
      codes,
    };
    updateForm({ promoCodes: [...batches, batch] });
    setDraft({ currency: 'COP', value: '', quantity: '10', description: '' });
    setOpenBatch(batch.id);
    toast.success(`${quantity} códigos generados`);
  };

  const removeBatch = (id: string) => {
    updateForm({ promoCodes: batches.filter((b) => b.id !== id) });
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
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => handleToggle(!enabled)}
          className="flex items-start gap-3 text-left"
        >
          <span
            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${
              enabled ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card'
            }`}
          >
            {enabled && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
          </span>
          <span>
            <span className="block text-base font-bold text-foreground">Código promocional</span>
            <span className="block text-xs text-muted-foreground">
              Genera códigos únicos con un valor de descuento que tus clientes podrán redimir al comprar.
            </span>
          </span>
        </button>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <TicketIcon className="h-5 w-5 text-primary" />
        </div>
      </div>

      {enabled && (
        <div className="mt-5 space-y-5">
          {/* Lotes ya creados */}
          {batches.map((b) => {
            const open = openBatch === b.id;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-background/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor por código</p>
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
                  <span>Ver códigos generados ({b.codes.length})</span>
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

          {/* Form para crear nuevo lote */}
          <div className="rounded-2xl border border-dashed border-primary/40 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Tipo de moneda</label>
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
                <label className="text-xs font-semibold text-muted-foreground">Valor</label>
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
                  placeholder="Ej. Promoción de lanzamiento para clientes VIP."
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addBatch}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Agregar código
            </button>
          </div>
        </div>
      )}
    </div>
  );
};



export default StepRefundPolicy;