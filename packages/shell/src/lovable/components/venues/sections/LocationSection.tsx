import { useState } from 'react';
import { Textarea } from '@lovable/components/ui/textarea';
import { Button } from '@lovable/components/ui/button';
import { MapPinPlus, Crosshair, MapPin } from 'lucide-react';
import PlaceSeatingToggleSection from './PlaceSeatingToggleSection';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';
import { PlaceAutocompleteInput, type GeocodedPlace } from '@doevents/shared';
import FeedLocationMapDialog from '@lovable/components/feed/FeedLocationMapDialog';

const underlineInput =
  'border-0 border-b border-border rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary bg-transparent';

const Field = ({ label, children, bold = false }: { label: string; children: React.ReactNode; bold?: boolean }) => (
  <div className="space-y-1.5">
    <p className={`text-sm ${bold ? 'font-semibold text-foreground' : 'text-foreground'}`}>{label}</p>
    {children}
  </div>
);

const LocationSection = () => {
  const {
    form, update, locating, useDeviceLocation, searchLocation,
  } = usePlaceForm();
  const [showMap, setShowMap] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    : null;

  const applyPlace = (place: GeocodedPlace, mode: 'address' | 'city') => {
    update({
      latitude: String(place.lat),
      longitude: String(place.lng),
      city: place.city || form.city,
      department: place.departamento || form.department,
      address: mode === 'address'
        ? (place.street?.trim() || place.label.split(',')[0]?.trim() || place.label)
        : form.address,
      locationLabel: place.label,
      ...(mode === 'city' ? { city: place.city || place.label.split(',')[0]?.trim() || place.label } : {}),
    });
  };

  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-5 rounded-2xl border border-border bg-secondary/30 p-3 sm:p-4">
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
              <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Ubicación del lugar" className="w-full h-full" />
            </div>
            {form.locationLabel && (
              <p className="text-center text-sm text-muted-foreground">{form.locationLabel}</p>
            )}
          </div>
        )}

        <Field label="Dirección del lugar">
          <PlaceAutocompleteInput
            value={form.address}
            onChange={(v) => update({ address: v })}
            onPlaceSelect={(place) => applyPlace(place, 'address')}
            placeholder="Ej: Calle 48c #97-45"
            inputClassName={underlineInput}
          />
        </Field>

        <Field label="Barrio">
          <PlaceAutocompleteInput
            value={form.neighborhood}
            onChange={(v) => update({ neighborhood: v })}
            placeholder="Ej: Chapinero"
            inputClassName={underlineInput}
          />
        </Field>

        <Field label="Ciudad *">
          <PlaceAutocompleteInput
            value={form.city}
            onChange={(v) => update({ city: v })}
            onPlaceSelect={(place) => applyPlace(place, 'city')}
            placeholder="Ej: Bogotá, Puerto Gaitán…"
            inputClassName={underlineInput}
          />
        </Field>

        <Field label="Departamento">
          <PlaceAutocompleteInput
            value={form.department}
            onChange={(v) => update({ department: v })}
            onPlaceSelect={(place) => {
              if (place.departamento) {
                update({
                  department: place.departamento,
                  latitude: String(place.lat),
                  longitude: String(place.lng),
                  city: place.city || form.city,
                });
              }
            }}
            placeholder="Ej: Cundinamarca"
            inputClassName={underlineInput}
          />
        </Field>

        <Field label="Cómo llegar">
          <PlaceAutocompleteInput
            value={form.directions}
            onChange={(v) => update({ directions: v })}
            placeholder="Indicaciones para visitantes"
            inputClassName={underlineInput}
          />
        </Field>

        <Field label="Referencias o puntos cercanos" bold>
          <Textarea
            value={form.nearbyReferencesText}
            onChange={(e) => update({ nearbyReferencesText: e.target.value })}
            placeholder="Una por línea: Nombre | Tipo | Distancia"
            className={`${underlineInput} min-h-[80px] resize-none py-2`}
          />
        </Field>
      </div>

      <PlaceSeatingToggleSection />

      <FeedLocationMapDialog
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialLat={hasCoords ? lat : undefined}
        initialLng={hasCoords ? lng : undefined}
        onConfirm={({ lat: nextLat, lng: nextLng, label }) => {
          update({
            latitude: String(nextLat),
            longitude: String(nextLng),
            locationLabel: label || form.locationLabel,
            address: form.address || label,
          });
        }}
      />
    </div>
  );
};

export default LocationSection;
