import { useState } from 'react';
import { Button } from '@lovable/components/ui/button';import { MapPinPlus, Crosshair, MapPin } from 'lucide-react';
import { toast } from '@lovable/components/ui/sonner';
import { resolveDisplayLocation, resolveManualUserLocation, resolveUserLocation, PlaceAutocompleteInput, type GeocodedPlace } from '@doevents/shared';
import type { ServiceFormData } from '@lovable/data/servicesData';
import FeedLocationMapDialog from '@lovable/components/feed/FeedLocationMapDialog';

const underlineInput =
  'border-0 border-b border-border rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary bg-transparent';

interface ServiceLocationSectionProps {
  formData: ServiceFormData;
  updateForm: (partial: Partial<ServiceFormData>) => void;
}

const ServiceLocationSection = ({ formData, updateForm }: ServiceLocationSectionProps) => {
  const [showMap, setShowMap] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const lat = Number(formData.latitude);
  const lng = Number(formData.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    : null;

  const applyLocation = (loc: {
    lat: number;
    lng: number;
    city?: string;
    departamento?: string;
    label?: string;
  }, fallbackLabel?: string) => {
    const locationLabel = resolveDisplayLocation({
      label: loc.label,
      locationLabel: loc.label,
      ciudad: loc.city,
      departamento: loc.departamento,
    });
    updateForm({
      latitude: loc.lat,
      longitude: loc.lng,
      locationCity: loc.city || formData.locationCity,
      locationLabel: locationLabel !== '—'
        ? locationLabel
        : fallbackLabel || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
    });
  };

  const useDeviceLocation = async () => {
    setLocating(true);
    try {
      const loc = await resolveUserLocation({ prompt: true, force: true });
      if (!loc) {
        toast.error('No se pudo obtener tu ubicación');
        return;
      }
      applyLocation(loc);
      toast.success('Ubicación del dispositivo aplicada');
    } finally {
      setLocating(false);
    }
  };

  const searchLocation = async () => {
    const query = [formData.locationLabel, formData.locationCity].filter(Boolean).join(', ');
    if (!query.trim()) {
      toast.error('Escribe ciudad o dirección para buscar en el mapa');
      return;
    }
    setLocating(true);
    try {
      const loc = await resolveManualUserLocation(query);
      if (!loc) {
        toast.error('No encontramos esa ubicación');
        return;
      }
      applyLocation(loc, query);
      toast.success('Ubicación encontrada');
    } finally {
      setLocating(false);
    }
  };

  const applyPlace = (place: GeocodedPlace, mode: 'address' | 'city') => {
    const locationLabel = resolveDisplayLocation({
      label: place.label,
      locationLabel: place.label,
      ciudad: place.city,
      departamento: place.departamento,
    });
    updateForm({
      latitude: place.lat,
      longitude: place.lng,
      locationCity: place.city || formData.locationCity,
      locationLabel: mode === 'address'
        ? (place.street || place.label)
        : (formData.locationLabel || locationLabel),
      ...(mode === 'city' ? { locationCity: place.city || place.label.split(',')[0]?.trim() || place.label } : {}),
    });
  };

  return (
    <div className="min-w-0 space-y-5 rounded-2xl border border-border bg-secondary/30 p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">
        Indica dónde prestas el servicio. Es obligatorio para publicar y aparecer en el mapa.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="sm" disabled={locating} onClick={() => void useDeviceLocation()}>
          <Crosshair className="mr-2 h-4 w-4" />
          Usar mi ubicación
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={locating} onClick={() => void searchLocation()}>
          <MapPin className="mr-2 h-4 w-4" />
          Buscar en mapa
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setMapPickerOpen(true)}>
          <MapPinPlus className="mr-2 h-4 w-4" />
          Ajustar en mapa
        </Button>
        {hasCoords && (
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center justify-center gap-1.5 text-primary font-medium text-sm"
          >
            {showMap ? 'Ocultar mapa' : 'Consultar mapa'}
            <MapPinPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {showMap && mapSrc && (
        <div className="space-y-2 animate-fade-in">
          <div className="rounded-xl overflow-hidden border border-border aspect-video">
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              title="Ubicación del servicio"
              className="w-full h-full"
            />
          </div>
          {formData.locationLabel && (
            <p className="text-center text-sm text-muted-foreground">{formData.locationLabel}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-sm text-foreground">Dirección o referencia</p>
        <PlaceAutocompleteInput
          value={formData.locationLabel || ''}
          onChange={(v) => updateForm({ locationLabel: v })}
          onPlaceSelect={(place) => applyPlace(place, 'address')}
          placeholder="Ej: Calle 48c #97-45, local 201"
          inputClassName={underlineInput}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">Ciudad *</p>
        <PlaceAutocompleteInput
          value={formData.locationCity || ''}
          onChange={(v) => updateForm({ locationCity: v })}
          onPlaceSelect={(place) => applyPlace(place, 'city')}
          placeholder="Ej: Bogotá, Puerto Gaitán…"
          inputClassName={underlineInput}
        />
      </div>

      {hasCoords && (
        <p className="text-xs text-muted-foreground">
          Coordenadas: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}

      <FeedLocationMapDialog
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialLat={hasCoords ? lat : undefined}
        initialLng={hasCoords ? lng : undefined}
        onConfirm={({ lat, lng, label }) => {
          applyLocation({
            lat,
            lng,
            label: label || formData.locationLabel,
            city: formData.locationCity,
          }, label);
          toast.success('Ubicación actualizada en el mapa');
        }}
      />
    </div>
  );
};

export default ServiceLocationSection;
