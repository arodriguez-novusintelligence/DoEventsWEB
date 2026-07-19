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
  Megaphone,
  User,
  Building2,
} from 'lucide-react';
import { computeRefundBreakdown, PLATFORM_FEE_LABEL } from '@doevents/shared';
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
}

type Step = 'select' | 'confirm' | 'policy' | 'success';

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
}: Props) => {
  const refundableEntries = useMemo(
    () => entries.filter((e) => !e.isTransferredOut && !e.isRefunded),
    [entries],
  );
  const [step, setStep] = useState<Step>(eligible ? 'select' : 'confirm');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(refundableEntries[0]?.id ? [refundableEntries[0].id] : []),
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedEntries = useMemo(
    () => refundableEntries.filter((e) => selected.has(e.id)),
    [refundableEntries, selected],
  );

  const breakdown = useMemo(
    () => computeRefundBreakdown(
      selectedEntries.map((e) => e.value),
      selectedEntries.map((e) => e.platformFee ?? computeRefundBreakdown([e.value]).platformFee),
    ),
    [selectedEntries],
  );

  const { subtotal: grossTotal, platformFee, refundTotal, avgValue } = breakdown;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selected.size === refundableEntries.length) setSelected(new Set());
    else setSelected(new Set(refundableEntries.map((e) => e.id)));
  };

  const confirmRefund = async () => {
    if (submitting || !selected.size) return;
    setSubmitting(true);
    try {
      await onCompleted(Array.from(selected));
      setStep('success');
      toast.success('Reembolso procesado exitosamente', {
        description: 'Notificamos vía Mail, WhatsApp, Campana y Push al solicitante y al organizador.',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo solicitar el reembolso');
    } finally {
      setSubmitting(false);
    }
  };

  if (!eligible) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center bg-background">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-secondary shadow-sm">
        <div className="min-h-screen px-4 pt-4 pb-8">
          <button type="button" onClick={onClose} className="flex items-center gap-1 text-primary font-extrabold">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 shadow-sm">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2 justify-center">
              <span className="font-extrabold text-foreground">Reembolso no disponible</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed text-center">
              {eligibilityMessage || 'Este evento no permite reembolsos con la política configurada.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
      </div>
    );
  }

  if (!refundableEntries.length) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center bg-background">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-secondary shadow-sm">
        <div className="min-h-screen px-4 pt-4 pb-8">
          <button type="button" onClick={onClose} className="flex items-center gap-1 text-primary font-extrabold">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
            <p className="font-extrabold text-foreground">No hay boletas disponibles para reembolso</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Las boletas de esta orden ya fueron transferidas o reembolsadas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-background">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-secondary shadow-sm">
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
            <div className="rounded-2xl bg-amber-50 border border-amber-300 p-3 flex gap-2">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-snug">
                Los reembolsos se procesarán de 3 a 5 días hábiles. Las comisiones de la plataforma ({PLATFORM_FEE_LABEL}) no son reembolsables.
              </p>
            </div>
          </div>

          <div className="px-4 pt-5">
            <div className="rounded-2xl bg-card py-3 text-center shadow-sm">
              <p className="text-lg font-extrabold text-primary">
                {selected.size} de {refundableEntries.length}
              </p>
            </div>
          </div>

          <div className="px-4 pt-4">
            <button type="button" onClick={toggleAll} className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded border-2 grid place-items-center ${
                selected.size === refundableEntries.length ? 'bg-primary border-primary' : 'border-primary'
              }`}>
                {selected.size === refundableEntries.length && <Check className="h-4 w-4 text-primary-foreground" />}
              </div>
              <span className="font-bold text-foreground">Seleccionar todas las boletas</span>
            </button>
            <p className="text-sm text-primary mt-3">
              {selected.size} de {refundableEntries.length} boletas seleccionadas
            </p>
          </div>

          <div className="px-4 pt-3 space-y-4">
            {refundableEntries.map((e) => {
              const isSel = selected.has(e.id);
              const category = e.category || ticket.category;
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
                      isSel ? 'bg-primary' : 'bg-card/80 border border-border'
                    }`}>
                      {isSel && <Check className="h-5 w-5 text-primary-foreground" />}
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Categoría</p>
                      <span className="inline-block mt-1 rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold text-orange-800 uppercase">
                        {category}
                      </span>
                      <p className="mt-2 text-sm font-extrabold text-foreground">Silla - {e.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Puerta de ingreso</p>
                      <p className="mt-1 text-sm font-extrabold text-foreground">{ticket.entrance || 'Entrada General'}</p>
                      {e.value > 0 && (
                        <p className="mt-2 text-sm font-bold text-primary">{formatCOP(e.value)}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4">
            <div className="mx-auto max-w-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-bold text-foreground">Monto a reembolsar</span>
                <span className="text-2xl font-extrabold text-primary">{formatCOP(refundTotal)}</span>
              </div>
              {platformFee > 0 && selected.size > 0 && (
                <p className="mb-3 text-xs text-muted-foreground text-right">
                  Comisión no reembolsable: {formatCOP(platformFee)}
                </p>
              )}
              {selected.size === 0 && <div className="mb-3" />}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border-2 border-primary py-3 text-sm font-bold text-primary"
                >
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
            <div className="h-20 w-20 rounded-full bg-primary/15 grid place-items-center">
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
              <p className="text-sm font-semibold text-muted-foreground mb-2">Resumen de reembolso</p>
              <div className="rounded-2xl bg-primary/10 py-3 text-center">
                <p className="font-bold text-primary">
                  {selectedEntries.length} boleta{selectedEntries.length === 1 ? '' : 's'} seleccionada{selectedEntries.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Boletas a reembolsar</p>
              <div className="space-y-2">
                {selectedEntries.map((e, idx) => (
                  <div key={e.id} className="rounded-2xl border border-border p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-foreground uppercase">{e.category || ticket.category}</p>
                      <p className="text-xs text-muted-foreground">Silla {e.code}</p>
                    </div>
                    {e.value > 0 && <p className="font-bold text-foreground">{formatCOP(e.value)}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-600" />
                <span className="font-extrabold text-amber-900">Comisiones no reembolsables</span>
              </div>
              <p className="text-sm text-amber-900/90 leading-relaxed">
                Las comisiones de la plataforma ({PLATFORM_FEE_LABEL}) <span className="font-bold">no son reembolsables</span>. Solo se devuelve el valor facial de la boleta.
              </p>
              <button
                type="button"
                onClick={() => setStep('policy')}
                className="text-sm font-bold text-primary underline underline-offset-2"
              >
                Ver política de recaudos y reembolsos
              </button>
            </div>

            <div className="rounded-2xl bg-secondary/60 border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal boletas</span>
                <span className="font-semibold text-foreground">{formatCOP(grossTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comisión plataforma (no reembolsable)</span>
                <span className="font-semibold text-foreground">{formatCOP(platformFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cantidad de boletas</span>
                <span className="font-semibold text-foreground">{selectedEntries.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor promedio</span>
                <span className="font-semibold text-foreground">{formatCOP(avgValue)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-bold text-foreground">Monto a reembolsar</span>
                <span className="text-xl font-extrabold text-primary">{formatCOP(refundTotal)}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-extrabold text-foreground">Notificaremos a ambas partes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enviaremos la confirmación al solicitante y la solicitud al organizador para que la gestione.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border p-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Solicitante</span>
                </div>
                <div className="rounded-xl border border-border p-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Organizador</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { Icon: Mail, label: 'Mail' },
                  { Icon: MessageCircle, label: 'WhatsApp' },
                  { Icon: Megaphone, label: 'Campana' },
                  { Icon: Bell, label: 'Push' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-extrabold text-orange-900">Importante</span>
              </div>
              <p className="text-sm text-orange-900/90 leading-relaxed">
                Una vez que la confirmación se haya realizado, no se podrá revertir. El proceso de reembolso se realizará de forma automática y recibirás una confirmación vía correo.
              </p>
            </div>

            {eligibilityMessage && (
              <p className="text-xs text-muted-foreground">{eligibilityMessage}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border-2 border-primary py-3 text-sm font-bold text-primary"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void confirmRefund()}
                className="flex-1 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Radicando…
                  </span>
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
            <button type="button" onClick={() => setStep('confirm')} className="h-9 w-9 rounded-full bg-card border border-border grid place-items-center">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pt-4 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/15 grid place-items-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-foreground">Política de recaudos y reembolsos</h1>
            <p className="text-sm text-muted-foreground mt-1">Lee atentamente antes de confirmar</p>
          </div>

          <div className="px-4 pt-6 space-y-4 text-sm text-foreground/90 leading-relaxed">
            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="font-extrabold text-foreground mb-2">1. Comisiones de la plataforma</h2>
              <p>
                Las comisiones cobradas por la plataforma ({PLATFORM_FEE_LABEL}) corresponden a los servicios de procesamiento de pago, emisión digital de la boleta, soporte y operación. Estas comisiones <span className="font-bold">no son reembolsables</span> bajo ninguna circunstancia, incluso cuando el reembolso de la boleta sea aprobado.
              </p>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="font-extrabold text-foreground mb-2">2. Tiempos de procesamiento</h2>
              <p>
                Los reembolsos aprobados se procesan en un plazo de <span className="font-bold">3 a 5 días hábiles</span> desde la confirmación de la solicitud. El monto será devuelto al mismo método de pago utilizado en la compra original.
              </p>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="font-extrabold text-foreground mb-2">3. Condiciones del reembolso</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>El reembolso aplica únicamente sobre el valor facial de las boletas, sin incluir comisiones.</li>
                <li>La solicitud debe realizarse dentro del plazo definido por la política de cada evento.</li>
                <li>Una vez confirmado el reembolso, las boletas quedarán inhabilitadas y no podrán ser utilizadas ni transferidas.</li>
                <li>El proceso es irreversible una vez aceptada la confirmación.</li>
              </ul>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="font-extrabold text-foreground mb-2">4. Recaudo de fondos</h2>
              <p>
                La plataforma actúa como recaudador del organizador del evento. Los fondos correspondientes al precio de las boletas son entregados al organizador conforme a los acuerdos comerciales, mientras que las comisiones quedan retenidas como contraprestación por los servicios prestados.
              </p>
            </section>

            <section className="rounded-2xl bg-card p-4 shadow-sm">
              <h2 className="font-extrabold text-foreground mb-2">5. Notificaciones</h2>
              <p>
                Recibirás un correo electrónico con el detalle del reembolso y un comprobante una vez que la transacción haya sido procesada por el operador de pagos.
              </p>
            </section>

            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="min-h-screen pb-40">
          <div className="px-4 pt-3">
            <div className="rounded-2xl bg-emerald-100 border border-emerald-200 p-3 flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-emerald-200 grid place-items-center shrink-0">
                <Check className="h-4 w-4 text-emerald-700" strokeWidth={3} />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-emerald-900">¡Solicitud enviada!</p>
                <p className="text-sm text-emerald-900/80">Reembolso procesado exitosamente</p>
              </div>
              <button type="button" onClick={onClose} className="text-emerald-800">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-4 pt-12 flex flex-col items-center text-center">
            <div className="h-32 w-32 rounded-full bg-emerald-100 grid place-items-center">
              <div className="h-20 w-20 rounded-full bg-emerald-600 grid place-items-center">
                <Check className="h-12 w-12 text-white" strokeWidth={3} />
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-extrabold text-foreground">Reembolso Exitoso</h1>
            <p className="text-base text-muted-foreground mt-2 max-w-xs">
              Tu solicitud de reembolso ha sido procesada correctamente
            </p>
            {refundTotal > 0 && (
              <p className="mt-3 text-lg font-extrabold text-primary">{formatCOP(refundTotal)}</p>
            )}
          </div>

          <div className="px-4 pt-8">
            <div className="rounded-2xl bg-amber-50 border-l-4 border-amber-400 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-5 w-5 text-amber-600" />
                <span className="font-extrabold text-amber-900">Política de reembolso</span>
              </div>
              <p className="text-sm text-amber-900/90 leading-relaxed">
                Los reembolsos se procesarán en un plazo de 3 a 5 días hábiles. El monto será devuelto al método de pago original. Recuerda que las comisiones de la plataforma no son reembolsables. Recibirás una confirmación por correo electrónico.
              </p>
            </div>
          </div>

          <div className="px-4 pt-5">
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="font-extrabold text-foreground">Notificaciones enviadas</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-emerald-900">Al solicitante — confirmación de solicitud</span>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-emerald-900">Al organizador — para gestionar el reembolso</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { Icon: Mail, label: 'Mail' },
                  { Icon: MessageCircle, label: 'WhatsApp' },
                  { Icon: Megaphone, label: 'Campana' },
                  { Icon: Bell, label: 'Push' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 pt-6 space-y-3">
            <div className="flex items-center gap-3 text-foreground">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-sm">Revisa tu correo para más detalles</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm">El proceso puede tardar 3-5 días hábiles</span>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-secondary px-4 py-4">
            <div className="mx-auto max-w-lg">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default RefundTicketFlow;
