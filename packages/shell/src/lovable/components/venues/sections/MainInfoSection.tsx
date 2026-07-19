import { Minus, Plus, Users, ParkingCircle } from 'lucide-react';
import { Input } from '@lovable/components/ui/input';
import { Textarea } from '@lovable/components/ui/textarea';
import { Label } from '@lovable/components/ui/label';
import { Checkbox } from '@lovable/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lovable/components/ui/select';
import MediaUpload from '../MediaUpload';
import FacilitiesPicker from '../FacilitiesPicker';
import EventsPicker from '../EventsPicker';
import VenueSelectWithExtras from '../VenueSelectWithExtras';
import {
  VENUE_INCLUDED_SERVICE_CATALOG,
  VENUE_ACCESSIBILITY_CATALOG,
  VENUE_SECURITY_CATALOG,
} from '@lovable/data/venueCatalogOptions';
import { PLACE_TYPES } from '@lovable/data/placeData';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';

const MainInfoSection = () => {
  const { form, update } = usePlaceForm();
  const capacity = Number(form.capacity) || 0;
  const MAX_DESC = 500;

  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Información básica</h3>
          <p className="text-xs text-muted-foreground">
            Material publicitario, nombre, tipo y aforo del lugar.
          </p>
        </div>

        <MediaUpload />

        <div>
          <Label className="text-sm font-medium">Nombre del lugar *</Label>
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ej: Salón Las Palmas"
            className="mt-1 rounded-none border-0 border-b px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Tipo de lugar *</Label>
          <Select value={form.placeType || ''} onValueChange={(v) => update({ placeType: v })}>
            <SelectTrigger className="mt-1 rounded-none border-0 border-b px-0 shadow-none focus:ring-0">
              <SelectValue placeholder="Selecciona el tipo de lugar" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-popover">
              {PLACE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.placeType === 'Otro' && (
            <Input
              className="mt-2"
              placeholder="¿Qué tipo de lugar es?"
              value={form.placeTypeOther}
              onChange={(e) => update({ placeTypeOther: e.target.value })}
            />
          )}
        </div>

        <div>
          <Label className="text-sm font-medium">Aforo del lugar *</Label>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5 shrink-0 text-primary" />
              <span className="truncate text-sm">Número de personas</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => update({ capacity: String(Math.max(1, capacity - 1)) })}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={999999}
                value={form.capacity}
                onChange={(e) => update({ capacity: e.target.value.replace(/\D/g, '') || '' })}
                onBlur={() => {
                  const n = Number(form.capacity);
                  if (!Number.isFinite(n) || n < 1) update({ capacity: '1' });
                }}
                className="h-10 w-20 text-center font-medium"
              />
              <button
                type="button"
                onClick={() => update({ capacity: String(Math.max(1, capacity + 1)) })}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
          <Checkbox checked={form.hasParking} onCheckedChange={(v) => update({ hasParking: Boolean(v) })} id="parking" />
          <label htmlFor="parking" className="flex items-center gap-2 text-sm">
            <ParkingCircle className="h-4 w-4 text-primary" />
            Incluye parqueadero
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Servicios y facilidades</h3>
          <p className="text-xs text-muted-foreground">
            Detalle lo que ofrece el lugar y para qué eventos está disponible.
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">Servicios y facilidades del lugar</Label>
          <div className="mt-2">
            <FacilitiesPicker selected={form.facilities} onChange={(facilities) => update({ facilities })} />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Eventos que se pueden realizar en el lugar</Label>
          <div className="mt-2">
            <EventsPicker selected={form.allowedEventTypes} onChange={(allowedEventTypes) => update({ allowedEventTypes })} />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Servicios adicionales con costo</Label>
          <div className="mt-1">
            <VenueSelectWithExtras
              catalog={VENUE_INCLUDED_SERVICE_CATALOG}
              selected={form.includedServices}
              onChange={(includedServices) => update({ includedServices })}
              placeholder="Selecciona el servicio"
              addAnotherLabel="Agregar otro servicio"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Accesibilidad</Label>
          <div className="mt-1">
            <VenueSelectWithExtras
              catalog={VENUE_ACCESSIBILITY_CATALOG}
              selected={form.accessibility}
              onChange={(accessibility) => update({ accessibility })}
              placeholder="Selecciona una opción"
              addAnotherLabel="Agregar otra opción"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Seguridad</Label>
          <div className="mt-1">
            <VenueSelectWithExtras
              catalog={VENUE_SECURITY_CATALOG}
              selected={form.security}
              onChange={(security) => update({ security })}
              placeholder="Selecciona una opción de seguridad"
              addAnotherLabel="Agregar otra opción"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Administración y descripción</h3>
          <p className="text-xs text-muted-foreground">
            Indica tu relación con el lugar y añade condiciones importantes.
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">¿Eres dueño/administrador del lugar?</Label>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {(['dueno', 'admin'] as const).map((rol) => (
              <label key={rol} className="flex min-w-0 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="rol"
                  checked={form.hostRole === rol}
                  onChange={() => update({ hostRole: rol })}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span className="truncate text-sm">{rol === 'dueno' ? 'Dueño' : 'Administrador'}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">
            Descripción y condiciones del lugar{' '}
            <span className="font-normal text-muted-foreground">(Opcional)</span>
          </Label>
          <Textarea
            value={form.description}
            onChange={(e) => update({ description: e.target.value.slice(0, MAX_DESC) })}
            placeholder="Describe tu espacio con las características principales..."
            rows={3}
            className="mt-1 resize-none rounded-none border-0 border-b px-0 shadow-none focus-visible:ring-0"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.description.length}/{MAX_DESC} caracteres
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainInfoSection;
