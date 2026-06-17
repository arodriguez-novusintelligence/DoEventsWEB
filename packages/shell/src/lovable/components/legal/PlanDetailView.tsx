import { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Gift,
  Crown,
  Ticket,
  SlidersHorizontal,
  Sofa,
  MapPin,
  Globe,
  CreditCard,
  QrCode,
  UserCircle,
  Star,
  LineChart,
  MessagesSquare,
  Newspaper,
  Heart,
  Users,
  Lock,
  RotateCcw,
  ShieldCheck,
  Tag,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Send,
  XCircle,
  Infinity as InfinityIcon,
  type LucideIcon,
} from 'lucide-react';
import ProSubscriptionPaymentSheet from '@lovable/components/feed/ProSubscriptionPaymentSheet';

export type PlanId = 'free' | 'pro';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const freeFeatures: Feature[] = [
  { icon: Gift, title: '8 Eventos gratis al año', description: 'Publica hasta 8 eventos al año sin costo de publicación.' },
  { icon: Ticket, title: '100 Boletas por evento', description: 'Vende hasta 100 boletas por cada evento que publiques.' },
  { icon: SlidersHorizontal, title: 'Configuración de boletos', description: 'Define tipos, precios, cupos y fechas de venta de tus boletas.' },
  { icon: Sofa, title: 'Plano de sillas y ubicaciones', description: 'Crea el plano de sillas y ubicaciones para tu evento personalizado.' },
  { icon: MapPin, title: 'Cerca de ti: Mapa de Eventos, Lugares y Servicios', description: 'Aparece en el mapa para que asistentes cercanos te encuentren.' },
  { icon: Globe, title: 'Página personalizada del evento', description: 'Cada evento tiene una página propia para compartir con tu audiencia.' },
  { icon: CreditCard, title: 'Ventas de boleta online', description: 'Recibe pagos en línea de forma segura a través de Wompi.' },
  { icon: QrCode, title: 'Envío de boletería electrónica con QR', description: 'Tus asistentes reciben sus boletas con código QR automáticamente.' },
  { icon: UserCircle, title: 'Página de perfil personalizada', description: 'Construye tu perfil público con tu marca, bio y eventos.' },
  { icon: Star, title: 'Calificación de experiencia', description: 'Los asistentes pueden calificar tu evento y dejar reseñas.' },
  { icon: LineChart, title: 'Métricas de tu evento', description: 'Visualiza ventas, asistencia y comportamiento de compra.' },
  { icon: MessagesSquare, title: 'ChatRoom del evento', description: 'Sala de chat exclusiva para los asistentes del evento.' },
  { icon: Newspaper, title: 'Feed Red Social', description: 'Comparte contenido y conecta con la comunidad Do.Events.' },
  { icon: Heart, title: 'Tus eventos favoritos', description: 'Tus asistentes pueden guardar tus eventos como favoritos.' },
  { icon: Users, title: 'Seguidores', description: 'Construye una comunidad que sigue tu actividad como organizador.' },
  { icon: Lock, title: 'Perfil privado', description: 'Controla la visibilidad de tu perfil y publicaciones.' },
  { icon: RotateCcw, title: 'Reembolsos y cancelaciones de boletos', description: 'Gestiona reembolsos y cancelaciones desde el panel del evento.' },
];

const proExtras: Feature[] = [
  { icon: ShieldCheck, title: 'Control de accesos', description: 'Escanea QR en la entrada y controla el acceso en tiempo real.' },
  { icon: Tag, title: 'Creación de código promocional', description: 'Crea cupones y códigos de descuento para tus campañas.' },
  { icon: CalendarDays, title: 'Agenda del evento', description: 'Publica la agenda completa con horarios y actividades.' },
  { icon: ClipboardList, title: 'Gestión de invitados CRM', description: 'Administra tus invitados con etiquetas, listas y seguimiento.' },
  { icon: Megaphone, title: 'Marketing digital y notificaciones', description: 'Envía campañas y notificaciones push a tu comunidad.' },
  { icon: Send, title: 'Transferencia de boletos', description: 'Permite que tus asistentes transfieran sus boletas a otras personas.' },
];

const planMeta: Record<PlanId, {
  name: string;
  price: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}> = {
  free: { name: 'Plan Gratuito', price: 'Anual', icon: Gift, iconColor: 'text-primary', iconBg: 'bg-primary/15' },
  pro: { name: 'Plan PRO', price: '$70 USD/anual', icon: Crown, iconColor: 'text-amber-500', iconBg: 'bg-amber-100' },
};

