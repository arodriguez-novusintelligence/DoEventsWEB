import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@lovable/components/ui/dialog';
import { Loader2, MapPin } from 'lucide-react';
import EventLocationMap from '@lovable/components/events/EventLocationMap';
import {
  formatGpsLocationLabel,
  getStoredUserLocation,
  reverseGeocodePlace,
} from '@doevents/shared';

interface FeedLocationMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (payload: { lat: number; lng: number; label: string }) => void;
}

const DEFAULT_LAT = 4.711;
const DEFAULT_LNG = -74.0721;

const FeedLocationMapDialog = ({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  onConfirm,
}: FeedLocationMapDialogProps) => {
  const stored = getStoredUserLocation();
  const [lat, setLat] = useState(initialLat ?? stored?.lat ?? DEFAULT_LAT);
  const [lng, setLng] = useState(initialLng ?? stored?.lng ?? DEFAULT_LNG);
  const [previewLabel, setPreviewLabel] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLat(initialLat ?? stored?.lat ?? DEFAULT_LAT);
    setLng(initialLng ?? stored?.lng ?? DEFAULT_LNG);
    setPreviewLabel('');
  }, [open, initialLat, initialLng, stored?.lat, stored?.lng]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setResolving(true);
    reverseGeocodePlace(lat, lng)
      .then((place) => {
        if (cancelled) return;
        setPreviewLabel(
          formatGpsLocationLabel({
            label: place?.label,
            city: place?.city,
            departamento: place?.departamento,
            lat,
            lng,
          }),
        );
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => { cancelled = true; };
  }, [open, lat, lng]);

  const handleConfirm = async () => {
    setResolving(true);
    try {
      const place = await reverseGeocodePlace(lat, lng);
      const label = formatGpsLocationLabel({
        label: place?.label,
        city: place?.city,
        departamento: place?.departamento,
        lat,
        lng,
      });
      onConfirm({ lat, lng, label });
      onOpenChange(false);
    } finally {
      setResolving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Seleccionar en el mapa
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Toca el mapa para marcar la ubicación de tu publicación.
        </p>
        <EventLocationMap lat={lat} lng={lng} onPick={(nextLat, nextLng) => {
          setLat(nextLat);
          setLng(nextLng);
        }} />
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Ubicación seleccionada
          </p>
          <p className="mt-1 text-sm font-medium text-card-foreground">
            {resolving && !previewLabel ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Obteniendo dirección…
              </span>
            ) : (
              previewLabel || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={resolving}
          onClick={() => void handleConfirm()}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Usar esta ubicación
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default FeedLocationMapDialog;
