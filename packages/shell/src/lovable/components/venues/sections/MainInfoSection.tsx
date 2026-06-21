import { useState } from 'react';
import { Minus, Plus, Users, X, ParkingCircle, FileText } from 'lucide-react';
import { Input } from '@lovable/components/ui/input';
import { Textarea } from '@lovable/components/ui/textarea';
import { Label } from '@lovable/components/ui/label';
import { Checkbox } from '@lovable/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@lovable/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lovable/components/ui/select';
import MediaUpload from '../MediaUpload';
import FacilitiesPicker from '../FacilitiesPicker';
import EventsPicker from '../EventsPicker';
import { accesibilidad, seguridad } from '@lovable/data/venueOptions';
import { PLACE_TYPES } from '@lovable/data/placeData';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';

const SelectWithExtras = ({
  options, selected, onChange, placeholder, addAnotherLabel,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addAnotherLabel: string;
}) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = addAnotherLabel;

  return (
    <div>
      <Select value="" onValueChange={(v) => { if (v && !selected.includes(v)) onChange([...selected, v]); }}>
        <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0 shadow-none">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] bg-popover">
          {options.filter((o) => !selected.includes(o)).map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full">
              {item}
              <button type="button" onClick={() => onChange(selected.filter((i) => i !== item))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-end mt-2">
        {customOpen ? (
          <div className="flex gap-2 w-full">
            <Input
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={addAnotherLabel}
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const v = customValue.trim();
                  if (v && !selected.includes(v)) onChange([...selected, v]);
                  setCustomValue('');
                  setCustomOpen(false);
                }
              }}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setCustomOpen(true)} className="text-sm text-primary font-medium hover:underline">
            {addAnotherLabel} <Plus className="w-3.5 h-3.5 inline" />
          </button>
        )}
      </div>
    </div>
  );
};

const MainInfoSection = () => {
  const { form, update } = usePlaceForm();
  const capacity = Number(form.capacity) || 0;
  const MAX_DESC = 500;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-foreground">Información principal</h2>
          <p className="text-xs text-muted-foreground">Datos básicos del lugar que verán los organizadores</p>
        </div>
      </div>
      <div className="rounded-2xl bg-card border border-border shadow-sm p-4 space-y-6">
      <MediaUpload />

      <div>
        <Label className="text-sm font-medium">Nombre del lugar *</Label>
        <Input
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Ej: Salón Las Palmas"
          className="border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none mt-1"
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Tipo de lugar *</Label>
        <Select
          value={form.placeType || ''}
          onValueChange={(v) => update({ placeType: v })}
        >
          <SelectTrigger className="border-0 border-b rounded-none px-0 focus:ring-0 shadow-none mt-1">
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
        <Label className="text-sm font-medium">¿El lugar tiene silletería asignada?</Label>
        <RadioGroup
          value={form.hasSeating ? 'yes' : 'no'}
          onValueChange={(v) => update({ hasSeating: v === 'yes' })}
          className="flex gap-4 mt-2"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="seat-yes" />
            <label htmlFor="seat-yes" className="text-sm">Sí (teatro, estadio…)</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="seat-no" />
            <label htmlFor="seat-no" className="text-sm">No</label>
          </div>
        </RadioGroup>
      </div>

      {!form.hasSeating && (
        <div>
          <Label className="text-sm font-medium">Aforo del lugar</Label>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm">Número de personas</span>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => update({ capacity: String(Math.max(1, capacity - 1)) })} className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center hover:bg-primary/5">
                <Minus className="w-4 h-4 text-primary" />
              </button>
              <span className="w-8 text-center font-bold text-primary">{capacity}</span>
              <button type="button" onClick={() => update({ capacity: String(capacity + 1) })} className="w-8 h-8 rounded-full border border-primary bg-primary text-primary-foreground flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
        <Checkbox checked={form.hasParking} onCheckedChange={(v) => update({ hasParking: Boolean(v) })} id="parking" />
        <label htmlFor="parking" className="flex items-center gap-2 text-sm">
          <ParkingCircle className="h-4 w-4 text-primary" />
          Incluye parqueadero
        </label>
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
        <Label className="text-sm font-medium">Accesibilidad</Label>
        <div className="mt-1">
          <SelectWithExtras
            options={accesibilidad}
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
          <SelectWithExtras
            options={seguridad}
            selected={form.security}
            onChange={(security) => update({ security })}
            placeholder="Selecciona una opción de seguridad"
            addAnotherLabel="Agregar otra opción"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">¿Eres dueño/administrador del lugar?</Label>
        <div className="flex gap-6 mt-3">
          {(['dueno', 'admin'] as const).map((rol) => (
            <label key={rol} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rol"
                checked={form.hostRole === rol}
                onChange={() => update({ hostRole: rol })}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm">{rol === 'dueno' ? 'Dueño' : 'Administrador'}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Descripción y condiciones del lugar</Label>
        <Textarea
          value={form.description}
          onChange={(e) => update({ description: e.target.value.slice(0, MAX_DESC) })}
          placeholder="Describe tu espacio con las características principales..."
          rows={4}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">{form.description.length}/{MAX_DESC}</p>
      </div>
      </div>
    </div>
  );
};

export default MainInfoSection;
