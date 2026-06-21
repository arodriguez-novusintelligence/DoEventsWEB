import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, Loader2, PartyPopper, Share2 } from 'lucide-react';
import { fetchEventById, useToast } from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';

export const EventPublished = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const eventId = params.get('eventId') || params.get('id') || '';
  const [eventName, setEventName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(Boolean(eventId));

  useEffect(() => {
    if (!eventId) {
      setLoadingName(false);
      return;
    }
    let cancelled = false;
    void fetchEventById(eventId)
      .then((ev) => {
        if (!cancelled) setEventName(ev?.nombre || null);
      })
      .catch(() => {
        if (!cancelled) setEventName(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingName(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const shareUrl = eventId
    ? `${window.location.origin}/events/${eventId}`
    : window.location.origin;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Enlace copiado al portapapeles', 'success');
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-secondary px-6 text-center pb-24">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-sm ring-1 ring-primary/10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
        <PartyPopper className="h-7 w-7 text-primary" />
      </div>
      <p className="mt-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary shadow-sm">
        Publicación exitosa
      </p>
      <h1 className="mt-6 text-2xl font-extrabold text-foreground">¡Evento publicado!</h1>
      {loadingName ? (
        <div className="mt-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        </div>
      ) : eventName ? (
        <p className="mt-3 text-base font-extrabold text-primary">{eventName}</p>
      ) : null}
      <p className="mt-3 text-sm font-extrabold text-muted-foreground max-w-sm">
        Tu evento ya está visible en Do.Events. Compártelo con tu audiencia y empieza a vender boletas.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {eventId ? (
          <>
            <Button
              type="button"
              className="w-full rounded-full font-extrabold shadow-sm"
              onClick={() => navigate(`/events/${eventId}`)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Ver evento
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border border-border/60 font-extrabold shadow-sm"
              onClick={copyLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar enlace
            </Button>
            {typeof navigator.share === 'function' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-full font-extrabold shadow-sm"
                onClick={() => {
                  void navigator.share({
                    title: eventName || 'Mi evento en Do.Events',
                    url: shareUrl,
                  }).catch(() => undefined);
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </Button>
            )}
          </>
        ) : null}
        <Button
          type="button"
          variant={eventId ? 'ghost' : 'outline'}
          className="w-full rounded-full font-extrabold shadow-sm"
          onClick={() => navigate('/')}
        >
          Ir al feed
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-full font-extrabold shadow-sm"
          onClick={() => navigate('/my-events')}
        >
          Mis eventos
        </Button>
      </div>
      </div>
    </div>
  );
};

export default EventPublished;
