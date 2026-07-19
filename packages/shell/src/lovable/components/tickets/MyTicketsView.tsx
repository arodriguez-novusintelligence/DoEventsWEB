import { useMemo, useState } from 'react';

import { ChevronLeft, ChevronRight, Calendar, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

import { useTickets, Ticket, TicketStatus } from '@lovable/data/ticketsData';

import EventTicketOrdersView from './EventTicketOrdersView';

import { groupTicketsByEventForListView } from '../../../lovable-bridge/ticketsAdapter';

import type { PurchaseTabStatus } from '../../../lovable-bridge/purchasesAdapter';

import PurchaseStatusTabs from '@lovable/components/purchases/PurchaseStatusTabs';

import { Button } from '@lovable/components/ui/button';



interface MyTicketsViewProps {

  onBack: () => void;

  tickets?: Ticket[];

  loading?: boolean;

  loadError?: string | null;

  onRetry?: () => void;

  initialTab?: TicketStatus;

  onViewEventDetail?: (eventId: string, ticket: Ticket) => void;

  onOpenTicketDetail?: (ticket: Ticket, action?: 'transfer' | 'refund') => void;

  initialSelectedTicketId?: string | null;

  onSelectedTicketChange?: (ticketId: string | null) => void;

}



const TAB_MAP: Record<TicketStatus, PurchaseTabStatus> = {

  aprobada: 'aprobada',

  pendiente: 'pendiente',

  cancelada: 'cancelada',

  finalizada: 'finalizada',

};



const MyTicketsView = ({

  onBack,

  tickets: ticketsProp,

  loading = false,

  loadError = null,

  onRetry,

  initialTab = 'aprobada',

  onViewEventDetail,

  onOpenTicketDetail,

}: MyTicketsViewProps) => {

  const storeTickets = useTickets();

  const allTickets = ticketsProp ?? storeTickets;

  const [activeTab, setActiveTab] = useState<PurchaseTabStatus>(TAB_MAP[initialTab] || 'aprobada');

  const [selectedEventGroupId, setSelectedEventGroupId] = useState<string | null>(null);



  const counts = useMemo(() => ({

    aprobada: allTickets.filter((t) => t.status === 'aprobada').length,

    pendiente: allTickets.filter((t) => t.status === 'pendiente').length,

    cancelada: allTickets.filter((t) => t.status === 'cancelada').length,

    finalizada: allTickets.filter((t) => t.status === 'finalizada').length,

  }), [allTickets]);



  const statusFilter: TicketStatus = activeTab as TicketStatus;



  const groupedEvents = useMemo(

    () => groupTicketsByEventForListView(allTickets.filter((t) => t.status === statusFilter)),

    [allTickets, statusFilter],

  );



  const selectedEventGroup = useMemo(

    () => groupedEvents.find((group) => group.id === selectedEventGroupId) ?? null,

    [groupedEvents, selectedEventGroupId],

  );



  const openEventOrders = (eventGroupId: string) => {

    setSelectedEventGroupId(eventGroupId);

  };



  const openOrder = (ticket: Ticket, action?: 'transfer' | 'refund') => {

    if (onOpenTicketDetail) {

      onOpenTicketDetail(ticket, action);

    }

  };



  if (selectedEventGroup) {

    return (

      <EventTicketOrdersView

        eventGroup={selectedEventGroup}

        onBack={() => setSelectedEventGroupId(null)}

        onOpenOrder={openOrder}

        onCompletePayment={activeTab === 'pendiente' ? openOrder : undefined}

        onViewEventDetail={onViewEventDetail

          ? () => onViewEventDetail(selectedEventGroup.eventId, selectedEventGroup.representativeTicket)

          : undefined}

      />

    );

  }



  return (

    <div className="min-h-screen bg-secondary pb-36">

      <div className="mx-auto max-w-lg px-4 pt-4">

        <button

          type="button"

          onClick={onBack}

          className="mb-4 flex items-center gap-1 text-sm font-semibold text-primary"

        >

          <ChevronLeft className="h-5 w-5" />

          Atrás

        </button>



        <PurchaseStatusTabs

          activeTab={activeTab}

          counts={counts}

          onChange={(tab) => {

            setSelectedEventGroupId(null);

            setActiveTab(tab);

          }}

        />



        <div className="mt-4 space-y-2">

          {loading ? (

            <div className="flex flex-col items-center gap-3 rounded-2xl bg-card py-12 shadow-sm">

              <Loader2 className="h-8 w-8 animate-spin text-primary" />

              <p className="text-sm text-muted-foreground">Cargando boletas…</p>

            </div>

          ) : loadError ? (

            <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">

              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />

              <p className="mt-3 text-sm font-medium text-destructive">{loadError}</p>

              {onRetry && (

                <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={onRetry}>

                  <RefreshCw className="mr-2 h-4 w-4" />

                  Reintentar

                </Button>

              )}

            </div>

          ) : groupedEvents.length === 0 ? (

            <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">

              No tienes boletas en esta categoría.

            </div>

          ) : (

            groupedEvents.map((eventGroup) => (

              <button

                key={eventGroup.id}

                type="button"

                onClick={() => openEventOrders(eventGroup.id)}

                className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]"

              >

                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">

                  {eventGroup.eventImage ? (

                    <img

                      src={eventGroup.eventImage}

                      alt={eventGroup.eventTitle}

                      className="h-full w-full object-cover"

                    />

                  ) : (

                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-[10px] font-bold text-primary">

                      Evento

                    </div>

                  )}

                </div>

                <div className="min-w-0 flex-1">

                  <h3 className="truncate text-sm font-extrabold text-foreground">{eventGroup.eventTitle}</h3>

                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">

                    <Calendar className="h-3.5 w-3.5 text-primary" />

                    <span>{eventGroup.eventDate}</span>

                  </div>

                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-primary" />

              </button>

            ))

          )}

        </div>

      </div>

    </div>

  );

};



export default MyTicketsView;

