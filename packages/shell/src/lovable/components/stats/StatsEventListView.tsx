import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, CalendarDays, ChevronRight, MessageSquare, DollarSign, UserCheck, ScanLine, RefreshCw, Loader2, AlertCircle, Ticket } from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import type { EventChatRoom, EventStatus } from '@lovable/data/chatData';
import SalesStatsView from './SalesStatsView';
import GuestStatsView from './GuestStatsView';
import AccessControlView from './AccessControlView';
import RefundsView from './RefundsView';
import PromoCodesStatsView from './PromoCodesStatsView';
import { isAccessControlEnabled } from '../../../lovable-bridge/accessAdapter';
import type { User } from '@lovable/data/';

interface StatsEventListViewProps {
  events: EventChatRoom[];
  onBack: () => void;
  loading?: boolean;
  loadError?: string | null;
  onViewProfile?: (user: User | { name: string; initials: string; id?: string }) => void;
}

const statusConfig: Record<EventStatus, { label: string; className: string; order: number }> = {
  en_ejecucion: { label: 'En ejecución', className: 'bg-primary/10 text-primary', order: 0 },
  activo: { label: 'Activo', className: 'bg-success/10 text-success', order: 1 },
  finalizado: { label: 'Finalizado', className: 'bg-muted text-muted-foreground', order: 2 },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive', order: 3 },
};

const parseEventDate = (dateStr: string): Date => {
  const months: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
  const match = dateStr.match(/(\d{1,2})\s(\w{3})\s(\d{4})/);
  if (match) return new Date(+match[3], months[match[2]] ?? 0, +match[1]);
  return new Date(0);
};

const sortByEventDate = (a: EventChatRoom, b: EventChatRoom) =>
  parseEventDate(a.eventDate).getTime() - parseEventDate(b.eventDate).getTime();

const isPastEvent = (status: EventStatus) => status === 'finalizado' || status === 'cancelado';

const statsOptions = [
  {
    id: 'ventas',
    title: 'Estadísticas de Ventas',
    description: 'Ingresos, boletas vendidas y métodos de pago',
    icon: DollarSign,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/15',
    chevron: 'text-primary/30',
  },
  {
    id: 'invitados',
    title: 'Gestión de Invitados',
    description: 'Invitados confirmados, pendientes y cancelados',
    icon: UserCheck,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/15',
    chevron: 'text-primary/30',
  },
  {
    id: 'accesos',
    title: 'Control de Accesos',
    description: 'Check-ins, horarios de entrada y asistencia',
    icon: ScanLine,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/15',
    chevron: 'text-primary/30',
  },
  {
    id: 'reembolsos',
    title: 'Estadísticas de Reembolsos',
    description: 'Pendientes, procesados por app y estados de devolución',
    icon: RefreshCw,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/15',
    chevron: 'text-primary/30',
  },
  {
    id: 'promocionales',
    title: 'Códigos promocionales',
    description: 'Códigos generados, redimidos y descuentos aplicados',
    icon: Ticket,
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/15',
    chevron: 'text-primary/30',
  },
];

const formatRevenue = (amount: number) =>
  amount > 0 ? `COP ${amount.toLocaleString('es-CO')}` : null;

const EventStatsSummary = ({ event }: { event: EventChatRoom }) => {
  const sold = event.ticketsSold ?? 0;
  const promos = event.promoCodesRedeemed ?? 0;
  const revenue = event.salesRevenue ?? 0;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Ticket className="h-3 w-3 shrink-0" />
        {sold} boleto{sold !== 1 ? 's' : ''} vendido{sold !== 1 ? 's' : ''}
      </span>
      {promos > 0 && (
        <span className="inline-flex items-center gap-1">
          <Ticket className="h-3 w-3 shrink-0 text-primary" />
          {promos} promo{promos !== 1 ? 's' : ''} redimido{promos !== 1 ? 's' : ''}
        </span>
      )}
      {revenue > 0 && (
        <span className="inline-flex items-center gap-1">
          <DollarSign className="h-3 w-3 shrink-0" />
          {formatRevenue(revenue)}
        </span>
      )}
    </div>
  );
};

