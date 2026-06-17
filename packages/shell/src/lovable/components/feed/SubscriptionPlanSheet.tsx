import { useState } from 'react';
import { Sheet, SheetContent } from '@lovable/components/ui/sheet';
import {
  Gift,
  Crown,
  PartyPopper,
  Ticket,
  SlidersHorizontal,
  Sofa,
  MapPin,
} from 'lucide-react';
import type { PlanId } from '@lovable/components/legal/PlanDetailView';
import ProSubscriptionPaymentSheet from './ProSubscriptionPaymentSheet';

interface SubscriptionPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: PlanId;
  onViewDetails: () => void;
  onUpgrade?: () => void;
}

const previewItems = (isPro: boolean) => [
  {
    icon: PartyPopper,
    label: isPro ? 'Crea eventos ilimitados' : '8 Eventos gratis al año',
  },
  {
    icon: Ticket,
    label: isPro ? 'Boletas ilimitadas por evento' : '100 Boletas por evento',
  },
  { icon: SlidersHorizontal, label: 'Configuración de boletos' },
  { icon: Sofa, label: 'Crea el plano de sillas y ubicaciones para tu evento personalizado.' },
  { icon: MapPin, label: 'Cerca de ti: Mapa de Eventos, Lugares y Servicios' },
];

const SubscriptionPlanSheet = ({
  open,
  onOpenChange,
  planId,
  onViewDetails,
  onUpgrade,
}: SubscriptionPlanSheetProps) => {
  const isPro = planId === 'pro';
  const items = previewItems(isPro);
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onUpgrade?.();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-0 p-0 max-h-[90vh] overflow-y-auto"
        >
          <div className="px-5 pt-6 pb-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                {isPro ? (
                  <>
                    <p className="text-sm text-muted-foreground">Plan ilimitado PRO</p>
                    <p className="text-2xl font-extrabold text-primary mt-0.5">$70 USD/anual</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Haz un solo pago al año y organiza eventos sin límite.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Plan actual</p>
                    <p className="text-2xl font-extrabold text-primary mt-0.5">Gratuito</p>
                  </>
                )}
              </div>
              <div
                className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm ${
                  isPro ? 'bg-amber-100 border border-amber-300' : 'bg-primary/15'
                }`}
              >
                {isPro ? (
                  <Crown className="h-7 w-7 text-amber-500" />
                ) : (
                  <Gift className="h-7 w-7 text-primary" />
                )}
              </div>
            </div>

            {isPro && (
              <div className="mt-4 text-center space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Costo de la plataforma por boleto vendido
                </p>
                <p className="text-base font-bold text-foreground">8% + $1.500 COP + IVA</p>
              </div>
            )}

            {/* Services preview */}
            <div className="mt-5 rounded-2xl bg-primary/5 border border-primary/15 p-4">
              <p className="text-sm font-bold text-foreground mb-3">
                {isPro ? 'Servicios del plan:' : 'Servicios de tu plan actual:'}
              </p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-snug">{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">12 beneficios más...</p>
              <button
                type="button"
                onClick={() => { onOpenChange(false); onViewDetails(); }}
                className="mt-3 ml-auto block text-sm font-semibold text-primary"
              >
                Más detalle del plan
              </button>
            </div>

            {/* Footer actions */}
            <div className="mt-5 space-y-2">
              {isPro ? (
                <>
                  <button
                    type="button"
                    className="w-full rounded-full border-2 border-destructive text-destructive font-semibold py-3"
                  >
                    Cancelar plan
                  </button>
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-full bg-primary/15 text-primary/40 font-semibold py-3 cursor-not-allowed"
                  >
                    Adquirir plan PRO
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); setShowPayment(true); }}
                  className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-3 shadow-sm"
                >
                  Pasarme al plan PRO
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ProSubscriptionPaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default SubscriptionPlanSheet;
