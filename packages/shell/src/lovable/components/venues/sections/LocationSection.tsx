import { useState } from 'react';
import { Input } from '@lovable/components/ui/input';
import { Textarea } from '@lovable/components/ui/textarea';
import { Button } from '@lovable/components/ui/button';
import { MapPinPlus, Crosshair, MapPin, Loader2 } from 'lucide-react';
import { PlaceSeatingMapSection } from '../../../../components/places/PlaceSeatingMapSection';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';

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
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-foreground">Ubicación del lugar</h3>
          <p className="text-xs text-muted-foreground">Dirección, mapa y referencias para visitantes</p>
        </div>
      </div>
      <div className="rounded-2xl bg-card border border-border shadow-sm p-4 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={locating} onClick={() => void useDeviceLocation()}>
            {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
            {locating ? 'Obteniendo ubicación…' : 'Usar mi ubicación'}
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-full" disabled={locating} onClick={() => void searchLocation()}>
            <MapPin className="mr-2 h-4 w-4" />
            Buscar en mapa
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
          <div className="space-y-2 animate-fade-in relative">
            {locating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <div className="rounded-xl overflow-hidden border border-border aspect-video shadow-sm">
              <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Ubicación del lugar" className="w-full h-full" />
            </div>
            {form.locationLabel && (
              <p className="text-center text-sm text-muted-foreground">{form.locationLabel}</p>
            )}
          </div>
        )}

        {!hasCoords && !locating && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-secondary/40 shadow-sm py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Sin ubicación en el mapa</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Usa «Usar mi ubicación» o «Buscar en mapa» para fijar las coordenadas.
            </p>
          </div>
        )}

        <Field label="Dirección del lugar">
          <Input value={form.address} onChange={(e) => update({ address: e.target.value })} placeholder="Ej: Calle 48c #97-45" className={underlineInput} />
        </Field>

        <Field label="Barrio">
          <Input value={form.neighborhood} onChange={(e) => update({ neighborhood: e.target.value })} placeholder="Ej: Chapinero" className={underlineInput} />
        </Field>

        <Field label="Ciudad *">
          <Input value={form.city} onChange={(e) => update({ city: e.target.value })} placeholder="Ej: Bogotá" className={underlineInput} />
        </Field>

        <Field label="Departamento">
          <Input value={form.department} onChange={(e) => update({ department: e.target.value })} placeholder="Ej: Cundinamarca" className={underlineInput} />
        </Field>

        <Field label="Cómo llegar">
          <Input value={form.directions} onChange={(e) => update({ directions: e.target.value })} placeholder="Indicaciones para visitantes" className={underlineInput} />
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

      {form.hasSeating && (
        <PlaceSeatingMapSection
          placeName={form.name}
          floors={form.floors}
          gates={form.gates}
          capacity={form.capacity}
          onFloorsChange={(floors) => update({ floors })}
          onGatesChange={(gates) => update({ gates })}
        />
      )}
    </div>
  );
};

export default LocationSection;
