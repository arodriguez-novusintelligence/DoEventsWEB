import { Label } from '@lovable/components/ui/label';

import { RadioGroup, RadioGroupItem } from '@lovable/components/ui/radio-group';

import { Checkbox } from '@lovable/components/ui/checkbox';

import { Rocket, ClipboardCheck } from 'lucide-react';

import { cn } from '@lovable/lib/utils';

import { Badge } from '@lovable/components/ui/badge';

import { REFUND_POLICIES } from '@lovable/data/servicesData';

import { usePlaceForm } from '@lovable/components/places/placeFormContext';



const PreferencesRefundSection = () => {

  const { form, update, mode } = usePlaceForm();



  return (

    <div className="min-w-0 divide-y divide-border space-y-6">

      <div className="form-section pb-6">

        <Label className="form-label">Preferencias en las reservas</Label>

        <p className="form-sublabel text-sm text-muted-foreground">

          Configura cómo quieres recibir y aprobar las reservas

        </p>

        <div className="mt-4 space-y-3">

          <div

            onClick={() => update({ bookingPreference: 'instant' })}

            className={cn(

              'cursor-pointer rounded-xl border-2 p-4 transition-all',

              form.bookingPreference === 'instant' ? 'border-primary bg-card' : 'border-border bg-card hover:border-muted-foreground/50',

            )}

          >

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">

                <Rocket className="h-5 w-5 text-primary" />

              </div>

              <div className="flex-1">

                <h4 className="font-semibold text-foreground">Activa la Reserva inmediata</h4>

                <p className="mt-1 text-sm text-muted-foreground">

                  Permite que tus clientes reserven automáticamente, esto puede ayudarte a conseguir mas reservas.

                </p>

              </div>

            </div>

          </div>

          <div

            onClick={() => update({ bookingPreference: 'approval' })}

            className={cn(

              'cursor-pointer rounded-xl border-2 p-4 transition-all',

              form.bookingPreference === 'approval' ? 'border-primary bg-card' : 'border-border bg-card hover:border-muted-foreground/50',

            )}

          >

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">

                <ClipboardCheck className="h-5 w-5 text-muted-foreground" />

              </div>

              <div className="flex-1">

                <div className="flex items-center gap-2">

                  <h4 className="font-semibold text-foreground">Aprueba todas las reservas</h4>

                  <Badge variant="secondary" className="bg-primary/10 text-xs text-primary">Recomendada</Badge>

                </div>

                <p className="mt-1 text-sm text-muted-foreground">

                  Revisa siempre las solicitudes que recibas. Deberás aprobar previo a que la reserva quede en firme.

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>



      <div className="form-section pt-6">

        <Label className="form-label">¿Cuándo pueden los asistentes solicitar reembolsos?</Label>

        <p className="form-sublabel mt-1 text-sm text-muted-foreground">

          Define hasta qué momento los asistentes pueden cancelar su reserva y recibir un reembolso completo.

          Esta política será visible para los usuarios antes de confirmar su reserva.

        </p>

        <RadioGroup

          value={form.refundPolicy}

          onValueChange={(refundPolicy) => update({ refundPolicy })}

          className="mt-4 space-y-3"

        >

          {REFUND_POLICIES.map((policy) => (

            <div key={policy} className="flex items-center space-x-3">

              <RadioGroupItem value={policy} id={`refund-${policy}`} />

              <Label htmlFor={`refund-${policy}`} className="cursor-pointer font-normal">{policy}</Label>

            </div>

          ))}

        </RadioGroup>

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

