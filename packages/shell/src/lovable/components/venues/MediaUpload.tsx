import { FileUp, ImageIcon, Video, X } from 'lucide-react';
import { usePlaceForm, PlaceMediaPicker } from '@lovable/components/places/placeFormContext';

const MediaUpload = () => {
  const { form, addMedia, removeMedia } = usePlaceForm();

  return (
    <div className="form-section py-4">
      <div className="flex items-center gap-2 mb-1">
        <ImageIcon className="h-5 w-5 text-primary" />
        <label className="block text-sm font-medium text-foreground">
          Material publicitario del lugar
        </label>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Sube fotos o videos para mostrar tu espacio a los organizadores.
      </p>

      {form.media.length === 0 ? (
        <div className="space-y-3">
          <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-secondary/40 py-10 px-4 hover:border-primary hover:bg-primary/5 transition-colors">
            <FileUp className="w-8 h-8 text-primary" />
            <p className="text-sm font-semibold text-foreground">Subir fotos o videos</p>
            <p className="text-xs text-muted-foreground">JPG, PNG o MP4 — máximo 12 archivos</p>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="sr-only"
              onChange={(e) => { addMedia(e.target.files, 'image'); e.target.value = ''; }}
            />
          </label>
          <PlaceMediaPicker />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {form.media.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
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
            {form.media.length < 12 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border hover:border-primary">
                <Video className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] font-semibold">Video</span>
                <input type="file" accept="video/*" multiple className="sr-only" onChange={(e) => addMedia(e.target.files, 'video')} />
              </label>
            )}
          </div>
          <PlaceMediaPicker />
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
