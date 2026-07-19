import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Ticket as TicketIcon,
  Building2,
  Briefcase,
} from 'lucide-react';
import type { Ticket } from '@lovable/data/ticketsData';
import type { UserServiceBooking, UserVenueBooking } from '@doevents/shared';
import MyTicketsView from '@lovable/components/tickets/MyTicketsView';
import MyReservedVenuesView from './MyReservedVenuesView';
import MyReservedServicesView from './MyReservedServicesView';

type PurchaseSection = 'boletos' | 'lugares' | 'servicios';

interface MyPurchasesViewProps {
  onBack: () => void;
  ticketCount: number;
  venueCount: number;
  serviceCount: number;
  countsLoading?: boolean;
  hasCountsSnapshot?: boolean;
  onSectionOpen?: (section: PurchaseSection) => void;
  tickets?: Ticket[];
  ticketsLoading?: boolean;
  ticketsLoadError?: string | null;
  onTicketsRetry?: () => void;
  onOpenTicketDetail?: (ticket: Ticket, action?: 'transfer' | 'refund') => void;
  onViewEventDetail?: (eventId: string, ticket: Ticket) => void;
  venueBookings?: UserVenueBooking[];
  venuesLoading?: boolean;
  venuesLoadError?: string | null;
  onVenuesRetry?: () => void;
  onViewVenueDetail?: (venueId: string) => void;
  serviceBookings?: UserServiceBooking[];
  servicesLoading?: boolean;
  servicesLoadError?: string | null;
  onServicesRetry?: () => void;
  onViewServiceDetail?: (serviceId: string) => void;
  initialSection?: PurchaseSection | null;
}

interface OptionDef {
  key: PurchaseSection;
  title: string;
  subtitle: string;
  count: number;
  icon: typeof TicketIcon;
  iconBg: string;
  iconColor: string;
}

export const MyPurchasesView = ({
  onBack,
  ticketCount,
  venueCount,
  serviceCount,
  countsLoading = false,
  hasCountsSnapshot = false,
  onSectionOpen,
  tickets = [],
  ticketsLoading = false,
  ticketsLoadError = null,
  onTicketsRetry,
  onOpenTicketDetail,
  onViewEventDetail,
  venueBookings = [],
  venuesLoading = false,
  venuesLoadError = null,
  onVenuesRetry,
  onViewVenueDetail,
  serviceBookings = [],
  servicesLoading = false,
  servicesLoadError = null,
  onServicesRetry,
  onViewServiceDetail,
  initialSection = null,
}: MyPurchasesViewProps) => {
  const [section, setSection] = useState<PurchaseSection | null>(initialSection);

  const openSection = (key: PurchaseSection) => {
    onSectionOpen?.(key);
    setSection(key);
  };

  if (section === 'boletos') {
    return (
      <MyTicketsView
        onBack={() => setSection(null)}
        tickets={tickets}
        loading={ticketsLoading}
        loadError={ticketsLoadError}
        onRetry={onTicketsRetry}
        onOpenTicketDetail={onOpenTicketDetail}
        onViewEventDetail={onViewEventDetail}
      />
    );
  }

  if (section === 'lugares') {
    return (
      <MyReservedVenuesView
        onBack={() => setSection(null)}
        bookings={venueBookings}
        loading={venuesLoading}
        loadError={venuesLoadError}
        onRetry={onVenuesRetry}
        onViewVenueDetail={onViewVenueDetail}
      />
    );
  }

  if (section === 'servicios') {
    return (
      <MyReservedServicesView
        onBack={() => setSection(null)}
        bookings={serviceBookings}
        loading={servicesLoading}
        loadError={servicesLoadError}
        onRetry={onServicesRetry}
        onViewServiceDetail={onViewServiceDetail}
      />
    );
  }

  const options: OptionDef[] = [
    {
      key: 'boletos',
      title: 'Mis Boletos',
      subtitle: 'Entradas y boletas de eventos',
      count: ticketCount,
      icon: TicketIcon,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      key: 'lugares',
      title: 'Mis Lugares Reservados',
      subtitle: 'Salones, fincas y espacios',
      count: venueCount,
      icon: Building2,
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-500',
    },
    {
      key: 'servicios',
      title: 'Mis Servicios Reservados',
      subtitle: 'DJ, fotografía, catering y más',
      count: serviceCount,
      icon: Briefcase,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary pb-36">
      <div className="rounded-b-3xl bg-gradient-to-br from-primary via-primary to-accent px-4 pb-10 pt-5">
        <div className="mx-auto max-w-lg">
          <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-sm font-medium text-primary-foreground/90">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
              <ShoppingBag className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-primary-foreground">Mis Compras</h1>
              <p className="text-xs text-primary-foreground/80">Boletos, lugares y servicios reservados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg -mt-6 space-y-3 px-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => openSection(opt.key)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${opt.iconBg}`}>
                <Icon className={`h-6 w-6 ${opt.iconColor}`} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-foreground">{opt.title}</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {countsLoading && !hasCountsSnapshot ? '…' : opt.count}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{opt.subtitle}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MyPurchasesView;
