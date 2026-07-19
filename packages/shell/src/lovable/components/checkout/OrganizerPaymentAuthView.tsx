import React, { useState } from 'react';
import { ChevronLeft, Info, ShieldCheck, Smile } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';

export type OrganizerAuthOption = 'knows' | 'unknown';

export interface OrganizerPaymentAuthViewProps {
  remainingMs?: number | null;
  onBack?: () => void;
  onContinue: (choice: OrganizerAuthOption) => void;
  disabled?: boolean;
}

function formatTimerParts(remainingMs: number | null | undefined) {
  if (remainingMs == null) return { h: '00', m: '00', s: '00' };
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return { h: pad(h), m: pad(m), s: pad(s) };
}

const OPTIONS: Array<{ id: OrganizerAuthOption; text: string }> = [
  {
    id: 'knows',
    text: 'Conozco al creador del evento, autorizo la transferencia del pago inmediato de mi boleta.',
  },
  {
    id: 'unknown',
    text: 'No conozco al creador del evento, autorizo la transferencia del pago de mi boleta, después de finalizado el evento.',
  },
];

/**
 * Paso de autorización de pago al organizador (conozco / no conozco).
 * isReferred backend: true = conoce (pago inmediato), false = no conoce (post-evento).
 */
export const OrganizerPaymentAuthView: React.FC<OrganizerPaymentAuthViewProps> = ({
  remainingMs,
  onBack,
  onContinue,
  disabled = false,
}) => {
  const [authChoice, setAuthChoice] = useState<OrganizerAuthOption>('unknown');
  const [infoModal, setInfoModal] = useState<OrganizerAuthOption | null>(null);
  const [confirmKnows, setConfirmKnows] = useState(false);
  const time = formatTimerParts(remainingMs);
  const timerLow = remainingMs != null && remainingMs < 6 * 60 * 1000;

  const handleContinue = () => {
    if (disabled) return;
    if (authChoice === 'knows') {
      setConfirmKnows(true);
      return;
    }
    onContinue(authChoice);
  };

  return (
    <div className="mx-auto max-w-lg min-h-screen bg-[#EEF0FB] pb-32">
      <div className="px-4 pt-4">
        {remainingMs != null && (
          <div
            className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-3 ${
              timerLow
                ? 'border-2 border-rose-400 bg-rose-100'
                : 'border-2 border-primary bg-card'
            }`}
          >
            <span className={`text-sm font-bold ${timerLow ? 'text-rose-600' : 'text-primary'}`}>
              Tiempo restante
            </span>
            <div className="text-right">
              <p
                className={`font-mono text-lg font-extrabold tracking-wider ${
                  timerLow ? 'text-rose-600' : 'text-primary'
                }`}
              >
                {time.h}:{time.m}:{time.s}
              </p>
              <p className="text-[10px] text-muted-foreground">Hr&nbsp;&nbsp;Min&nbsp;&nbsp;Seg</p>
            </div>
          </div>
        )}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm font-medium text-foreground"
          >
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
        )}

        <h1 className="text-2xl font-extrabold leading-tight text-primary">
          Autorización del pago de mi boleta al organizador del evento
        </h1>
        <p className="mt-3 text-sm text-foreground">
          Selecciona una de las opciones para continuar con el pago de tus entradas y garantizar una
          compra transparente.
        </p>

        <div className="mt-6 space-y-4">
          {OPTIONS.map((opt) => (
            <div key={opt.id} className="flex items-start gap-3">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setAuthChoice(opt.id)}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  authChoice === opt.id ? 'border-primary' : 'border-muted-foreground/40'
                }`}
                aria-pressed={authChoice === opt.id}
              >
                {authChoice === opt.id && <span className="h-3 w-3 rounded-full bg-primary" />}
              </button>
              <p className="flex-1 text-sm text-foreground">{opt.text}</p>
              <button
                type="button"
                onClick={() => setInfoModal(opt.id)}
                className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-primary"
                aria-label="Más información"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
        <div className="mx-auto max-w-lg">
          <Button
            className="w-full rounded-full py-6 text-base font-semibold"
            disabled={disabled}
            onClick={handleContinue}
          >
            Continuar
          </Button>
        </div>
      </div>

      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary">
              <Info className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              {infoModal === 'unknown' ? (
                <>
                  Al seleccionar esta opción, evitas el riesgo de fraude, ya que la plataforma
                  garantiza la devolución del dinero en caso de que el evento no se realice.
                </>
              ) : (
                <>
                  Al seleccionar esta opción, tu pago se transferirá{' '}
                  <strong>directamente al organizador antes del evento</strong>. Esto permite que
                  reciba los fondos de manera anticipada para los preparativos.
                </>
              )}
            </p>
            <Button
              variant="outline"
              className="mt-5 w-full rounded-full border-2 border-primary font-semibold text-primary"
              onClick={() => setInfoModal(null)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {confirmKnows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Smile className="h-9 w-9 text-emerald-600" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground">
              ¡Perfecto! conoces al organizador
            </h3>
            <p className="mt-3 text-sm text-foreground">
              Al seleccionar esta opción, tu pago se transferirá{' '}
              <strong>directamente al organizador antes de evento</strong>. Esto permite que reciba
              los fondos de manera anticipada para los preparativos.
            </p>
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-left">
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-primary">Tu seguridad es importante</p>
              </div>
              <p className="text-xs text-foreground">
                Te recomendamos esta opción solo si confías en el organizador. En caso de
                cancelación, el reembolso dependerá directamente del organizador del evento.
              </p>
            </div>
            <p className="mt-4 text-sm font-bold text-foreground">
              ¿Estás seguro de continuar con esta modalidad de pago?
            </p>
            <div className="mt-4 space-y-2">
              <Button
                className="w-full rounded-full py-5 text-sm font-semibold"
                onClick={() => {
                  setConfirmKnows(false);
                  onContinue('knows');
                }}
              >
                Si, Continuar
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full border-2 border-primary py-5 font-semibold text-primary"
                onClick={() => setConfirmKnows(false)}
              >
                No, Revisar opciones
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function authChoiceToIsReferred(choice: OrganizerAuthOption): boolean {
  // true = conoce al creador (pago inmediato / directo)
  return choice === 'knows';
}

const STORAGE_KEY = 'doevents_order_is_referred';

export function persistOrderIsReferred(orderId: string, isReferred: boolean) {
  if (!orderId) return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[orderId] = isReferred;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function loadOrderIsReferred(orderId: string): boolean | undefined {
  if (!orderId) return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const map = JSON.parse(raw) as Record<string, boolean>;
    if (typeof map[orderId] === 'boolean') return map[orderId];
  } catch {
    /* ignore */
  }
  return undefined;
}

export default OrganizerPaymentAuthView;
