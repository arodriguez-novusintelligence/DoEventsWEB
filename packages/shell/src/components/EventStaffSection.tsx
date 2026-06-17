import React, { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Plus, Star, Briefcase, MessageSquare } from 'lucide-react';

import {

  fetchNearbyServices,

  fetchServiceById,

  fetchUserById,

  getStoredUserLocation,

  resolveImageUrl,

  type NearbyServiceProvider,

} from '@doevents/shared';

import BookingSheet, { type BookingData } from '@lovable/components/services/BookingSheet';

import PaymentGatewaySheet from '@lovable/components/services/PaymentGatewaySheet';

import {

  apiServiceToForm,

  serviceActivityLabel,

  serviceCoverUrl,

  serviceDisplayName,

} from '../lovable-bridge/serviceFormMapper';

import type { ServiceFormData } from '@lovable/data/servicesData';

import { toast } from 'sonner';



export interface HiredServiceRef {

  serviceId: string;

  name: string;

  role: string;

  rating?: number;

  profileImageUrl?: string;

  providerUserId?: string;

}



interface EventStaffSectionProps {

  eventId: string;

  isOwner?: boolean;

  userId?: string;

  hired?: HiredServiceRef[];

  onHiredChange?: (services: HiredServiceRef[]) => void;

}



function serviceInitials(name: string): string {

  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'SV';

}



function ServiceAvatar({ service }: { service: { name: string; profileImageUrl?: string } }) {

  const [failed, setFailed] = useState(false);

  const url = service.profileImageUrl;

  if (!url || failed) {

    return (

      <div className="h-12 w-12 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">

        {serviceInitials(service.name)}

      </div>

    );

  }

  return (

    <img

      src={url}

      alt={service.name}

      className="h-12 w-12 shrink-0 rounded-full object-cover"

      onError={() => setFailed(true)}

    />

  );

}



function mapProviderAddons(

  services: NearbyServiceProvider[],

  primary: NearbyServiceProvider,

) {

  return services

    .filter((item) => item.serviceId !== primary.serviceId)

    .map((item) => {

      const prices = Object.values(item.pricing || {});

      const best = prices.reduce<{ cost: number; currency: string } | null>((acc, entry) => {

        const cost = Number(entry?.cost || item.minPrice || 0);

        if (!cost) return acc;

        if (!acc || cost < acc.cost) {

          return { cost, currency: entry?.currency || item.currency || 'COP' };

        }

        return acc;

      }, null);

      return {

        name: serviceActivityLabel(item),

        pricePerDay: best?.cost || Number(item.minPrice || 0),

        quantity: 0,

      };

    })

    .filter((item) => item.pricePerDay > 0);

}



