import { useState } from 'react';
import { Megaphone, Share2, X, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentEnv } from '@doevents/shared';

interface Props {
  open: boolean;
  eventId: string;
  onClose: () => void;
  onFinalize: () => void;
  onSubmitBank?: (bank: {
    holderName: string;
    documentId: string;
    bankName: string;
    accountType: string;
    accountNumber: string;
  }) => Promise<void>;
}

type Stage = 'bank' | 'bankForm' | 'success' | 'error';

const PublishFlowModal = ({ open, eventId, onClose, onFinalize, onSubmitBank }: Props) => {
  const [stage, setStage] = useState<Stage>('bank');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bank, setBank] = useState({
    holderName: '',
    documentId: '',
    bankName: '',
    accountType: 'ahorros',
    accountNumber: '',
  });

  if (!open) return null;

  const eventUrl = `${getCurrentEnv().webBaseUrl}/events/${eventId}`;

  const reset = () => {
    setStage('bank');
    setErrorMessage('');
    setSaving(false);
    setBankSaved(false);
    setBank({ holderName: '', documentId: '', bankName: '', accountType: 'ahorros', accountNumber: '' });
  };

  const handleClose = () => { reset(); onClose(); };

  const submitBank = async () => {
    if (!bank.holderName || !bank.documentId || !bank.bankName || !bank.accountNumber) {
      setErrorMessage('Completa todos los datos bancarios para continuar.');
      setStage('error');
      return;
    }
    if (!onSubmitBank) {
      // BACKEND_REQUIRED: persistencia vía API banking — no simular guardado ni éxito
      setErrorMessage('El registro bancario post-publicación aún no está disponible. Puedes continuar y registrar tus datos más tarde.');
      setStage('error');
      return;
    }
    setSaving(true);
    try {
      await onSubmitBank(bank);
      setBankSaved(true);
      toast.success('Datos bancarios registrados');
      setStage('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudieron guardar los datos bancarios');
      setStage('error');
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mi evento', url: eventUrl });
      } else {
        await navigator.clipboard.writeText(eventUrl);
        toast.success('Enlace copiado');
      }
    } catch { /* noop */ }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
        <button onClick={handleClose} className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-secondary">
          <X className="h-5 w-5" />
        </button>

        {stage === 'bank' && (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Megaphone className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              ¡Para publicar tu evento, debes registrar tus datos bancarios!
            </h3>
            <button
              onClick={() => setStage('bankForm')}
              className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Registrar mis datos
            </button>
            <button
              onClick={() => setStage('success')}
              className="mt-3 text-sm font-semibold text-primary underline"
            >
              Notificarme más tarde
            </button>
          </div>
        )}

        {stage === 'bankForm' && (
          <div>
            <h3 className="text-lg font-bold text-primary">Datos bancarios</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Registra la cuenta donde recibirás los pagos de tu evento.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Titular de la cuenta</label>
                <input
                  value={bank.holderName}
                  onChange={(e) => setBank({ ...bank, holderName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Documento de identidad</label>
                <input
                  value={bank.documentId}
                  onChange={(e) => setBank({ ...bank, documentId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Banco</label>
                <input
                  value={bank.bankName}
                  onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Tipo de cuenta</label>
                  <select
                    value={bank.accountType}
                    onChange={(e) => setBank({ ...bank, accountType: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="ahorros">Ahorros</option>
                    <option value="corriente">Corriente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">N° de cuenta</label>
                  <input
                    value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => void submitBank()}
              disabled={saving}
              className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</span>
              ) : 'Guardar y publicar'}
            </button>
            <button
              onClick={() => setStage('bank')}
              className="mt-3 w-full text-sm font-semibold text-muted-foreground"
            >
              Volver
            </button>
          </div>
        )}

        {stage === 'error' && (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Revisa los datos</h3>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            {!onSubmitBank && (
              <div className="mt-4 w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left">
                <p className="text-xs font-semibold text-primary">Persistencia bancaria (BACKEND_REQUIRED)</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  El registro bancario post-publicación requiere integración con DoEventsBack.
                </p>
              </div>
            )}
            <button
              onClick={() => setStage('bankForm')}
              className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Volver al formulario
            </button>
          </div>
        )}

        {stage === 'success' && (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-2xl font-extrabold text-foreground">
              ¡Felicitaciones tu evento se ha publicado!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No olvides compartirlo en tus redes sociales.
            </p>

            {!bankSaved && (
            <div className="mt-4 w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold text-primary">Datos bancarios pendientes</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Registra tu cuenta para recibir pagos de entradas vendidas.
              </p>
            </div>
            )}

            <div className="mt-5 w-full text-left">
              <p className="text-xs text-muted-foreground">Enlace del evento</p>
              <div className="mt-1 flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
                <p className="flex-1 break-all text-xs font-mono text-foreground">{eventUrl}</p>
                <button onClick={share} className="text-primary">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              onClick={share}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary py-3 text-sm font-bold text-primary"
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </button>
            <button
              onClick={() => { onFinalize(); handleClose(); }}
              className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Finalizar
            </button>
            <button
              onClick={() => setStage('bankForm')}
              className="mt-3 text-sm font-semibold text-primary underline"
            >
              Registrar mis datos bancarios
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishFlowModal;
