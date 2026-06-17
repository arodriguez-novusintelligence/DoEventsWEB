import { useState } from 'react';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import CalendarPlanner from '@lovable/components/services/CalendarPlanner';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';
import { Button } from '@lovable/components/ui/button';
import { Switch } from '@lovable/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@lovable/components/ui/select';
import { newWizardId } from '@doevents/shared';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';

const CHARGE_UNITS = ['evento', 'día', 'hora', 'persona', 'servicio'] as const;

const PlaceCalendarSection = () => {
  const { form, update } = usePlaceForm();
  const [addonsEnabled, setAddonsEnabled] = useState(form.addonServices.length > 0);

  const addAddon = () => {
    update({
      addonServices: [
        ...form.addonServices,
        {
          id: newWizardId(),
          name: '',
          description: '',
          price: 0,
          unit: 'evento',
        },
      ],
    });
    setAddonsEnabled(true);
  };

  const updateAddon = (id: string, patch: Partial<typeof form.addonServices[0]>) => {
    update({
      addonServices: form.addonServices.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const removeAddon = (id: string) => {
    const next = form.addonServices.filter((s) => s.id !== id);
    update({ addonServices: next });
    if (!next.length) setAddonsEnabled(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Precios de alquiler *</Label>
        <p className="text-xs text-muted-foreground">
          Define tarifas base. En el calendario podrás marcar días bloqueados o con precios especiales.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Por día *" value={form.pricing.perDay} onChange={(e) => update({ pricing: { ...form.pricing, perDay: e.target.value } })} />
          <Input placeholder="Varios días" value={form.pricing.perMultiDay} onChange={(e) => update({ pricing: { ...form.pricing, perMultiDay: e.target.value } })} />
          <Input placeholder="Por semana" value={form.pricing.perWeek} onChange={(e) => update({ pricing: { ...form.pricing, perWeek: e.target.value } })} />
          <Input placeholder="Por mes" value={form.pricing.perMonth} onChange={(e) => update({ pricing: { ...form.pricing, perMonth: e.target.value } })} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Disponibilidad y calendario *</Label>
        <CalendarPlanner
          selectedDates={form.selectedDates}
          onDatesChange={(dates) => update({ selectedDates: dates })}
          blockedDates={form.blockedDates}
          onBlockedDatesChange={(dates) => update({ blockedDates: dates })}
          startTime={form.globalStartTime}
          endTime={form.globalEndTime}
          onStartTimeChange={(t) => update({ globalStartTime: t })}
          onEndTimeChange={(t) => update({ globalEndTime: t })}
          basePriceCost={form.pricing.perDay}
          basePriceCurrency={form.pricing.currency}
        />
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Servicios adicionales con costo
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Opcional: solo si quieres ofrecer extras contratables al reservar.
            </p>
          </div>
          <Switch
            checked={addonsEnabled}
            onCheckedChange={(on) => {
              setAddonsEnabled(on);
              if (!on) update({ addonServices: [] });
              else if (!form.addonServices.length) addAddon();
            }}
          />
        </div>

        {addonsEnabled && (
          <div className="space-y-3">
            {form.addonServices.map((service) => (
              <div key={service.id} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_120px_100px_auto]">
                <Input
                  placeholder="Nombre del servicio"
                  value={service.name}
                  onChange={(e) => updateAddon(service.id, { name: e.target.value })}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Precio"
                  value={service.price || ''}
                  onChange={(e) => updateAddon(service.id, { price: Number(e.target.value) || 0 })}
                />
                <Select
                  value={service.unit}
                  onValueChange={(unit) => updateAddon(service.id, { unit: unit as typeof service.unit })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHARGE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAddon(service.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" className="w-full border-dashed" onClick={addAddon}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar servicio adicional
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCalendarSection;