export const EventStaffSection: React.FC<EventStaffSectionProps> = ({

  eventId,

  isOwner,

  userId,

  hired = [],

  onHiredChange,

}) => {

  const navigate = useNavigate();

  const [nearby, setNearby] = useState<NearbyServiceProvider[]>([]);

  const [bookingService, setBookingService] = useState<ServiceFormData | null>(null);

  const [bookingMeta, setBookingMeta] = useState<NearbyServiceProvider | null>(null);

  const [bookingOpen, setBookingOpen] = useState(false);

  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  const [paymentOpen, setPaymentOpen] = useState(false);

  const [buyerProfile, setBuyerProfile] = useState({

    firstName: '',

    lastName: '',

    email: '',

  });



  useEffect(() => {

    const loc = getStoredUserLocation();

    if (!loc) return;

    fetchNearbyServices(loc.lat, loc.lng, 50, 20)

      .then(setNearby)

      .catch(() => setNearby([]));

  }, [eventId]);



  useEffect(() => {

    if (!userId) return;

    fetchUserById(userId)

      .then((profile) => {

        if (!profile) return;

        setBuyerProfile({

          firstName: profile.nombre || '',

          lastName: profile.apellido || '',

          email: profile.email || '',

        });

      })

      .catch(() => undefined);

  }, [userId]);



  const additionalServiceOptions = useMemo(() => {

    if (!bookingMeta) return [];

    const sameProvider = nearby.filter((item) => item.userId === bookingMeta.userId);

    return mapProviderAddons(sameProvider, bookingMeta);

  }, [bookingMeta, nearby]);



  const persistHired = (next: HiredServiceRef[]) => {

    onHiredChange?.(next);

    try {

      localStorage.setItem(`doevents_event_staff_${eventId}`, JSON.stringify(next));

    } catch { /* ignore */ }

  };



  const hireService = (s: NearbyServiceProvider) => {

    if (hired.some((h) => h.serviceId === s.serviceId)) {

      toast.info('Este servicio ya está contratado para el evento');

      return;

    }

    const next = [

      ...hired,

      {

        serviceId: s.serviceId,

        name: s.name,

        role: serviceActivityLabel(s),

        rating: s.rating,

        profileImageUrl: resolveImageUrl(s.profileImageUrl) || s.profileImageUrl,

        providerUserId: s.userId,

      },

    ];

    persistHired(next);

    toast.success(`${s.name} asociado al evento`);

  };



  const openContract = async (s: NearbyServiceProvider) => {

    if (!userId) {

      toast.error('Inicia sesión para contratar servicios');

      navigate('/auth/login');

      return;

    }

    try {

      const full = await fetchServiceById(s.serviceId);

      const provider = full || s;

      setBookingMeta(provider);

      setBookingService(apiServiceToForm(provider));

      setBookingOpen(true);

    } catch {

      toast.error('No se pudo cargar el servicio');

    }

  };



  const openDetail = (serviceId: string) => {

    navigate(`/services/${serviceId}`);

  };



  const openChat = (providerUserId?: string) => {

    if (!providerUserId) {

      toast.error('No se encontró el proveedor del servicio');

      return;

    }

    navigate(`/chat?userId=${encodeURIComponent(providerUserId)}`);

  };



  if (!isOwner && !hired.length) return null;



  return (

    <>

      <div className="rounded-2xl bg-card p-4 shadow-sm border border-border/40">

        <div className="flex items-center gap-2 mb-2">

          <Briefcase className="h-5 w-5 text-primary" />

          <h3 className="font-bold text-foreground">Servicios del evento</h3>

        </div>

        <p className="text-xs text-muted-foreground mb-3">

          Agrega servicios cercanos (hasta 50 km): DJs, catering, fotografía y más.

        </p>



        {hired.length > 0 && (

          <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">

            {hired.map((s) => (

              <button

                key={s.serviceId}

                type="button"

                onClick={() => openDetail(s.serviceId)}

                className="min-w-[180px] shrink-0 rounded-xl border border-border/60 bg-muted/30 p-3 text-left"

              >

                <div className="flex items-center gap-2">

                  <ServiceAvatar service={s} />

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-foreground line-clamp-1">{s.name}</p>

                    <p className="text-xs text-primary line-clamp-2">{s.role}</p>

                  </div>

                </div>

                {s.rating != null && (

                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">

                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />

                    {s.rating.toFixed(1)}

                  </p>

                )}

              </button>

            ))}

          </div>

        )}



        {isOwner && (

          <div className="space-y-3">

            {nearby.map((s) => {

              const cover = serviceCoverUrl(s);

              const label = serviceActivityLabel(s);

              const alreadyHired = hired.some((h) => h.serviceId === s.serviceId);

              return (

                <div

                  key={s.serviceId}

                  className="rounded-xl border border-dashed border-primary/40 p-3"

                >

                  <button

                    type="button"

                    onClick={() => openDetail(s.serviceId)}

                    className="flex w-full items-center gap-3 text-left"

                  >

                    {cover ? (

                      <img src={cover} alt="" className="h-12 w-12 rounded-full object-cover" />

                    ) : (

                      <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">

                        {serviceInitials(s.name)}

                      </div>

                    )}

                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-semibold line-clamp-1">{s.name}</p>

                      <p className="text-xs text-muted-foreground line-clamp-2">{label}</p>

                    </div>

                  </button>

                  <div className="mt-2 flex items-center justify-between gap-2">

                    <button

                      type="button"

                      onClick={() => openChat(s.userId)}

                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"

                    >

                      <MessageSquare className="h-3.5 w-3.5" />

                      Chat

                    </button>

                    <button

                      type="button"

                      disabled={alreadyHired}

                      onClick={() => openContract(s)}

                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-50"

                    >

                      <Plus className="h-3.5 w-3.5" />

                      {alreadyHired ? 'Contratado' : 'Contratar'}

                    </button>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </div>



      {bookingService && (

        <BookingSheet

          open={bookingOpen}

          onOpenChange={setBookingOpen}

          service={bookingService}

          additionalServiceOptions={additionalServiceOptions}

          liveBooking={

            userId && bookingMeta

              ? {

                  serviceId: bookingMeta.serviceId,

                  userId,

                  buyer: buyerProfile,

                }

              : undefined

          }

          onProceedToPayment={(booking) => {

            setBookingData(booking);

            setBookingOpen(false);

            setPaymentOpen(true);

          }}

        />

      )}



      <PaymentGatewaySheet

        open={paymentOpen}

        onOpenChange={setPaymentOpen}

        booking={bookingData}

        sellerName={bookingMeta ? serviceDisplayName(bookingMeta) : undefined}

        onSuccess={() => {

          if (bookingMeta) hireService(bookingMeta);

          setPaymentOpen(false);

          setBookingData(null);

        }}

      />

    </>

  );

};



export default EventStaffSection;

