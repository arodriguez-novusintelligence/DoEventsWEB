import { useState } from 'react';
import {
  ChevronLeft,
  Gift,
  Crown,
  Check,
  X,
  Ticket,
  Infinity as InfinityIcon,
  Percent,
  Receipt,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import ProSubscriptionPaymentSheet from '@lovable/components/feed/ProSubscriptionPaymentSheet';

type PlanId = 'free' | 'pro';

interface PlanFeature {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

const features: PlanFeature[] = [
  { label: 'Eventos publicados', free: '8 al año', pro: 'Ilimitados' },
  { label: 'Boletas por evento', free: '100', pro: 'Ilimitadas' },
  { label: 'Plano de sillas', free: true, pro: true },
  { label: 'Página de evento', free: true, pro: true },
  { label: 'Ventas online', free: true, pro: true },
  { label: 'Boletería con QR', free: true, pro: true },
  { label: 'Perfil personalizado', free: true, pro: true },
  { label: 'Calificaciones', free: true, pro: true },
  { label: 'Métricas básicas', free: true, pro: true },
  { label: 'ChatRoom del evento', free: true, pro: true },
  { label: 'Feed social', free: true, pro: true },
  { label: 'Favoritos', free: true, pro: true },
  { label: 'Seguidores', free: true, pro: true },
  { label: 'Perfil privado', free: true, pro: true },
  { label: 'Reembolsos', free: true, pro: true },
  { label: 'Control de accesos', free: false, pro: true },
  { label: 'Códigos promocionales', free: false, pro: true },
  { label: 'Agenda del evento', free: false, pro: true },
  { label: 'CRM de invitados', free: false, pro: true },
  { label: 'Marketing y notificaciones', free: false, pro: true },
  { label: 'Transferencia de boletos', free: false, pro: true },
];

const PlatformCostsView = ({ onBack }: { onBack: () => void }) => {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div className="mx-auto max-w-lg pb-24 min-h-screen bg-background">
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-4">
          <ChevronLeft className="h-5 w-5" />
          Volver
        </button>

        <h1 className="text-2xl font-extrabold text-primary leading-tight mb-1">
          Costos de la plataforma
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Compara planes y conoce las tarifas de Do.Events
        </p>

        {/* Tarjetas de planes */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Free */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Plan Gratuito</p>
            <p className="text-2xl font-extrabold text-primary mt-1">$0</p>
            <p className="text-xs text-muted-foreground">Por siempre</p>
          </div>

          {/* PRO */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
              RECOMENDADO
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
              <Crown className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-foreground">Plan PRO</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">$70</p>
            <p className="text-xs text-muted-foreground">USD / año</p>
          </div>
        </div>

        {/* Costo por boleto — banner destacado */}
        <div className="rounded-2xl bg-card border border-border/60 p-5 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Costo por boleto vendido</p>
              <p className="text-xs text-muted-foreground">Aplica en ambos planes</p>
            </div>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">8% + $1.500 COP + IVA</p>
            <p className="text-xs text-muted-foreground mt-1">
              Este costo lo paga el comprador final. Sin costos ocultos para ti.
            </p>
          </div>
        </div>

        {/* Comparativa de características */}
        <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Comparativa de servicios</p>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-0 text-sm">
            {/* Header */}
            <div className="px-4 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground">
              Servicio
            </div>
            <div className="px-3 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground text-center w-16">
              Free
            </div>
            <div className="px-3 py-2.5 bg-muted/40 text-xs font-semibold text-amber-600 text-center w-16">
              PRO
            </div>

            {/* Rows */}
            {features.map((f, i) => (
              <>
                <div
                  key={`${f.label}-label`}
                  className={`px-4 py-2.5 text-foreground ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  {f.label}
                </div>
                <div
                  key={`${f.label}-free`}
                  className={`px-3 py-2.5 text-center ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  {typeof f.free === 'boolean' ? (
                    f.free ? (
                      <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                    )
                  ) : (
                    <span className="text-xs text-foreground font-medium">{f.free}</span>
                  )}
                </div>
                <div
                  key={`${f.label}-pro`}
                  className={`px-3 py-2.5 text-center ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  {typeof f.pro === 'boolean' ? (
                    f.pro ? (
                      <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                    )
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">{f.pro}</span>
                  )}
                </div>
              </>
            ))}
          </div>
        </div>

        {/* Destacados PRO */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-bold text-foreground">Lo que obtienes con PRO</p>
          </div>
          <ul className="space-y-3">
            {[
              { icon: InfinityIcon, text: 'Eventos ilimitados todo el año' },
              { icon: Ticket, text: 'Boletas ilimitadas por cada evento' },
              { icon: ShieldCheck, text: 'Control de accesos con escaneo de QR' },
              { icon: CreditCard, text: 'Códigos promocionales y descuentos' },
              { icon: Receipt, text: 'CRM completo de invitados' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2.5 text-sm text-foreground">
                <item.icon className="h-4 w-4 text-amber-500 shrink-0" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => setShowPayment(true)}
          className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-3.5 shadow-sm active:scale-[0.98] transition"
        >
          Pasarme al plan PRO — $70 USD/año
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3 mb-8">
          Pago anual recurrente. Cancela cuando quieras desde tu perfil.
        </p>
      </div>

      <ProSubscriptionPaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default PlatformCostsView;
