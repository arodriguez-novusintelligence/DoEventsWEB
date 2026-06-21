import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Send, RotateCcw, Sparkles, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import {
  sendAIAssistantMessage,
  resetAIAssistantSession,
  startAIAgentJob,
  pollAIAgentJob,
  uploadProfileGalleryImages,
  invalidateServicesCache,
  invalidateProfilePageCache,
  type AIEventDraft,
  type AIAssistantMessage,
  type AIChatAction,
  type AIChatAttachment,
  useToast,
} from '@doevents/shared';

const STORAGE_KEY = 'doevents.ai-assistant.conversation.v2';

const WELCOME: AIAssistantMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '👋 ¡Hola! Soy tu asistente IA de Do.Events. Puedo **buscar** eventos, lugares y servicios (te muestro resultados aquí), **crear** y **publicar** tu contenido con confirmación previa, **editar** precios/fechas/ubicación o **eliminar** con tu autorización. Si el lugar requiere mapa de silletería, te indicaré que lo configures manualmente.',
};

const SUGGESTIONS = [
  'Búscame grupos de champeta en Cartagena',
  'Créame un servicio de música que ofrezca un conjunto vallenato en Ricaurte Cundinamarca, fines de semana 5pm a medianoche, cobro 500000',
  'Busca lugares para eventos en Villavicencio',
  'Publica mi finca como lugar de eventos',
  'Cambia el precio de mi servicio de chef a $1.800.000',
  'Elimina mi servicio de mesero',
];

