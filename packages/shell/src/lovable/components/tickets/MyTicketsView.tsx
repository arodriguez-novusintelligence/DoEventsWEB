import { useEffect, useMemo, useState } from 'react';
import { Ticket as TicketIcon, Eye, Calendar, Clock, Loader2 } from 'lucide-react';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import type { Ticket, TicketStatus } from '@lovable/data/ticketsData';
import { groupTicketsForListView } from '../../../lovable-bridge/ticketsAdapter';
import { useReservationTimer, isPlaceholderEventImage } from '@doevents/shared';

interface MyTicketsViewProps {
  onBack: () => void;
  onViewEventDetail?: (eventId: string, ticket: Ticket) => void;
  onOpenTicketDetail?: (ticket: Ticket) => void;
  tickets?: Ticket[];
  loading?: boolean;
  initialTab?: TicketStatus;
}

const TABS: { key: TicketStatus; label: string; dot: string }[] = [
  { key: 'aprobada', label: 'Aprobadas', dot: 'bg-emerald-500' },
  { key: 'pendiente', label: 'Pendientes', dot: 'bg-amber-500' },
  { key: 'cancelada', label: 'Canceladas', dot: 'bg-destructive' },
  { key: 'finalizada', label: 'Finalizadas', dot: 'bg-muted-foreground' },
];

const TAB_PRIORITY: TicketStatus[] = ['aprobada', 'pendiente', 'finalizada', 'cancelada'];

function pickInitialTab(tickets: Ticket[], preferred?: TicketStatus): TicketStatus {
  if (preferred && tickets.some((t) => t.status === preferred)) return preferred;
  return TAB_PRIORITY.find((tab) => tickets.some((t) => t.status === tab)) || 'aprobada';
}

const PendingCountdown = ({ expiresAtTs }: { expiresAtTs?: number }) => {
  const { isExpired, label } = useReservationTimer(expiresAtTs ?? null);
  if (!expiresAtTs) return null;
  return (
    <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${isExpired ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-800'}`}>
      <Clock className="h-3.5 w-3.5" />
      {isExpired ? 'Reserva expirada' : `Paga en ${label} para conservar tus boletas`}
    </div>
  );
};

const TicketCardMedia = ({ ticket }: { ticket: Ticket }) => {
  const [videoFailed, setVideoFailed] = useState(false);
  useEffect(() => {
    setVideoFailed(false);
  }, [ticket.eventVideo, ticket.eventImage, ticket.eventId]);
  const hasVideo = Boolean(ticket.eventVideo) && !videoFailed;
  const hasImage = Boolean(ticket.eventImage) && !isPlaceholderEventImage(ticket.eventImage);

  if (hasVideo) {
    return (
      <video
        src={ticket.eventVideo}
        className="h-full w-full object-cover"
        muted
        playsInline
        loop
        autoPlay
        onError={() => setVideoFailed(true)}
      />
    );
  }
  if (hasImage) {
    return <img src={ticket.eventImage} alt={ticket.eventTitle} className="h-full w-full object-cover" />;
  }
  return <div className="h-full w-full bg-muted" />;
};

const MyTicketsView = ({
  onBack,
  onViewEventDetail,
  onOpenTicketDetail,
  tickets: ticketsProp = [],
  loading = false,
  initialTab,
}: MyTicketsViewProps) => {
  const [activeTab, setActiveTab] = useState<TicketStatus>(() => pickInitialTab(ticketsProp, initialTab));

  useEffect(() => {
    if (loading) return;
    setActiveTab((current) => {
      if (ticketsProp.some((t) => t.status === current)) return current;
      return pickInitialTab(ticketsProp, initialTab);
    });
  }, [ticketsProp, loading, initialTab]);

  const counts: Record<TicketStatus, number> = {
    aprobada: ticketsProp.filter((t) => t.status === 'aprobada').length,
    pendiente: ticketsProp.filter((t) => t.status === 'pendiente').length,
    cancelada: ticketsProp.filter((t) => t.status === 'cancelada').length,
    finalizada: ticketsProp.filter((t) => t.status === 'finalizada').length,
  };

  const tickets = useMemo(
    () => groupTicketsForListView(ticketsProp.filter((t) => t.status === activeTab)),
    [ticketsProp, activeTab],
  );

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <ProfileSectionBanner
        title="Mis boletas"
        subtitle={`${ticketsProp.length} boleta${ticketsProp.length === 1 ? '' : 's'} en total`}
        icon={TicketIcon}
        onBack={onBack}
      />

      <div className="mx-auto max-w-lg px-4 -mt-6">
        <div className="rounded-2xl bg-card p-2 shadow-md grid grid-cols-4 gap-1">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-all ${
                  active ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-accent/40'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary-foreground' : tab.dot}`} />
                {tab.label}
                <span className="text-[10px] opacity-80">({counts[tab.key]})</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {loading && tickets.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando tus boletas…</p>
            </div>
          )}

          {!loading && tickets.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <TicketIcon className="h-7 w-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {ticketsProp.length > 0 ? 'Sin boletas en esta pestaña' : 'Aún no tienes boletas'}
              </p>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                {ticketsProp.length > 0
                  ? 'Revisa las otras categorías para ver tus entradas.'
                  : 'Compra entradas en un evento para verlas aquí.'}
              </p>
            </div>
          )}

          {tickets.map((ticket) => (
            <article
              key={`${ticket.eventId || ticket.eventTitle}-${ticket.status}`}
              className={`overflow-hidden rounded-2xl bg-card shadow-md border border-border/40 ${ticket.status === 'pendiente' ? 'opacity-75 grayscale-[0.35]' : ''}`}
            >
              <button
                type="button"
                onClick={() => ticket.eventId && onViewEventDetail?.(ticket.eventId, ticket)}
                className="relative h-32 w-full overflow-hidden text-left"
              >
                <TicketCardMedia ticket={ticket} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="inline-block rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground mb-1">
                    {ticket.category}
                  </span>
                  <h3 className="text-base font-extrabold text-white leading-tight line-clamp-2">{ticket.eventTitle}</h3>
                </div>
              </button>
              <div className="p-4 space-y-3">
                {ticket.status === 'pendiente' && (
                  <PendingCountdown expiresAtTs={ticket.paymentExpiresAtTs} />
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground">{ticket.eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenTicketDetail && (
                    <button
                      type="button"
                      onClick={() => onOpenTicketDetail(ticket)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver boletos
                      {(ticket.eventTicketCount || 0) > 1 ? ` (${ticket.eventTicketCount})` : ''}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsView;
