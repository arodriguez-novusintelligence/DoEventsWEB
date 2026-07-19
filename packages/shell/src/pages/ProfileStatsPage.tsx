import React, { useEffect, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { useSelector } from 'react-redux';

import {

  fetchServicesByUserId,

  fetchUserEventsStats,

  fetchUserVenuesStatistics,

  RootState,

} from '@doevents/shared';

import StatsEventListView from '@lovable/components/stats/StatsEventListView';

import StatsServiceListView from '@lovable/components/stats/StatsServiceListView';

import StatsVenueListView from '@lovable/components/stats/StatsVenueListView';

import { userEventsToStatsRooms } from '../lovable-bridge/statsAdapter';

import type { EventChatRoom } from '@lovable/data/chatData';

import type { NearbyServiceProvider, VenueStatsListItem } from '@doevents/shared';

import { cn } from '@lovable/lib/utils';



type StatsTab = 'events' | 'venues' | 'services';



function parseTab(value: string | null): StatsTab {

  if (value === 'venues') return 'venues';

  if (value === 'services') return 'services';

  return 'events';

}



export const ProfileStatsPage: React.FC = () => {

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const userId = useSelector((s: RootState) => s.auth.idUser);

  const tab = parseTab(searchParams.get('tab'));

  const [loadingEvents, setLoadingEvents] = useState(true);

  const [loadingVenues, setLoadingVenues] = useState(true);

  const [loadingServices, setLoadingServices] = useState(true);

  const [eventsError, setEventsError] = useState<string | null>(null);

  const [venuesError, setVenuesError] = useState<string | null>(null);

  const [servicesError, setServicesError] = useState<string | null>(null);

  const [events, setEvents] = useState<EventChatRoom[]>([]);

  const [venues, setVenues] = useState<VenueStatsListItem[]>([]);

  const [services, setServices] = useState<NearbyServiceProvider[]>([]);



  useEffect(() => {

    if (!userId) {

      setEvents([]);

      setVenues([]);

      setServices([]);

      setLoadingEvents(false);

      setLoadingVenues(false);

      setLoadingServices(false);

      return;

    }



    let cancelled = false;

    setLoadingEvents(true);

    setEventsError(null);

    fetchUserEventsStats(userId, { allEvents: true, forceNetwork: true })

      .then((res) => {

        if (!cancelled) {

          setEvents(userEventsToStatsRooms(res.data?.datosEvento || []));

        }

      })

      .catch((err) => {

        if (!cancelled) {

          setEvents([]);

          setEventsError(err instanceof Error ? err.message : 'No se pudieron cargar los eventos');

        }

      })

      .finally(() => {

        if (!cancelled) setLoadingEvents(false);

      });



    setLoadingVenues(true);

    setVenuesError(null);

    fetchUserVenuesStatistics(userId)

      .then((list) => {

        if (!cancelled) setVenues(list);

      })

      .catch((err) => {

        if (!cancelled) {

          setVenues([]);

          setVenuesError(err instanceof Error ? err.message : 'No se pudieron cargar los lugares');

        }

      })

      .finally(() => {

        if (!cancelled) setLoadingVenues(false);

      });



    setLoadingServices(true);

    setServicesError(null);

    fetchServicesByUserId(userId, { includeInactive: true })

      .then((list) => {

        if (!cancelled) setServices(list);

      })

      .catch((err) => {

        if (!cancelled) {

          setServices([]);

          setServicesError(err instanceof Error ? err.message : 'No se pudieron cargar los servicios');

        }

      })

      .finally(() => {

        if (!cancelled) setLoadingServices(false);

      });



    return () => { cancelled = true; };

  }, [userId]);



  const setTab = (next: StatsTab) => {

    if (next === 'events') {

      setSearchParams({});

      return;

    }

    setSearchParams({ tab: next });

  };



  const showTabSwitcher = !searchParams.get('view') && !searchParams.get('event') && !searchParams.get('venue') && !searchParams.get('service');



  const tabSwitcher = showTabSwitcher ? (

    <div className="mx-auto max-w-lg px-4 pt-3">

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-card p-1 shadow-sm">

        {([

          { id: 'events' as const, label: 'Eventos' },

          { id: 'venues' as const, label: 'Lugares' },

          { id: 'services' as const, label: 'Servicios' },

        ]).map((item) => (

          <button

            key={item.id}

            type="button"

            onClick={() => setTab(item.id)}

            className={cn(

              'rounded-xl px-2 py-2 text-xs sm:text-sm font-semibold transition',

              tab === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',

            )}

          >

            {item.label}

          </button>

        ))}

      </div>

    </div>

  ) : null;



  if (tab === 'venues') {

    return (

      <>

        {tabSwitcher}

        <StatsVenueListView

          venues={venues}

          loading={loadingVenues}

          loadError={venuesError}

          onBack={() => navigate('/profile')}

          onViewProfile={(user) => {

            const id = 'id' in user ? user.id : undefined;

            if (id) navigate(`/users/${id}`);

          }}

        />

      </>

    );

  }



  if (tab === 'services') {

    return (

      <>

        {tabSwitcher}

        <StatsServiceListView

          services={services}

          loading={loadingServices}

          loadError={servicesError}

          onBack={() => navigate('/profile')}

          onViewProfile={(user) => {

            const id = 'id' in user ? user.id : undefined;

            if (id) navigate(`/users/${id}`);

          }}

        />

      </>

    );

  }



  return (

    <>

      {tabSwitcher}

      <StatsEventListView

        events={events}

        loading={loadingEvents}

        loadError={eventsError}

        onBack={() => navigate('/profile')}

        onViewProfile={(user) => {

          const id = 'id' in user ? user.id : undefined;

          if (id) navigate(`/users/${id}`);

        }}

      />

    </>

  );

};



export default ProfileStatsPage;