export interface AIAssistantViewProps {
  userId?: string;
  onBack?: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ userId, onBack }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { sessionId?: string };
        return parsed.sessionId;
      }
    } catch { /* ignore */ }
    return undefined;
  });
  const [messages, setMessages] = useState<AIAssistantMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { messages?: AIAssistantMessage[] };
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) return parsed.messages;
      }
    } catch { /* ignore */ }
    return [WELCOME];
  });
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [expectsMedia, setExpectsMedia] = useState<'service_image' | 'event_image' | 'venue_image' | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, sessionId }));
    } catch { /* ignore */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sessionId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const reset = useCallback(async () => {
    if (sessionId) {
      try { await resetAIAssistantSession(sessionId); } catch { /* ignore */ }
    }
    setSessionId(undefined);
    setMessages([WELCOME]);
    setPendingQuestions([]);
    setExpectsMedia(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [sessionId]);

  const appendAssistant = (payload: Partial<AIAssistantMessage> & { content: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        ...payload,
      },
    ]);
  };

  const send = async (
    text: string,
    options?: { deepPlan?: boolean; attachments?: AIChatAttachment[]; displayContent?: string },
  ) => {
    const trimmed = text.trim();
    const attachments = options?.attachments || [];
    if ((!trimmed && !attachments.length) || loading) return;

    const userMsg: AIAssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: options?.displayContent || trimmed || '📷 Imagen del servicio',
      attachments: attachments.length ? attachments : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setPendingQuestions([]);
    setLoading(true);

    try {
      if (options?.deepPlan) {
        const job = await startAIAgentJob(trimmed, { userId, sessionId });
        appendAssistant({
          content: '⏳ Estoy preparando un plan detallado en segundo plano. Te aviso en cuanto esté listo…',
        });
        const result = await pollAIAgentJob(job.jobId, { intervalMs: 2500, timeoutMs: 120000 });
        if (result.sessionId) setSessionId(result.sessionId);
        appendAssistant({
          content: result.reply || 'Plan completado.',
          draft: result.draft || null,
          results: result.results || null,
        });
        return;
      }

      const data = await sendAIAssistantMessage(trimmed || '📷 Imagen del servicio', {
        userId,
        sessionId,
        attachments,
      });
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.pendingQuestions?.length) setPendingQuestions(data.pendingQuestions);
      setExpectsMedia(data.expectsMedia || null);

      appendAssistant({
        content: data.reply || '…',
        draft: data.draft || null,
        results: data.results || null,
        actions: data.actions,
        expectsMedia: data.expectsMedia || null,
      });

      if (data.results?.createdService && userId) {
        invalidateServicesCache();
        invalidateProfilePageCache(userId);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error del asistente IA', 'error');
      appendAssistant({
        content: '⚠️ Hubo un error al contactar la IA. Intenta de nuevo en unos segundos.',
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleAction = (action: AIChatAction) => {
    if (action.type === 'navigate' && action.path) {
      navigate(action.path);
      return;
    }
    if (action.type === 'confirm') {
      void send(action.label || 'Sí, confirmar');
      return;
    }
    if (action.type === 'refund') {
      void send(action.label || 'Política de reembolso');
      return;
    }
    if (action.type === 'reject') {
      void send('No, cancelar');
    }
  };

  const handleImageSelected = async (file: File | null) => {
    if (!file || loading || uploadingImage) return;
    if (!userId) {
      showToast('Inicia sesión para adjuntar imágenes y publicar servicios', 'error');
      return;
    }
    setUploadingImage(true);
    try {
      const uploaded = await uploadProfileGalleryImages(userId, [file]);
      const img = uploaded[0];
      if (!img?.imageId) throw new Error('No se pudo procesar la imagen');
      const attachment: AIChatAttachment = {
        type: 'image',
        galleryImageId: img.imageId,
        key: img.key,
        url: img.publicUrl || img.url,
        previewUrl: img.url || img.signedUrl || img.publicUrl,
        fileName: file.name,
      };
      await send('📷 Foto del servicio', {
        attachments: [attachment],
        displayContent: '📷 Foto del servicio',
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir la imagen', 'error');
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUseDraft = (draft: AIEventDraft) => {
    if (draft.status === 'awaiting_confirmation' || draft.status === 'awaiting_image' || draft.status === 'awaiting_refund') return;
    if (draft.type === 'service_publish') {
      try {
        sessionStorage.setItem('doevents.ai-service-draft', JSON.stringify(draft));
      } catch { /* ignore */ }
      navigate('/services/create');
      return;
    }
    if (draft.type === 'venue_publish') {
      try {
        sessionStorage.setItem('doevents.ai-venue-draft', JSON.stringify(draft));
      } catch { /* ignore */ }
      navigate('/places/publish');
      return;
    }
    try {
      sessionStorage.setItem('doevents.ai-event-draft', JSON.stringify(draft));
    } catch { /* ignore */ }
    navigate('/events/create');
  };

  const isComplexPlan = (text: string) => /(\d+\s*d[ií]as?|multi.?d[ií]a|planifica|itinerario|varios proveedores)/i.test(text);

  return (
    <div className="de-ai-assistant fixed inset-0 z-[110] mx-auto flex max-w-lg flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 safe-area-top shadow-sm">
        {onBack && (
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full text-primary" aria-label="Volver">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </span>
        <div className="flex flex-1 flex-col min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">PRO · IA</span>
          <h1 className="text-base font-extrabold">Asistente Do.Events</h1>
        </div>
        <button
          type="button"
          onClick={() => void reset()}
          className="flex items-center gap-1.5 rounded-full border-2 border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:border-primary hover:bg-primary/15"
          title="Reinicia la conversación desde cero"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Nueva conversación
        </button>
      </header>

      <div className="shrink-0 border-b border-border bg-muted/40 px-4 py-2.5">
        <p className="text-[11px] leading-snug text-muted-foreground">
          <span className="font-bold text-foreground">Nueva conversación</span>
          {' '}
          borra el historial del chat y el contexto que la IA recordaba (ciudad, borradores pendientes, etc.).
          Úsala si quieres empezar un tema distinto o si la IA se confundió con mensajes anteriores.
        </p>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[88%] space-y-2">
              {m.role === 'user' ? (
                <div className="space-y-2">
                  {m.attachments?.map((att) => (
                    att.previewUrl || att.url ? (
                      <img
                        key={att.galleryImageId || att.url}
                        src={att.previewUrl || att.url}
                        alt={att.fileName || 'Imagen adjunta'}
                        className="ml-auto max-h-40 rounded-2xl border border-border object-cover"
                      />
                    ) : null
                  ))}
                  <div className="rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </div>
                  {m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {m.actions.map((action) => (
                        <Button
                          key={`${action.type}-${action.label}`}
                          type="button"
                          variant={action.type === 'confirm' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-xl text-xs"
                          onClick={() => handleAction(action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                  {m.results && (
                    <SearchResultsCards results={m.results} onOpen={(path) => navigate(path)} />
                  )}
                  {m.draft && m.draft.status !== 'created' && (
                    <DraftCard draft={m.draft} onUse={() => handleUseDraft(m.draft!)} />
                  )}
                  {m.results?.createdService && (
                    <CreatedEntityCard
                      label="Servicio publicado"
                      name={m.results.createdService.name}
                      city={m.results.createdService.city}
                      imageUrl={m.results.createdService.profileImageUrl || m.results.createdService.imageUrl}
                      onOpen={() => navigate(`/services/${m.results!.createdService!.serviceId || m.results!.createdService!.id}`)}
                    />
                  )}
                  {m.results?.createdEvent && (
                    <CreatedEntityCard
                      label="Evento creado"
                      name={m.results.createdEvent.name}
                      city={m.results.createdEvent.city}
                      imageUrl={m.results.createdEvent.imageUrl}
                      onOpen={() => navigate(m.results!.createdEvent!.path || `/events/${m.results!.createdEvent!.eventId || m.results!.createdEvent!.id}`)}
                    />
                  )}
                  {m.results?.createdVenue && (
                    <CreatedEntityCard
                      label="Lugar publicado"
                      name={m.results.createdVenue.name}
                      city={m.results.createdVenue.city}
                      imageUrl={m.results.createdVenue.imageUrl}
                      onOpen={() => navigate(m.results!.createdVenue!.path || `/places/${m.results!.createdVenue!.venueId || m.results!.createdVenue!.id}`)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Pensando…
            </div>
          </div>
        )}

        {expectsMedia && !loading && (
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground">
            📷 {expectsMedia === 'service_image' && 'Adjunta una foto del servicio con el botón de imagen.'}
            {expectsMedia === 'event_image' && 'Adjunta una imagen del evento o escribe "continuar sin foto".'}
            {expectsMedia === 'venue_image' && 'Adjunta una foto del lugar con el botón de imagen.'}
          </div>
        )}

        {pendingQuestions.length > 0 && !loading && (
          <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Puedes responder aquí</p>
            {pendingQuestions.map((q) => (
              <p key={q} className="text-xs text-muted-foreground">• {q}</p>
            ))}
          </div>
        )}

        {messages.length <= 1 && !loading && (
          <div className="space-y-2 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sugerencias</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="flex w-full items-start gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left text-sm shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99]"
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="leading-snug">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        className="shrink-0 border-t border-border bg-card px-4 py-3 safe-area-bottom"
        onSubmit={(e) => {
          e.preventDefault();
          const t = input.trim();
          if (!t || loading) return;
          void send(t, { deepPlan: isComplexPlan(t) });
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleImageSelected(e.target.files?.[0] || null)}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || uploadingImage}
            onClick={() => fileRef.current?.click()}
            aria-label="Adjuntar imagen"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const t = input.trim();
                if (t && !loading) void send(t, { deepPlan: isComplexPlan(t) });
              }
            }}
            placeholder={
              expectsMedia
                ? 'Confirma, adjunta foto con 📷 o escribe tu mensaje…'
                : 'Escribe tu mensaje…'
            }
            rows={1}
            disabled={loading}
            aria-label="Mensaje para el asistente IA"
            className="min-h-[44px] max-h-28 min-w-0 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Enviar mensaje"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

const DraftCard: React.FC<{ draft: AIEventDraft; onUse: () => void }> = ({ draft, onUse }) => {
  const isService = draft.type === 'service_publish';
  const isVenue = draft.type === 'venue_publish';
  const isConfirmStep = draft.status === 'awaiting_confirmation';
  const label = isService ? 'Resumen del servicio' : isVenue ? 'Borrador del lugar' : 'Borrador del evento';
  const buttonLabel = isService
    ? 'Abrir en creador de servicios'
    : isVenue
      ? 'Abrir en publicador de lugares'
      : 'Abrir en creador de eventos';

  if (isConfirmStep) {
    return (
      <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {(draft.title || draft.role) && <p className="text-sm font-extrabold">{draft.title || draft.role}</p>}
        <ul className="text-xs space-y-1">
          {(draft.city || draft.locationLabel) && <li>📍 {draft.locationLabel || draft.city}</li>}
          {draft.price != null && (
            <li>
              💰 ${Number(draft.price).toLocaleString('es-CO')} COP
              {draft.priceLabel ? ` ${draft.priceLabel}` : ''}
            </li>
          )}
          {draft.availability === 'weekends' && <li>🗓️ Fines de semana</li>}
          {(draft.scheduleStart && draft.scheduleEnd) && <li>🕐 {draft.scheduleStart} – {draft.scheduleEnd}</li>}
          {draft.refundPolicy && <li>↩️ {draft.refundPolicy}</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{label}</p>
      {(draft.title || draft.role) && <p className="text-sm font-extrabold">{draft.title || draft.role}</p>}
      <ul className="text-xs space-y-1">
        {(draft.city || draft.locationLabel || draft.neighborhood) && (
          <li>📍 {[draft.neighborhood, draft.locationLabel, draft.city].filter(Boolean).join(' · ')}</li>
        )}
        {draft.dateHint && <li>📅 {draft.dateHint}</li>}
        {draft.capacity && <li>👥 {draft.capacity} personas</li>}
        {draft.price != null && (
          <li>
            💰 ${Number(draft.price).toLocaleString('es-CO')} COP
            {draft.priceLabel ? ` ${draft.priceLabel}` : ''}
          </li>
        )}
        {draft.availability === 'weekends' && <li>🗓️ Fines de semana</li>}
        {(draft.scheduleStart && draft.scheduleEnd) && <li>🕐 {draft.scheduleStart} – {draft.scheduleEnd}</li>}
        {draft.refundPolicy && <li>↩️ {draft.refundPolicy}</li>}
        {draft.venue?.name && <li>🏛️ {draft.venue.name}</li>}
        {draft.venueType && <li>🏛️ {draft.venueType}</li>}
        {draft.services?.length ? (
          <li>🎵 {draft.services.map((s) => s.name).filter(Boolean).join(', ')}</li>
        ) : null}
      </ul>
      {draft.status !== 'awaiting_image' && draft.status !== 'awaiting_refund' && (
        <Button type="button" onClick={onUse} className="w-full rounded-xl text-xs" size="sm">
          {buttonLabel}
        </Button>
      )}
    </div>
  );
};

const CreatedEntityCard: React.FC<{
  label: string;
  name?: string;
  city?: string;
  imageUrl?: string;
  onOpen: () => void;
}> = ({ label, name, city, imageUrl, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="flex w-full gap-3 rounded-2xl border-2 border-success/30 bg-success/5 p-3 text-left transition-colors hover:border-success/50"
  >
    {imageUrl ? (
      <img src={imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
    ) : (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-success/10 ring-2 ring-success/20">
        <CheckCircle2 className="h-7 w-7 text-success" />
      </div>
    )}
    <div className="min-w-0 flex-1 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-success">{label}</p>
      <p className="text-sm font-extrabold">{name}</p>
      {city && <p className="text-xs text-muted-foreground">📍 {city}</p>}
      <p className="text-[11px] font-semibold text-success">Ver detalle →</p>
    </div>
  </button>
);

type SearchItem = {
  id?: string;
  name?: string;
  city?: string;
  category?: string;
  role?: string;
  type?: string;
  minPrice?: number;
  price?: number;
  rating?: number;
  distanceKm?: number;
  capacity?: number;
  date?: string;
  path?: string;
  profileImageUrl?: string;
  imageUrl?: string;
};

const SearchResultsCards: React.FC<{
  results: NonNullable<AIAssistantMessage['results']>;
  onOpen: (path: string) => void;
}> = ({ results, onOpen }) => {
  const services = (results.services || []) as SearchItem[];
  const events = (results.events || []) as SearchItem[];
  const venues = (results.venues || []) as SearchItem[];
  const items = [
    ...services.map((s) => ({ ...s, kind: 'Servicio' as const })),
    ...events.map((e) => ({ ...e, kind: 'Evento' as const })),
    ...venues.map((v) => ({ ...v, kind: 'Lugar' as const })),
  ].slice(0, 8);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <button
          key={`${item.kind}-${item.id || item.name}`}
          type="button"
          onClick={() => item.path && onOpen(item.path)}
          className="flex w-full gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
        >
          {(item.profileImageUrl || item.imageUrl) ? (
            <img
              src={item.profileImageUrl || item.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
              {item.kind === 'Servicio' ? '🛠️' : item.kind === 'Evento' ? '🎉' : '🏛️'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{item.kind}</p>
            <p className="truncate text-sm font-extrabold">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {[item.city, item.category || item.role || item.type, item.date].filter(Boolean).join(' · ')}
              {item.minPrice != null && ` · $${Number(item.minPrice).toLocaleString('es-CO')}`}
              {item.price != null && item.minPrice == null && ` · $${Number(item.price).toLocaleString('es-CO')}`}
              {item.capacity != null && ` · ${item.capacity} pax`}
              {item.distanceKm != null && ` · ${item.distanceKm.toFixed(1)} km`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AIAssistantView;