const proOverrides: Feature[] = [
  { icon: InfinityIcon, title: 'Eventos ilimitados', description: 'Publica eventos sin límite durante todo el año.' },
  { icon: Ticket, title: 'Boletas ilimitadas por evento', description: 'Vende todas las boletas que necesites en cada evento.' },
];

type FeatureItemProps = {
  feature: Feature;
  enabled: boolean;
  expanded: boolean;
  onToggle: () => void;
};

const FeatureItem = ({ feature, enabled, expanded, onToggle }: FeatureItemProps) => {
  const Icon = enabled ? feature.icon : XCircle;
  return (
    <div
      className={`rounded-2xl bg-card border border-border/60 shadow-sm transition ${
        enabled ? '' : 'opacity-50'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!enabled}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <Icon className={`h-5 w-5 shrink-0 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className={`flex-1 text-sm ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
          {feature.title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-primary transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {enabled && expanded && (
        <div className="px-4 pb-3 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
          <p className="pt-3">{feature.description}</p>
        </div>
      )}
    </div>
  );
};

const PlanDetailView = ({
  planId,
  onBack,
  onUpgrade,
  onCancelPlan,
  onViewAllPlans,
}: {
  planId: PlanId;
  onBack: () => void;
  onUpgrade?: () => void;
  onCancelPlan?: () => void;
  onViewAllPlans?: () => void;
}) => {
  const meta = planMeta[planId];
  const Icon = meta.icon;
  const isPro = planId === 'pro';
  const baseFeatures = isPro ? [...proOverrides, ...freeFeatures.slice(2)] : freeFeatures;
  const features: { feature: Feature; enabled: boolean }[] = [
    ...baseFeatures.map((f) => ({ feature: f, enabled: true })),
    ...proExtras.map((f) => ({ feature: f, enabled: isPro })),
  ];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onUpgrade?.();
  };

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    setShowPayment(true);
  };

  return (
    <div className="mx-auto max-w-lg pb-40 min-h-screen bg-background">
      <div className="px-4 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-primary font-medium mb-4"
        >
          <ChevronLeft className="h-5 w-5" />
          Volver
        </button>

        <h1 className="text-2xl font-extrabold text-primary leading-tight mb-5">
          Suscripciones y costos
        </h1>

        <div className="flex justify-center mb-4">
          <div className={`h-14 w-14 rounded-2xl ${meta.iconBg} flex items-center justify-center shadow-sm`}>
            <Icon className={`h-7 w-7 ${meta.iconColor}`} />
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 px-4 py-4 text-center shadow-sm">
          <p className="text-base font-medium text-muted-foreground">{meta.name}</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{meta.price}</p>
        </div>

        <div className="mt-5 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Costo de la plataforma por boleto vendido</p>
          <p className="text-xl font-extrabold text-primary">8% + $1.500 COP + IVA</p>
        </div>

        <p className="mt-3 text-xs text-muted-foreground text-center leading-relaxed">
          Este costo de la plataforma lo paga el comprador final, sin costos ocultos.
        </p>

        <h2 className="text-base font-bold text-foreground mt-7 mb-3">
          Servicios de tu plan {isPro ? 'PRO' : 'actual'}
        </h2>

        <div className="space-y-2.5">
          {features.map(({ feature, enabled }) => (
            <FeatureItem
              key={feature.title}
              feature={feature}
              enabled={enabled}
              expanded={expanded === feature.title}
              onToggle={() => setExpanded(expanded === feature.title ? null : feature.title)}
            />
          ))}
        </div>
      </div>

      {/* Sticky footer actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-lg px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="space-y-2">
          {onViewAllPlans && (
            <button
              type="button"
              onClick={onViewAllPlans}
              className="w-full rounded-full border-2 border-primary text-primary font-semibold py-3 transition hover:bg-primary/5"
            >
              Ver todos los planes
            </button>
          )}
          {isPro ? (
            <button
              type="button"
              onClick={() => onCancelPlan?.()}
              disabled={!onCancelPlan}
              className="w-full rounded-full border-2 border-destructive text-destructive font-semibold py-3 transition hover:bg-destructive/5 disabled:opacity-40"
            >
              Cancelar plan PRO
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUpgradeClick}
              className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-3 shadow-sm"
            >
              Pasarme al plan PRO
            </button>
          )}
        </div>
      </div>

      {!onUpgrade && (
        <ProSubscriptionPaymentSheet
          open={showPayment}
          onOpenChange={setShowPayment}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default PlanDetailView;
