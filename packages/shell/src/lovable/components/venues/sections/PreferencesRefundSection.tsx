import { Label } from '@lovable/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@lovable/components/ui/radio-group';
import { Checkbox } from '@lovable/components/ui/checkbox';
import { Rocket, ClipboardCheck, RotateCcw } from 'lucide-react';
import { cn } from '@lovable/lib/utils';
import { Badge } from '@lovable/components/ui/badge';
import { REFUND_POLICIES } from '@lovable/data/servicesData';
import { usePlaceForm } from '@lovable/components/places/placeFormContext';

const PreferencesRefundSection = () => {
  const { form, update, mode } = usePlaceForm();

  return (
    <div className="divide-y divide-border space-y-6">
      <div className="flex items-center gap-2 pb-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20">
          <RotateCcw className="h-5 w-5 text-primary" />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-foreground">Preferencias y reembolsos</h2>
          <p className="text-xs text-muted-foreground">Configura reservas y política de devolución</p>
        </div>
      </div>
      <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-5 shadow-sm">
        <div className="form-section">
          <Label className="form-label">Preferencias en las reservas</Label>
        <p className="form-sublabel text-sm text-muted-foreground">
          Configura cómo quieres recibir y aprobar las reservas
        </p>
        <div className="mt-4 space-y-3">
          <div
            onClick={() => update({ bookingPreference: 'instant' })}
            className={cn(
              'p-4 rounded-xl border-2 cursor-pointer transition-all',
              form.bookingPreference === 'instant' ? 'border-primary bg-card ring-2 ring-primary/20' : 'border-border bg-card',
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">Reserva inmediata</h4>
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">Recomendada</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Los clientes reservan sin esperar tu aprobación.
                </p>
              </div>
            </div>
          </div>
          <div
            onClick={() => update({ bookingPreference: 'approval' })}
            className={cn(
              'p-4 rounded-xl border-2 cursor-pointer transition-all',
              form.bookingPreference === 'approval' ? 'border-primary bg-card ring-2 ring-primary/20' : 'border-border bg-card',
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Aprueba cada reserva</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Revisas las solicitudes antes de confirmar.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-sm">
      <div className="form-section">
        <Label className="form-label">¿Cuándo pueden solicitar reembolsos? *</Label>
        <RadioGroup
          value={form.refundPolicy}
          onValueChange={(refundPolicy) => update({ refundPolicy })}
          className="mt-4 space-y-3"
        >
          {REFUND_POLICIES.map((policy) => (
            <div key={policy} className="flex items-center space-x-3">
              <RadioGroupItem value={policy} id={`refund-${policy}`} />
              <Label htmlFor={`refund-${policy}`} className="font-normal cursor-pointer">{policy}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      </div>

      {mode === 'create' && (
        <div className="flex items-start gap-2 pt-4">
          <Checkbox
            checked={form.acceptedConditions}
            onCheckedChange={(v) => update({ acceptedConditions: Boolean(v) })}
            id="conditions"
          />
          <label htmlFor="conditions" className="text-xs text-muted-foreground">
            Confirmo que la información es correcta y autorizo su publicación en el mapa y en Descubre.
          </label>
        </div>
      )}
    </div>
  );
};

export default PreferencesRefundSection;
