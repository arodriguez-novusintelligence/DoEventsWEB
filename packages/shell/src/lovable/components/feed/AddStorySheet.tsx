import { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Camera, Video, X, Check, Radio, Image as ImageIcon, Circle, Square } from 'lucide-react';
import { useStories } from '@lovable/contexts/StoriesContext';
import { useNotifications } from '@lovable/contexts/NotificationsContext';
import { myFollowers } from '@lovable/data/mockData';
import { toast } from '@lovable/hooks/use-toast';

import { getStoredUserLocation } from '@doevents/shared';
export interface AddStorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Mode = 'choose' | 'story' | 'live';

const AddStorySheet = ({ open, onOpenChange }: Props) => {
  const { addStory } = useStories();
  const { addNotification } = useNotifications();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('choose');
  const [preview, setPreview] = useState<{ type: 'image' | 'video'; url: string } | null>(null);

  // Live recording state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  const reset = () => {
    setMode('choose');
    setPreview(null);
    setIsRecording(false);
    setElapsed(0);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) reset();
    return () => { if (!open) reset(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startLive = async () => {
    setMode('live');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      toast({ title: 'No se pudo acceder a la cámara', description: 'Verifica los permisos del navegador.' });
      setMode('choose');
    }
  };

  const toggleRecord = () => {
    if (!streamRef.current) return;
    if (!isRecording) {
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => setPreview({ type: 'video', url: reader.result as string });
        reader.readAsDataURL(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      recorderRef.current = rec;
      rec.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      recorderRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    }
  };

  const handleFile = (f: File) => {
    const isVideo = f.type.startsWith('video/');
    if (!isVideo && !f.type.startsWith('image/')) {
      toast({ title: 'Formato no soportado', description: 'Sube una imagen o video.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview({ type: isVideo ? 'video' : 'image', url: reader.result as string });
    };
    reader.readAsDataURL(f);
  };

  const handlePublish = () => {
    if (!preview) return;
    addStory(preview);
    const isLive = mode === 'live';
    // Creator confirmation
    addNotification({
      type: isLive ? 'live_started' : 'story_published',
      fromUser: { id: 'me', name: 'Tú', initials: 'TU' },
      message: `Se enviaron notificaciones a tus ${myFollowers.length} seguidores sobre ${isLive ? 'tu transmisión en vivo' : 'tu historia'}`,
    });
    // Fan-out to followers
    myFollowers.forEach(() => {
      addNotification({
        type: isLive ? 'live_started' : 'story_published',
        fromUser: { id: 'me', name: 'Tú', initials: 'TU' },
        message: isLive ? 'inició una transmisión en vivo' : 'publicó una nueva historia',
      });
    });
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isLive ? 'En vivo iniciado' : 'Historia publicada', {
          body: `Se notificó a ${myFollowers.length} seguidores.`,
        });
      } catch {}
    }
    toast({
      title: isLive ? 'En vivo publicado' : 'Historia publicada',
      description: 'Visible por 24 horas.',
    });
    reset();
    onOpenChange(false);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>
            {mode === 'choose' ? 'Crear' : mode === 'live' ? 'En vivo' : 'Crear historia'}
          </SheetTitle>
        </SheetHeader>

        {mode === 'choose' && (
          <div className="flex-1 p-4 grid grid-cols-1 gap-3">
            <button
              onClick={() => setMode('story')}
              className="rounded-2xl border bg-card p-5 text-left flex items-center gap-4 hover:bg-accent transition"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Crear historia</p>
                <p className="text-xs text-muted-foreground">Sube una foto o video. Dura 24 horas.</p>
              </div>
            </button>
            <button
              onClick={startLive}
              className="rounded-2xl border bg-card p-5 text-left flex items-center gap-4 hover:bg-accent transition"
            >
              <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <Radio className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Crear en vivo</p>
                <p className="text-xs text-muted-foreground">Graba un video en vivo desde tu cámara.</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'story' && (
          <>
            <div className="flex-1 overflow-hidden bg-background/95 mx-4 rounded-2xl relative flex items-center justify-center">
              {preview ? (
                preview.type === 'image' ? (
                  <img src={preview.url} alt="preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <video src={preview.url} className="max-h-full max-w-full" autoPlay loop muted playsInline />
                )
              ) : (
                <div className="flex flex-col items-center gap-3 text-primary-foreground/80 px-6 text-center">
                  <Camera className="h-12 w-12" />
                  <p className="text-sm">Sube una foto o video para tu historia</p>
                  <p className="text-xs text-primary-foreground/50">Desaparecerá automáticamente en 24 horas</p>
                </div>
              )}
              {preview && (
                <button
                  onClick={() => setPreview(null)}
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/60 text-primary-foreground flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />

            <div className="p-4 flex gap-2">
              {!preview ? (
                <>
                  <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" /> Foto
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
                    <Video className="h-4 w-4 mr-2" /> Video
                  </Button>
                </>
              ) : (
                <Button className="flex-1" onClick={handlePublish}>
                  <Check className="h-4 w-4 mr-2" /> Publicar historia
                </Button>
              )}
            </div>
          </>
        )}

        {mode === 'live' && (
          <>
            <div className="flex-1 overflow-hidden bg-background mx-4 rounded-2xl relative flex items-center justify-center">
              {preview ? (
                <video src={preview.url} className="max-h-full max-w-full" autoPlay loop playsInline controls />
              ) : (
                <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
              )}

              {!preview && (
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-bold text-primary-foreground flex items-center gap-1 ${isRecording ? 'bg-red-600' : 'bg-background/60'}`}>
                    <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                    {isRecording ? `EN VIVO ${fmt(elapsed)}` : 'LISTO'}
                  </span>
                </div>
              )}

              {preview && (
                <button
                  onClick={() => { setPreview(null); startLive(); }}
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/60 text-primary-foreground flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="p-4 flex items-center justify-center gap-3">
              {!preview ? (
                <button
                  onClick={toggleRecord}
                  className="h-16 w-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center bg-red-600 hover:bg-red-700 transition"
                  aria-label={isRecording ? 'Detener' : 'Grabar'}
                >
                  {isRecording ? <Square className="h-6 w-6 text-primary-foreground fill-white" /> : <Circle className="h-8 w-8 text-primary-foreground fill-white" />}
                </button>
              ) : (
                <Button className="flex-1" onClick={handlePublish}>
                  <Check className="h-4 w-4 mr-2" /> Publicar en vivo
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AddStorySheet;