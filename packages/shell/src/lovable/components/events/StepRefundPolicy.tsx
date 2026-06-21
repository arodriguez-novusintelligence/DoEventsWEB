import { useEffect } from 'react';
import { Calendar, Clock, ShieldCheck } from 'lucide-react';
import { EventFormData, REFUND_POLICY_OPTIONS, RefundPolicy } from '@lovable/data/eventFormData';

interface Props {
  formData: EventFormData;
  updateForm: (partial: Partial<EventFormData>) => void;
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
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Reembolsos y fecha de venta</h2>
          <p className="mt-1 text-sm text-foreground">
            Define la política de reembolsos y la ventana de venta de boletería de tu evento.
          </p>
        </div>
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
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="text-base font-bold text-foreground">
            ¿Cuándo pueden los asistentes solicitar reembolsos?
          </p>
        </div>
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
    </div>
  );
};

export default StepRefundPolicy;
