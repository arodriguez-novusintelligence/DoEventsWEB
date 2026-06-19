import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';

export const EventPublished = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get('eventId') || params.get('id') || '';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-secondary px-6 text-center pb-24">
      <div className="rounded-full bg-primary/10 p-6">
        <PartyPopper className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-foreground">¡Evento publicado!</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-sm">
        Tu evento ya está visible en Do.Events. Compártelo con tu audiencia y empieza a vender boletas.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {eventId ? (
          <Button
            type="button"
            className="w-full rounded-full"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Ver evento
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full"
          onClick={() => navigate('/')}
        >
          Ir al feed
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => navigate('/my-events')}
        >
          Mis eventos
        </Button>
      </div>
    </div>
  );
};

export default EventPublished;
