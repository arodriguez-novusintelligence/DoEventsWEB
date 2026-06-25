import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Home, Loader2, MapPin, ShieldCheck, Ticket } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { resolveImageUrl } from '@doevents/shared';
import { InvitationEvent } from '@lovable/data/invitationsData';

interface Props {
  event: InvitationEvent;
  onBack: () => void;
  onSuccess?: () => void;
  onPurchaseEnd?: () => void;
}

/**
 * Flujo de compra Lovable (resumen + venue) → checkout real (`/events/:id/checkout`).
 * Sin mocks de mapa de sillas ni pasarela simulada.
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
      <div className="mx-auto min-h-screen max-w-lg bg-background pb-20">
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground"
          >
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
        </div>
        <div className="flex flex-col items-center px-6 pb-16 pt-12 text-center">
          <CreditCard className="mb-4 h-14 w-14 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Compra no disponible</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Este evento no tiene un identificador válido para checkout.
          </p>
          <Button className="mt-6 rounded-full px-8" onClick={onBack}>
            Volver al evento
          </Button>
        </div>
      </div>
    );
  }

  const venueName = event.venue?.name || 'Lugar del evento';
  const venueAddress = event.venue?.address || '';
  const capacity = event.capacity ? `Capacidad ${event.capacity}` : null;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-20">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="h-5 w-5" /> Volver
        </button>
        <p className="text-base font-bold text-primary">Compra de boletería</p>
        <h1 className="text-2xl font-extrabold leading-tight text-foreground">{event.title || 'Evento'}</h1>
      </div>

      {event.image && (
        <div className="mt-4 px-4">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-card shadow-sm">
            <img
              src={resolveImageUrl(event.image) || event.image}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="mt-4 px-4">
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Home className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground">{venueName}</p>
              {capacity && (
                <p className="mt-1 text-xs text-muted-foreground">{capacity}</p>
              )}
              {venueAddress && (
                <p className="text-xs text-muted-foreground">{venueAddress}</p>
              )}
            </div>
          </div>
          {event.venue?.images && event.venue.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.venue.images.slice(0, 3).map((img, i) => (
                <img
                  key={i}
                  src={resolveImageUrl(img) || img}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ))}
            </div>
          )}
          {venueAddress && (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4 shrink-0" />
              {venueAddress}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 px-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <p className="font-bold text-foreground">Selección de boletas</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            En el checkout podrás elegir categorías, cantidades y asientos (si el evento tiene mapa de silletería).
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Pasarela de pago segura de Do.Events — sin simulaciones.
          </p>
          <Button
            type="button"
            className="mt-4 w-full rounded-full"
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
