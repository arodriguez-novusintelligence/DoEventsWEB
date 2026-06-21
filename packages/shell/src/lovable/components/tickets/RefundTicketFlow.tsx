import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  Mail,
  Info,
  X,
  CircleDollarSign,
  FileText,
  MessageCircle,
  Bell,
  Loader2,
} from 'lucide-react';
import type { Ticket } from '@lovable/data/ticketsData';
import { toast } from 'sonner';
import type { BoletaEntry } from './TransferTicketFlow';

interface Props {
  ticket: Ticket;
  entries: BoletaEntry[];
  orderCode: string;
  onClose: () => void;
  onCompleted: (refundedIds: string[]) => Promise<void>;
  eligible?: boolean;
  eligibilityMessage?: string;
  platformFeeRate?: number;
}

type Step = 'select' | 'confirm' | 'policy' | 'success';

const PLATFORM_FEE_RATE = 0.10;

const REFUND_STEPS: Step[] = ['select', 'confirm', 'policy', 'success'];

const RefundStepProgress = ({ current }: { current: Step }) => {
  const idx = REFUND_STEPS.indexOf(current);
  if (idx < 0 || current === 'success') return null;
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 pt-3">
      {REFUND_STEPS.slice(0, -1).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 max-w-14 rounded-full transition-colors ${i <= idx ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </div>
  );
};

const formatCOP = (n: number) =>
  `$ ${n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const RefundTicketFlow = ({
  ticket,
  entries,
  orderCode,
  onClose,
  onCompleted,
  eligible = true,
  eligibilityMessage,
  platformFeeRate = PLATFORM_FEE_RATE,
}: Props) => {
  const [step, setStep] = useState<Step>(eligible ? 'select' : 'confirm');
  const [selected, setSelected] = useState<Set<string>>(new Set(entries[0]?.id ? [entries[0].id] : []));
  const [submitting, setSubmitting] = useState(false);

  const selectedEntries = useMemo(() => entries.filter((e) => selected.has(e.id)), [entries, selected]);
  const grossTotal = selectedEntries.reduce((s, e) => s + e.value, 0);
  const platformFee = Math.round(grossTotal * platformFeeRate);
  const refundTotal = grossTotal - platformFee;
  const avgValue = selectedEntries.length ? Math.round(grossTotal / selectedEntries.length) : 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === entries.length) setSelected(new Set());
    else setSelected(new Set(entries.map((e) => e.id)));
  };

  const confirmRefund = async () => {
    if (submitting || !selected.size) return;
    setSubmitting(true);
    try {
      await onCompleted(Array.from(selected));
      setStep('success');
      toast.success('Solicitud de reembolso enviada', {
        description: 'Te notificaremos el resultado por correo.',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo solicitar el reembolso');
    } finally {
      setSubmitting(false);
    }
  };

  if (!eligible) {
    return (
      <div className="fixed inset-0 z-50 bg-secondary overflow-y-auto">
        <div className="min-h-screen px-4 pt-4 pb-8">
          <button type="button" onClick={onClose} className="flex items-center gap-1 text-primary font-medium">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          <div className="mt-8 rounded-2xl bg-destructive/10 border border-destructive/30 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2 justify-center">
              <span className="font-extrabold text-foreground">Reembolso no disponible</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {eligibilityMessage || 'Este evento no permite reembolsos con la política configurada.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-secondary overflow-y-auto">
      <RefundStepProgress current={step} />
      {step === 'select' && (
        <div className="min-h-screen flex flex-col pb-44">
          <div className="px-4 pt-4">
            <button type="button" onClick={onClose} className="flex items-center gap-1 text-primary font-medium">
              <ChevronLeft className="h-5 w-5" /> Atrás
            </button>
            <h1 className="mt-3 text-3xl font-extrabold text-primary leading-tight">{ticket.eventTitle}</h1>
          </div>

          <div className="px-4 pt-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Orden de compra</p>
            <div className="rounded-2xl bg-primary px-4 py-3 text-center">
              <p className="text-sm font-bold text-primary-foreground">{orderCode}</p>
            </div>
          </div>

          <div className="px-4 pt-4">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex gap-2">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-snug">
                Los reembolsos se procesarán de 3 a 5 días hábiles. Se aplican términos y condiciones.
              </p>
            </div>
          </div>

          <div className="px-4 pt-5">
            <div className="rounded-2xl border border-border/60 bg-card py-3 text-center shadow-sm">
              <p className="text-lg font-extrabold text-primary">
                {selected.size} de {entries.length}
              </p>
            </div>
          </div>

          <div className="px-4 pt-4">
            <button type="button" onClick={toggleAll} className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded border-2 grid place-items-center ${
                selected.size === entries.length ? 'bg-primary border-primary' : 'border-primary'
              }`}>
                {selected.size === entries.length && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>
              <span className="font-bold text-foreground">Seleccionar todas las boletas</span>
            </button>
            <p className="text-sm text-primary mt-3">
              {selected.size} de {entries.length} boletas seleccionadas
            </p>
          </div>

          <div className="px-4 pt-3 space-y-4">
            {entries.map((e) => {
              const isSel = selected.has(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={`w-full text-left rounded-3xl bg-card overflow-hidden border-2 transition-all ${
                    isSel ? 'border-primary shadow-md' : 'border-transparent shadow-sm'
                  }`}
                >
                  <div className="relative h-40">
                    {ticket.eventImage ? (
                      <img src={ticket.eventImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                    <div className={`absolute top-3 right-3 h-8 w-8 rounded-full grid place-items-center ${
                      isSel ? 'bg-primary' : 'bg-card/80 border border-border/60'
                    }`}>
                      {isSel && <Check className="h-5 w-5 text-primary-foreground" />}
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Categoría</p>
                      <span className="inline-block mt-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary uppercase">
                        {ticket.category}
                      </span>
                      <p className="mt-2 text-sm font-extrabold text-foreground">Silla - {e.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Puerta de ingreso</p>
                      <p className="mt-1 text-sm font-extrabold text-foreground">{ticket.entrance || 'Entrada principal'}</p>
                      {e.value > 0 && (
                        <p className="mt-2 text-sm font-bold text-primary">{formatCOP(e.value)}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/60 px-4 py-4">
            <div className="mx-auto max-w-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-bold text-foreground">Monto a reembolsar</span>
                <span className="text-2xl font-extrabold text-primary">{formatCOP(refundTotal)}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 rounded-full border-2 border-primary py-3 text-sm font-bold text-primary">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={() => setStep('confirm')}
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="min-h-screen pb-8">
          <div className="px-4 pt-4">
            <button type="button" onClick={() => setStep('select')} className="text-primary">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 pt-2 flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <CircleDollarSign className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-foreground">Confirmar reembolso</h1>
            <p className="text-sm text-muted-foreground mt-1">Revisa los detalles antes de proceder</p>
          </div>

          <div className="px-4 pt-6 space-y-5">
            <div className="rounded-2xl bg-primary/10 p-4">
              <p className="text-xs uppercase font-bold text-muted-foreground">Evento</p>
              <p className="mt-1 font-extrabold text-foreground">{ticket.eventTitle}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{ticket.eventDate}</span>
                {ticket.startTime && (
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{ticket.startTime}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground">Orden de compra: {orderCode}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Boletas a reembolsar</p>
              <div className="space-y-2">
                {selectedEntries.map((e, idx) => (
                  <div key={e.id} className="rounded-2xl border border-border/60 p-3 flex items-center gap-3 shadow-sm">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-foreground uppercase">{ticket.category}</p>
                      <p className="text-xs text-muted-foreground">Silla {e.code}</p>
                    </div>
                    {e.value > 0 && <p className="font-bold text-foreground">{formatCOP(e.value)}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <span className="font-extrabold text-foreground">Comisiones no reembolsables</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Las comisiones de la plataforma <span className="font-bold">no son reembolsables</span>.
              </p>
              <button type="button" onClick={() => setStep('policy')} className="text-sm font-bold text-primary underline underline-offset-2">
                Ver política de recaudos y reembolsos
              </button>
            </div>

            {grossTotal > 0 && (
              <div className="rounded-2xl bg-secondary/60 border border-border/60 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal boletas</span>
                  <span className="font-semibold text-foreground">{formatCOP(grossTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comisión plataforma (no reembolsable)</span>
                  <span className="font-semibold text-foreground">- {formatCOP(platformFee)}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex justify-between">
                  <span className="font-bold text-foreground">Monto a reembolsar</span>
                  <span className="text-xl font-extrabold text-primary">{formatCOP(refundTotal)}</span>
                </div>
              </div>
            )}

            {eligibilityMessage && (
              <p className="text-xs text-muted-foreground">{eligibilityMessage}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-full border-2 border-primary py-3 text-sm font-bold text-primary">
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void confirmRefund()}
                className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Radicando…</span>
                ) : 'Confirmar reembolso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'policy' && (
        <div className="min-h-screen pb-8">
          <div className="px-4 pt-4 flex items-center justify-between">
            <button type="button" onClick={() => setStep('confirm')} className="flex items-center gap-1 text-primary font-medium">
              <ChevronLeft className="h-5 w-5" /> Volver
            </button>
            <button type="button" onClick={() => setStep('confirm')} className="h-9 w-9 rounded-full bg-card border border-border/60 grid place-items-center">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pt-4 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-foreground">Política de recaudos y reembolsos</h1>
          </div>

          <div className="px-4 pt-6 space-y-4 text-sm text-foreground/90 leading-relaxed">
            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="font-extrabold text-foreground mb-2">Comisiones de la plataforma</h2>
              <p>Las comisiones cobradas por la plataforma <span className="font-bold">no son reembolsables</span>.</p>
            </section>
            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="font-extrabold text-foreground mb-2">Tiempos de procesamiento</h2>
              <p>Los reembolsos aprobados se procesan en <span className="font-bold">3 a 5 días hábiles</span>.</p>
            </section>
            <button type="button" onClick={() => setStep('confirm')} className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow">
              Entendido
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="min-h-screen pb-28">
          <div className="px-4 pt-12 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Check className="h-7 w-7 text-primary" strokeWidth={3} />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold text-foreground">Reembolso solicitado</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xs">
              Tu solicitud ha sido radicada correctamente
            </p>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-secondary px-4 py-4">
            <div className="mx-auto max-w-lg">
              <button type="button" onClick={onClose} className="w-full rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow">
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundTicketFlow;