const StatsEventListView = ({ events, onBack, loading = false, loadError = null, onViewProfile }: StatsEventListViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedEventId = searchParams.get('event');
  const activeStatsOption = searchParams.get('view');

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find(
      (event) => event.id === selectedEventId || event.eventId === selectedEventId,
    ) ?? null;
  }, [events, selectedEventId]);

  const openEvent = (event: EventChatRoom) => {
    setSearchParams({ event: event.eventId || event.id });
  };

  const closeEvent = () => {
    setSearchParams({});
  };

  const openStatsSection = (optionId: string) => {
    if (!selectedEventId) return;
    setSearchParams({ event: selectedEventId, view: optionId });
  };

  const backToEventMenu = () => {
    if (selectedEventId) {
      setSearchParams({ event: selectedEventId });
    }
  };

  const activeEvents = events
    .filter((e) => e.eventStatus === 'activo' || e.eventStatus === 'en_ejecucion')
    .sort(sortByEventDate);

  const pastEvents = events
    .filter((e) => isPastEvent(e.eventStatus))
    .sort(sortByEventDate);

  const canAccessLiveControl = selectedEvent
    ? isAccessControlEnabled(
        selectedEvent.eventStatus === 'en_ejecucion' ? 'en_ejecucion' : selectedEvent.eventStatus,
      )
    : false;

  // Sales stats detail view
  if (selectedEvent && activeStatsOption === 'ventas') {
    return (
      <SalesStatsView
        event={selectedEvent}
        onBack={backToEventMenu}
      />
    );
  }

  // Guest stats detail view
  if (selectedEvent && activeStatsOption === 'invitados') {
    return (
      <GuestStatsView
        event={selectedEvent}
        onBack={backToEventMenu}
      />
    );
  }

  // Access control detail view
  if (selectedEvent && activeStatsOption === 'accesos') {
    return (
      <AccessControlView
        event={selectedEvent}
        onBack={backToEventMenu}
      />
    );
  }

  // Refunds detail view
  if (selectedEvent && activeStatsOption === 'reembolsos') {
    return (
      <RefundsView
        event={selectedEvent}
        onBack={backToEventMenu}
      />
    );
  }

  if (selectedEvent && activeStatsOption === 'promocionales') {
    return (
      <PromoCodesStatsView
        event={selectedEvent}
        onBack={backToEventMenu}
        onViewProfile={onViewProfile}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner title="Estadísticas" subtitle="Cargando eventos…" icon={BarChart3} onBack={onBack} />
        <div className="mx-auto max-w-lg px-4 -mt-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Obteniendo tus eventos…</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner title="Estadísticas" subtitle="Error al cargar" icon={BarChart3} onBack={onBack} />
        <div className="mx-auto max-w-lg px-4 -mt-6">
          <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-destructive">{loadError}</p>
            <p className="mt-2 text-xs text-muted-foreground">Intenta de nuevo más tarde.</p>
          </div>
        </div>
      </div>
    );
  }

  // Detail view for a selected event
  if (selectedEvent) {
    const status = statusConfig[selectedEvent.eventStatus];
    return (
      <div className="min-h-screen bg-secondary pb-24">
        <ProfileSectionBanner
          title={selectedEvent.eventName}
          subtitle="Opciones de estadísticas"
          icon={BarChart3}
          onBack={closeEvent}
        />
        <div className="mx-auto max-w-lg px-4 pt-4">

          {/* Event Header Card */}
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
            {selectedEvent.eventImage ? (
              <img
                src={selectedEvent.eventImage}
                alt={selectedEvent.eventName}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted ring-2 ring-primary/20">
                <MessageSquare className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h1 className="truncate text-base font-bold text-foreground leading-tight">
                  {selectedEvent.eventName}
                </h1>
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="mb-2 truncate text-xs text-muted-foreground">
                {selectedEvent.eventDescription || 'Detalle del evento'}
              </p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path d="M12 6v6l4 2" strokeWidth="2" />
                  </svg>
                  {selectedEvent.eventTime || '—'}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {selectedEvent.eventDate}
                </div>
              </div>
              <div className="mt-2">
                <EventStatsSummary event={selectedEvent} />
              </div>
            </div>
          </div>

          {/* Section Title */}
          <div className="mt-6">
            <h2 className="text-xl font-extrabold text-foreground">Opciones de estadísticas</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecciona el tipo de estadística que deseas consultar
            </p>
          </div>

          {/* Stats Options */}
          <div className="mt-4 space-y-3 pb-8">
            {statsOptions.map(opt => {
              const isAccessOption = opt.id === 'accesos';
              const disabled = isAccessOption && !canAccessLiveControl;
              return (
              <button
                key={opt.id}
                onClick={() => !disabled && openStatsSection(opt.id)}
                disabled={disabled}
                className={`flex w-full items-center rounded-2xl border p-4 transition-all active:scale-[0.98] ${opt.bg} ${opt.border} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm ${opt.color}`}>
                  <opt.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-[15px] font-bold text-foreground">{opt.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {disabled
                      ? 'No disponible: el evento está finalizado o cancelado'
                      : opt.description}
                  </p>
                </div>
                {!disabled && (
                  <ChevronRight className={`ml-2 h-5 w-5 shrink-0 ${opt.chevron}`} strokeWidth={2.5} />
                )}
              </button>
            );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <ProfileSectionBanner
        title="Mis estadísticas"
        subtitle={`${events.length} evento${events.length === 1 ? '' : 's'} por estado`}
        icon={BarChart3}
        onBack={onBack}
      />

      <div className="mx-auto max-w-lg px-4 pt-4">
        <div className="mb-6 grid grid-cols-4 gap-2">
          {Object.entries(statusConfig).map(([status, cfg]) => {
            const count = events.filter(e => e.eventStatus === status).length;
            return (
              <div key={status} className="flex flex-col items-center rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                <span className="text-xl font-bold text-card-foreground">{count}</span>
                <span className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>

        {activeEvents.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Activos / En ejecución
              </span>
              <span className="text-xs text-muted-foreground">({activeEvents.length})</span>
            </div>
            <div className="space-y-2">
              {activeEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => openEvent(event)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
                >
                  {event.eventImage ? (
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={event.eventImage} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {event.eventName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <span className="text-sm font-semibold text-card-foreground line-clamp-1">
                      {event.eventName}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span>{event.eventDate}</span>
                    </div>
                    <EventStatsSummary event={event} />
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                Finalizados / Cancelados
              </span>
              <span className="text-xs text-muted-foreground">({pastEvents.length})</span>
            </div>
            <div className="space-y-2">
              {pastEvents.map(event => {
                const config = statusConfig[event.eventStatus];
                return (
                <button
                  key={event.id}
                  onClick={() => openEvent(event)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-accent/50 opacity-90"
                >
                  {event.eventImage ? (
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={event.eventImage} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {event.eventName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-card-foreground line-clamp-1">
                        {event.eventName}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${config.className}`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span>{event.eventDate}</span>
                    </div>
                    <EventStatsSummary event={event} />
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              );
              })}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-card py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Sin eventos para estadísticas</p>
            <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
              Publica o gestiona eventos para ver ventas, invitados y accesos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsEventListView;
