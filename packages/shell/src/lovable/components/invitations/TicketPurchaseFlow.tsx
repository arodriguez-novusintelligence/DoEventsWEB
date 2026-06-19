import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { InvitationEvent } from '@lovable/data/invitationsData';

interface Props {
  event: InvitationEvent;
  onBack: () => void;
  onSuccess?: () => void;
  onPurchaseEnd?: () => void;
}

/**
 * Compra de tickets: redirige a `/events/:id/checkout` (LovableTicketCheckout).
 * Sin `event.id` válido muestra estado vacío — sin mocks ni pasarela simulada.
 */
const TicketPurchaseFlow = ({ event, onBack }: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (event.id) {
      navigate(`/events/${event.id}/checkout`, { replace: true });
    }
  }, [event.id, navigate]);

  if (event.id) {
    return null;
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
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
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
};

export default TicketPurchaseFlow;
