import { useState } from 'react';
import { ChevronLeft, Ticket as TicketIcon, Eye, Calendar } from 'lucide-react';
import { useTickets, Ticket, TicketStatus } from '@lovable/data/ticketsData';
import TicketDetailView from './TicketDetailView';

import { groupTicketsForListView } from '../../../lovable-bridge/ticketsAdapter';
import { useReservationTimer, isPlaceholderEventImage } from '@doevents/shared';
interface MyTicketsViewProps {
  onBack: () => void;
  onViewEventDetail?: (eventId: string, ticket: Ticket) => void;
  initialSelectedTicketId?: string | null;
  onSelectedTicketChange?: (ticketId: string | null) => void;
}

const TABS: { key: TicketStatus; label: string; dot: string }[] = [
  { key: 'aprobada', label: 'Aprobadas', dot: 'bg-emerald-500' },
  { key: 'pendiente', label: 'Pendientes', dot: 'bg-amber-500' },
  { key: 'cancelada', label: 'Canceladas', dot: 'bg-destructive' },
  { key: 'finalizada', label: 'Finalizadas', dot: 'bg-muted-foreground' },
];

const MyTicketsView = ({ onBack, onViewEventDetail, initialSelectedTicketId, onSelectedTicketChange }: MyTicketsViewProps) => {
  const [activeTab, setActiveTab] = useState<TicketStatus>('aprobada');
  const allTicketsForInit = useTickets();
  const [selected, setSelected] = useState<Ticket | null>(() => {
    if (!initialSelectedTicketId) return null;
    return allTicketsForInit.find((t) => t.id === initialSelectedTicketId) ?? null;
  });

  const setSelectedAndNotify = (t: Ticket | null) => {
    setSelected(t);
    onSelectedTicketChange?.(t ? t.id : null);
  };
  
  const allTickets = useTickets();

  if (selected) {
    return (
      <TicketDetailView
        ticket={selected}
        onBack={() => setSelected(null)}
        onViewEventDetail={() => {
          if (onViewEventDetail) onViewEventDetail(selected.eventId || selected.id, selected);
        }}
      />
    );
  }

  const counts: Record<TicketStatus, number> = {
    aprobada: allTickets.filter((t) => t.status === 'aprobada').length,
    pendiente: 0,
    cancelada: 2,
    finalizada: 32,
  };

  const tickets = allTickets.filter((t) => t.status === activeTab);

  return (
    <div className="min-h-screen bg-secondary pb-36">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-5 pb-10 rounded-b-3xl">
        <div className="mx-auto max-w-lg">
          <button onClick={onBack} className="flex items-center gap-1 text-primary-foreground/90 font-medium mb-3 text-sm">
            <ChevronLeft className="h-5 w-5" /> Atrás
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
              <TicketIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-primary-foreground leading-tight">Mis boletas</h1>
              <p className="text-xs text-primary-foreground/80">{allTickets.length} boletas en total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-6">
        {/* Tabs card */}
        <div className="rounded-2xl bg-card p-2 shadow-md grid grid-cols-4 gap-1">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
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

        {/* List */}
        <div className="mt-5 space-y-4">
          {tickets.length === 0 ? (
            <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
              No tienes boletas en esta categoría.
            </div>
          ) : (
            tickets.map((t) => (
              <article
                key={t.id}
                className="overflow-hidden rounded-2xl bg-card shadow-md border border-border/40"
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <img src={t.eventImage} alt={t.eventTitle} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="inline-block rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground mb-1">
                      {t.category}
                    </span>
                    <h3 className="text-base font-extrabold text-primary-foreground leading-tight line-clamp-2">{t.eventTitle}</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground">{t.eventDate}</span>
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => setSelected(t)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver boletos
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTicketsView;
