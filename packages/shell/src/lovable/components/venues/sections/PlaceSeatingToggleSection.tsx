import { Grid3X3 } from 'lucide-react';
import { Label } from '@lovable/components/ui/label';
import { Switch } from '@lovable/components/ui/switch';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';
import { PlaceSeatingMapSection } from '../../../../components/places/PlaceSeatingMapSection';

const PlaceSeatingToggleSection = () => {
  const { form, update } = usePlaceForm();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <Label className="mb-0 text-sm font-semibold text-foreground">Mapa de silletería</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ¿Tu lugar cuenta con distribución de asientos/mesas?
              </p>
            </div>
          </div>
          <Switch
            checked={form.hasSeating}
            onCheckedChange={(hasSeating) => update({ hasSeating })}
          />
        </div>
      </div>

      {form.hasSeating && (
        <div className="animate-fade-in">
          <PlaceSeatingMapSection
            placeName={form.name}
            floors={form.floors}
            gates={form.gates}
            capacity={form.capacity}
            onFloorsChange={(floors) => update({ floors })}
            onGatesChange={(gates) => update({ gates })}
          />
        </div>
      )}
    </div>
  );
};

export default PlaceSeatingToggleSection;
