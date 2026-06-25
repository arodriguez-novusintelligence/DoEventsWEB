import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Radio, Type, Video, Image as ImageIcon } from 'lucide-react';
import {
  createStory,
  resolveDisplayLocation,
  updateStoryLivePlayback,
  uploadMediaFile,
  useToast,
} from '@doevents/shared';
import { getStoredUserLocation } from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { Textarea } from '@lovable/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lovable/components/ui/sheet';
import { cn } from '@lovable/lib/utils';

function storyLocationLabel(location: ReturnType<typeof getStoredUserLocation>): string | undefined {
  if (!location) return undefined;
  const resolved = resolveDisplayLocation({
    label: location.label,
    locationLabel: location.label,
    ciudad: location.city,
    departamento: location.departamento,
  });
  if (resolved !== '—') return resolved;
  return location.city || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}



export interface CreateStorySheetProps {

  open: boolean;

  onClose: () => void;

  onCreated?: () => void;

}



type StoryMode = 'image' | 'video' | 'text' | 'live';
type SheetPhase = 'choose' | 'editor';



export const CreateStorySheet: React.FC<CreateStorySheetProps> = ({ open, onClose, onCreated }) => {

  const { showToast } = useToast();

  const [mode, setMode] = useState<StoryMode>('image');
  const [phase, setPhase] = useState<SheetPhase>('choose');

  const [description, setDescription] = useState('');

  const [mediaIds, setMediaIds] = useState<string[]>([]);

  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image');

  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [liveActive, setLiveActive] = useState(false);

  const [livePublicationId, setLivePublicationId] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const livePublicationIdRef = useRef<string | null>(null);



  const stopLiveStream = useCallback(async () => {

    mediaRecorderRef.current?.stop();

    mediaRecorderRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    mediaStreamRef.current = null;

    if (videoPreviewRef.current) {

      videoPreviewRef.current.srcObject = null;

    }

    const publicationId = livePublicationIdRef.current;

    livePublicationIdRef.current = null;

    setLiveActive(false);

    setLivePublicationId(null);

    if (publicationId) {

      try {

        await updateStoryLivePlayback({ publicationId, mediaIds: [], isLive: false });

      } catch {

        /* ignore end errors */

      }

    }

  }, []);



  useEffect(() => {

    if (!open) {

      stopLiveStream();

    } else {

      setPhase('choose');

    }

    return () => {

      stopLiveStream();

    };

  }, [open, stopLiveStream]);

  const reset = () => {
    setDescription('');
    setMediaIds([]);
    setMediaPreview(null);
    setMode('image');
    setMediaKind('image');
    setPhase('choose');
    stopLiveStream();
  };

  const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;

    const isVideo = file.type.startsWith('video/');

    setUploading(true);

    try {

      const mediaId = await uploadMediaFile(file);

      setMediaIds([mediaId]);

      setMediaKind(isVideo ? 'video' : 'image');

      setMediaPreview(URL.createObjectURL(file));

      if (isVideo) setMode('video');

    } catch {

      setMediaIds([]);

      setMediaPreview(null);

      showToast('No se pudo subir el archivo', 'error');

    } finally {

      setUploading(false);

    }

  };



  const uploadLiveSegment = async (blob: Blob) => {

    const publicationId = livePublicationIdRef.current;

    if (!publicationId || !blob.size) return;

    const file = new File([blob], `live-${Date.now()}.webm`, { type: blob.type || 'video/webm' });

    const mediaId = await uploadMediaFile(file);

    await updateStoryLivePlayback({

      publicationId,

      mediaIds: [mediaId],

      isLive: true,

      description: description.trim(),

    });

  };



  const startLiveBroadcast = async () => {

    if (!navigator.mediaDevices?.getUserMedia) {

      showToast('Tu navegador no soporta transmisión en vivo', 'error');

      return;

    }

    setSubmitting(true);

    try {

      const location = getStoredUserLocation();

      const story = await createStory({

        description: description.trim() || 'Transmisión en vivo',

        mediaKind: 'video',

        isLive: true,

        latitude: location?.lat,

        longitude: location?.lng,

        locationLabel: storyLocationLabel(location),

      });

      const publicationId = story.id;

      livePublicationIdRef.current = publicationId;

      setLivePublicationId(publicationId);



      const stream = await navigator.mediaDevices.getUserMedia({

        video: { facingMode: 'environment' },

        audio: true,

      });

      mediaStreamRef.current = stream;

      if (videoPreviewRef.current) {

        videoPreviewRef.current.srcObject = stream;

        await videoPreviewRef.current.play().catch(() => undefined);

      }



      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')

        ? 'video/webm;codecs=vp8,opus'

        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = recorder;



      recorder.ondataavailable = (event) => {

        if (event.data.size > 0) {

          uploadLiveSegment(event.data).catch(() => undefined);

        }

      };

      recorder.start(8000);

      setLiveActive(true);

      showToast('Transmisión en vivo iniciada', 'success');

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'No se pudo iniciar la transmisión', 'error');

      await stopLiveStream();

    } finally {

      setSubmitting(false);

    }

  };



  const endLiveBroadcast = async () => {

    setSubmitting(true);

    try {

      await stopLiveStream();

      showToast('Transmisión finalizada', 'success');

      reset();

      onCreated?.();

      onClose();

    } finally {

      setSubmitting(false);

    }

  };



  const handleSubmit = async () => {

    if (mode === 'live') {

      if (liveActive) {

        await endLiveBroadcast();

      } else {

        await startLiveBroadcast();

      }

      return;

    }



    if (mode !== 'text' && !mediaIds.length) {

      showToast('Agrega una imagen o video', 'error');

      return;

    }

    if (mode === 'text' && !description.trim()) {

      showToast('Escribe un estado para tu historia', 'error');

      return;

    }



    setSubmitting(true);

    try {

      const location = getStoredUserLocation();

      await createStory({

        description: description.trim(),

        mediaIds: mediaIds.length ? mediaIds : undefined,

        mediaKind,

        isLive: false,

        latitude: location?.lat,

        longitude: location?.lng,

        locationLabel: storyLocationLabel(location),

      });

      showToast('Historia publicada (24 h)', 'success');

      reset();

      onCreated?.();

      onClose();

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'No se pudo publicar la historia', 'error');

    } finally {

      setSubmitting(false);

    }

  };



  const modeOptions: { id: StoryMode; label: string; icon: typeof ImagePlus }[] = [
    { id: 'image', label: 'Imagen', icon: ImagePlus },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'text', label: 'Estado', icon: Type },
    { id: 'live', label: 'En vivo', icon: Radio },
  ];

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="bottom" className="flex h-[92vh] flex-col overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="px-4 pb-2 pt-4 text-left">
          <SheetTitle>
            {phase === 'choose'
              ? 'Crear'
              : mode === 'live' && liveActive
                ? 'En vivo'
                : 'Crear historia'}
          </SheetTitle>
          {phase === 'editor' && (
            <SheetDescription>
              Comparte momentos que desaparecen en 24 horas.
            </SheetDescription>
          )}
        </SheetHeader>

        {phase === 'choose' ? (
          <div className="grid flex-1 grid-cols-1 gap-3 p-4">
            <button
              type="button"
              onClick={() => {
                setMode('image');
                setPhase('editor');
              }}
              className="flex items-center gap-4 rounded-2xl border bg-card p-5 text-left transition hover:bg-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Crear historia</p>
                <p className="text-xs text-muted-foreground">Sube una foto o video. Dura 24 horas.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('live');
                setPhase('editor');
              }}
              className="flex items-center gap-4 rounded-2xl border bg-card p-5 text-left transition hover:bg-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <Radio className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Crear en vivo</p>
                <p className="text-xs text-muted-foreground">Graba un video en vivo desde tu cámara.</p>
              </div>
            </button>
          </div>
        ) : (
        <div className="space-y-4 px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {modeOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  mode === id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent/50',
                )}
                onClick={() => {
                  if (liveActive && id !== 'live') return;
                  setMode(id);
                }}
                disabled={liveActive && id !== 'live'}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {mode === 'live' && (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
              <video ref={videoPreviewRef} className="aspect-video w-full object-cover" playsInline muted autoPlay />
              {liveActive && (
                <span className="absolute left-3 top-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                  Live
                </span>
              )}
            </div>
          )}

          {(mode === 'image' || mode === 'video') && (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-6 shadow-sm hover:bg-accent/30">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  {mode === 'video' ? (
                    <Video className="h-7 w-7 text-primary" />
                  ) : (
                    <ImagePlus className="h-7 w-7 text-primary" />
                  )}
                </div>
              )}
              <span className="text-sm font-medium text-foreground">
                {uploading
                  ? 'Subiendo…'
                  : mode === 'video'
                    ? 'Adjuntar video'
                    : 'Adjuntar imagen'}
              </span>
              <input
                type="file"
                accept={mode === 'video' ? 'video/*' : 'image/*'}
                onChange={handleMediaChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
          )}

          {mediaPreview && mode !== 'live' && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {mediaKind === 'video' ? (
                <video src={mediaPreview} controls className="max-h-64 w-full object-contain" />
              ) : (
                <img src={mediaPreview} alt="" className="max-h-64 w-full object-contain" />
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {mode === 'text' ? 'Tu estado' : 'Descripción (opcional)'}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                mode === 'text'
                  ? '¿Qué estás haciendo?'
                  : mode === 'live'
                    ? '¿Qué estás transmitiendo?'
                    : 'Añade contexto…'
              }
              className="min-h-[88px] resize-none rounded-xl"
            />
          </div>

          {mode === 'live' && (
            <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              {liveActive
                ? 'Tu transmisión se actualiza cada pocos segundos para quienes te siguen.'
                : 'Comparte conciertos y eventos multitudinarios en directo desde tu cámara.'}
            </p>
          )}

          <Button
            className="h-12 w-full rounded-full font-semibold"
            onClick={() => void handleSubmit()}
            disabled={submitting || uploading || (mode === 'live' && liveActive && !livePublicationId)}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting
              ? 'Procesando…'
              : mode === 'live'
                ? liveActive
                  ? 'Finalizar transmisión'
                  : 'Iniciar transmisión en vivo'
                : 'Compartir historia'}
          </Button>
        </div>
        )}
      </SheetContent>
    </Sheet>
  );
};



export default CreateStorySheet;

