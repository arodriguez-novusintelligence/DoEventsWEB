import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Loader2, Ticket } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { InvitationEvent } from '@lovable/data/invitationsData';

interface Props {
  event: InvitationEvent;
  onBack: () => void;
  onSuccess?: () => void;
  onPurchaseEnd?: () => void;
}

/**
 * Flujo de compra Lovable: resumen del evento → checkout real (`/events/:id/checkout`).
 * Sin mocks ni pasarela simulada.
 */
const TicketPurchaseFlow = ({ event, onBack }: Props) => {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (confirmed && event.id) {
      setNavigating(true);
      navigate(`/events/${event.id}/checkout`, { replace: true });
    }
  }, [confirmed, event.id, navigate]);

  if (!event.id) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-secondary">
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
            <CreditCard className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Compra no disponible</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Este evento no tiene un identificador válido para checkout. Abre el evento desde
            invitaciones o el feed para usar la pasarela de pago real.
          </p>
          <Button className="mt-6 rounded-full px-8" onClick={onBack}>
            Volver al evento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-secondary">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ChevronLeft className="h-5 w-5" /> Volver
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-16 pt-6">
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/60">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
              <Ticket className="h-6 w-6 text-primary" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-foreground">Comprar boletas</h2>
              <p className="text-xs text-muted-foreground">Resumen antes del checkout</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-xl bg-secondary/80 p-4">
            <p className="text-sm font-bold text-foreground">{event.title || 'Evento'}</p>
            {event.date && (
              <p className="text-xs text-muted-foreground">{event.date}</p>
            )}
            {event.location && (
              <p className="text-xs text-muted-foreground">{event.location}</p>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Serás redirigido a la pasarela de pago segura de Do.Events para elegir categorías
            y completar tu compra.
          </p>

          <Button
            type="button"
            className="mt-6 w-full rounded-full"
            disabled={navigating}
            onClick={() => setConfirmed(true)}
          >
            {navigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirigiendo…
              </>
            ) : (
              'Continuar al checkout'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketPurchaseFlow;
