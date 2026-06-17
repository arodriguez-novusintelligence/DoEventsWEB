import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  TextField,
  createStory,
  resolveDisplayLocation,
  updateStoryLivePlayback,
  uploadMediaFile,
  useToast,
} from '@doevents/shared';

import { getStoredUserLocation } from '@doevents/shared';

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



export const CreateStorySheet: React.FC<CreateStorySheetProps> = ({ open, onClose, onCreated }) => {

  const { showToast } = useToast();

  const [mode, setMode] = useState<StoryMode>('image');

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

    }

    return () => {

      stopLiveStream();

    };

  }, [open, stopLiveStream]);



  if (!open) return null;



  const reset = () => {

    setDescription('');

    setMediaIds([]);

    setMediaPreview(null);

    setMode('image');

    setMediaKind('image');

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



  return (

    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">

      <div className="de-sheet de-sheet--story" onClick={(e) => e.stopPropagation()}>

        <header className="de-sheet__header">

          <h2>{mode === 'live' && liveActive ? 'En vivo' : 'Nueva historia'}</h2>

          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>

        </header>

        <div className="de-sheet__body de-form-stack">

          <div className="de-story-mode-tabs">

            {([

              ['image', 'Imagen'],

              ['video', 'Video'],

              ['text', 'Estado'],

              ['live', 'En vivo'],

            ] as const).map(([id, label]) => (

              <button

                key={id}

                type="button"

                className={`de-story-mode-tab${mode === id ? ' de-story-mode-tab--active' : ''}`}

                onClick={() => {

                  if (liveActive && id !== 'live') return;

                  setMode(id);

                }}

                disabled={liveActive && id !== 'live'}

              >

                {label}

              </button>

            ))}

          </div>



          {mode === 'live' && (

            <div className="de-story-live-preview">

              <video ref={videoPreviewRef} className="de-story-preview__media" playsInline muted autoPlay />

              {liveActive && <span className="de-feed-stories__badge de-story-live-preview__badge">Live</span>}

            </div>

          )}



          {(mode === 'image' || mode === 'video') && (

            <label className="de-form-file">

              <span>

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

              />

            </label>

          )}



          {mediaPreview && mode !== 'live' && (

            <div className="de-story-preview">

              {mediaKind === 'video' ? (

                <video src={mediaPreview} controls className="de-story-preview__media" />

              ) : (

                <img src={mediaPreview} alt="" className="de-story-preview__media" />

              )}

            </div>

          )}



          <TextField

            label={mode === 'text' ? 'Tu estado' : 'Descripción (opcional)'}

            value={description}

            onChange={(e) => setDescription(e.target.value)}

            variant="bordered"

            placeholder={mode === 'text' ? '¿Qué estás haciendo?' : mode === 'live' ? '¿Qué estás transmitiendo?' : 'Añade contexto…'}

          />



          {mode === 'live' && (

            <p className="de-story-live-hint">

              {liveActive

                ? 'Tu transmisión se actualiza cada pocos segundos para quienes te siguen.'

                : 'Comparte conciertos y eventos multitudinarios en directo desde tu cámara.'}

            </p>

          )}



          <Button

            label={

              submitting

                ? 'Procesando…'

                : mode === 'live'

                  ? liveActive

                    ? 'Finalizar transmisión'

                    : 'Iniciar transmisión en vivo'

                  : 'Compartir historia'

            }

            onClick={handleSubmit}

            disabled={submitting || uploading || (mode === 'live' && liveActive && !livePublicationId)}

          />

        </div>

      </div>

    </div>

  );

};



export default CreateStorySheet;

