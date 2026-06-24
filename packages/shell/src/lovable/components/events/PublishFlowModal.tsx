import { useState } from 'react';
import { Megaphone, Share2, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import BankingHub from '@lovable/components/banking/BankingHub';

import { getCurrentEnv } from '@doevents/shared';
interface Props {
  open: boolean;
  eventId: string;
  onClose: () => void;
  onFinalize: () => void;
}

type Stage = 'bank' | 'bankForm' | 'success';

const PublishFlowModal = ({ open, eventId, onClose, onFinalize }: Props) => {
  const [stage, setStage] = useState<Stage>('bank');

  if (!open) return null;

  const eventUrl = `https://doeventsapp.com/Wall/DetalleEvento?eventId=${eventId}`;

  const reset = () => setStage('bank');
  const handleClose = () => { reset(); onClose(); };

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

  // Cuando el usuario abre BankingHub se renderiza a pantalla completa,
  // por encima del modal de publicación.
  if (stage === 'bankForm') {
    return (
      <div className="fixed inset-0 z-[110] bg-background overflow-y-auto">
        <BankingHub
          onBack={() => {
            toast.success('Datos bancarios registrados');
            setStage('success');
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/50 p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl">
        <button onClick={handleClose} className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-secondary">
          <X className="h-5 w-5" />
        </button>

        {stage === 'bank' && (
          <div className="flex flex-col items-center text-center">
            <Megaphone className="h-12 w-12 text-emerald-600" />
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


        {stage === 'success' && (
          <div className="flex flex-col items-center text-center">
            <Megaphone className="h-12 w-12 text-emerald-600" />
            <h3 className="mt-4 text-2xl font-extrabold text-foreground">
              ¡Felicitaciones tu evento se ha publicado!
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No olvides compartirlo en tus redes sociales.
            </p>

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