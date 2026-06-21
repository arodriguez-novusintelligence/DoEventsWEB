import { FileUp, ImageIcon, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaceForm, PlaceMediaPicker } from '@lovable/components/places/placeFormContext';

const MAX_MEDIA = 12;

const MediaUpload = () => {
  const { form, addMedia, removeMedia } = usePlaceForm();

  const handleAddMedia = (files: FileList | null, kind: 'image' | 'video') => {
    if (!files?.length) return;
    const remaining = MAX_MEDIA - form.media.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_MEDIA} archivos permitidos`);
      return;
    }
    if (files.length > remaining) {
      toast.info(`Solo se agregarán ${remaining} archivo(s) — límite de ${MAX_MEDIA}`);
    }
    addMedia(files, kind);
  };

  return (
    <div className="form-section py-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <label className="block text-sm font-medium text-foreground">
          Material publicitario del lugar
        </label>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Sube fotos o videos para mostrar tu espacio a los organizadores ({form.media.length}/{MAX_MEDIA}).
      </p>

      {form.media.length === 0 ? (
        <div className="space-y-3">
          <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/40 py-10 px-4 hover:border-primary hover:bg-primary/5 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <FileUp className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Subir fotos o videos</p>
            <p className="text-xs text-muted-foreground">JPG, PNG o MP4 — máximo {MAX_MEDIA} archivos</p>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="sr-only"
              onChange={(e) => { handleAddMedia(e.target.files, 'image'); e.target.value = ''; }}
            />
          </label>
          <PlaceMediaPicker />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {form.media.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted shadow-sm ring-1 ring-border/40">
                {item.kind === 'video' ? (
                  <video src={item.preview} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {form.media.length < MAX_MEDIA && (
              <>
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border hover:border-primary">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold">Foto</span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { handleAddMedia(e.target.files, 'image'); e.target.value = ''; }} />
                </label>
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border hover:border-primary">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold">Video</span>
                  <input type="file" accept="video/*" multiple className="sr-only" onChange={(e) => { handleAddMedia(e.target.files, 'video'); e.target.value = ''; }} />
                </label>
              </>
            )}
          </div>
          <PlaceMediaPicker />
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
