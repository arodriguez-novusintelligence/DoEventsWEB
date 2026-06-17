import { useEffect, useMemo, useState } from 'react';

import {

  Briefcase,

  CalendarDays,

  ChevronLeft,

  DollarSign,

  MessageSquare,

  Star,

} from 'lucide-react';

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

  serviceDisplayName,

} from '../../../lovable-bridge/serviceFormMapper';

import type { ServiceFormData } from '@lovable/data/servicesData';

import { toast } from 'sonner';



interface Props {

  profileName: string;

  profileAvatar?: string;

  services: NearbyServiceProvider[];

  viewerUserId?: string;

  onBack: () => void;

  onOpenService: (serviceId: string) => void;

}



function serviceCover(service: NearbyServiceProvider): string | undefined {

  return resolveImageUrl(service.profileImageUrl || service.gallery?.[0]);

}



function activityCount(service: NearbyServiceProvider): number {

  return Object.values(service.activities || {}).reduce((sum, list) => sum + (list?.length || 0), 0);

}



function lowestPrice(service: NearbyServiceProvider): { cost: number; currency: string } | null {

  const fromMin = Number(service.minPrice || 0);

  if (fromMin > 0) {

    return { cost: fromMin, currency: service.currency || 'COP' };

  }

  let best: { cost: number; currency: string } | null = null;

  Object.values(service.pricing || {}).forEach((p) => {

    const cost = Number(p?.cost || 0);

    if (!cost) return;

    const currency = p?.currency || service.currency || 'COP';

    if (!best || cost < best.cost) best = { cost, currency };

  });

  return best;

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



const UserServicesGrid = ({

  profileName,

  profileAvatar,

  services,

  viewerUserId,

  onBack,

  onOpenService,

}: Props) => {

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

  const [nearbyAddons, setNearbyAddons] = useState<NearbyServiceProvider[]>([]);



  useEffect(() => {

    if (!viewerUserId) return;

    fetchUserById(viewerUserId)

      .then((profile) => {

        if (!profile) return;

        setBuyerProfile({

          firstName: profile.nombre || '',

          lastName: profile.apellido || '',

          email: profile.email || '',

        });

      })

      .catch(() => undefined);

  }, [viewerUserId]);



  useEffect(() => {

    const loc = getStoredUserLocation();

    if (!loc) return;

    fetchNearbyServices(loc.lat, loc.lng, 100, 40)

      .then(setNearbyAddons)

      .catch(() => setNearbyAddons([]));

  }, []);



  const additionalServiceOptions = useMemo(() => {

    if (!bookingMeta) return [];

    const sameProvider = [

      ...services.filter((item) => item.userId === bookingMeta.userId),

      ...nearbyAddons.filter((item) => item.userId === bookingMeta.userId),

    ];

    return mapProviderAddons(sameProvider, bookingMeta);

  }, [bookingMeta, nearbyAddons, services]);



  const openBooking = async (service: NearbyServiceProvider) => {

    if (!viewerUserId) {

      toast.error('Inicia sesión para reservar servicios');

      return;

    }

    try {

      const full = await fetchServiceById(service.serviceId);

      const provider = full || service;

      setBookingMeta(provider);

      setBookingService(apiServiceToForm(provider));

      setBookingOpen(true);

    } catch {

      toast.error('No se pudo cargar el servicio');

    }

  };



  return (

    <>

      <div className="mx-auto max-w-lg min-h-screen bg-background pb-24">

        <div className="sticky top-0 z-10 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur">

          <button

            type="button"

            onClick={onBack}

            className="mb-2 flex items-center gap-1 text-sm font-semibold text-primary"

          >

            <ChevronLeft className="h-4 w-4" />

            Volver

          </button>

          <div className="flex items-center gap-3">

            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary/30 bg-muted">

              {profileAvatar ? (

                <img src={profileAvatar} alt="" className="h-full w-full object-cover" />

              ) : (

                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">

                  {profileName.slice(0, 2).toUpperCase()}

                </div>

              )}

            </div>

            <div className="min-w-0">

              <p className="truncate text-base font-bold text-foreground">Servicios de {profileName}</p>

              <p className="text-xs text-muted-foreground">

                {services.length} {services.length === 1 ? 'servicio publicado' : 'servicios publicados'}

              </p>

            </div>

          </div>

        </div>



        <div className="px-4 pt-4">

          {services.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">

              Este perfil aún no tiene servicios publicados.

            </div>

          ) : (

            <div className="grid grid-cols-2 gap-3">

              {services.map((service) => {

                const sector = serviceActivityLabel(service);

                const cover = serviceCover(service);

                const price = lowestPrice(service);

                const rating = Number(service.rating || 0);

                const reviews = Number(service.reviewCount || 0);

                return (

                  <div

                    key={service.serviceId}

                    className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm"

                  >

                    <button

                      type="button"

                      onClick={() => onOpenService(service.serviceId)}

                      className="text-left"

                    >

                      <div className="relative h-28 w-full overflow-hidden bg-muted">

                        {cover ? (

                          <img src={cover} alt={sector} className="h-full w-full object-cover" />

                        ) : (

                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">

                            Sin foto

                          </div>

                        )}

                        <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-card/90 backdrop-blur">

                          <Briefcase className="h-3.5 w-3.5 text-primary" />

                        </div>

                      </div>

                      <div className="flex flex-1 flex-col gap-1 p-3">

                        <p className="line-clamp-2 text-sm font-bold leading-tight text-foreground">

                          {service.name || sector}

                        </p>

                        <p className="line-clamp-2 text-[11px] text-muted-foreground">{sector}</p>

                        {price && (

                          <p className="mt-0.5 flex items-center gap-0.5 text-[11px] font-semibold text-primary">

                            <DollarSign className="h-3 w-3" />

                            Desde {price.currency} {price.cost.toLocaleString('es-CO')}

                          </p>

                        )}

                      </div>

                    </button>

                    <div className="flex items-center justify-between border-t border-border/60 px-3 py-2">

                      <div className="flex items-center gap-1">

                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />

                        <span className="text-[11px] font-semibold text-foreground">

                          {rating > 0 ? rating.toFixed(1) : 'Nuevo'}

                        </span>

                        {reviews > 0 && (

                          <span className="text-[10px] text-muted-foreground">({reviews})</span>

                        )}

                      </div>

                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">

                        <MessageSquare className="h-3 w-3" />

                        {reviews}

                      </span>

                    </div>

                    <div className="grid grid-cols-2 border-t border-border">

                      <button

                        type="button"

                        onClick={() => onOpenService(service.serviceId)}

                        className="py-2.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted/40"

                      >

                        Ver detalle

                      </button>

                      <button

                        type="button"

                        onClick={() => { void openBooking(service); }}

                        className="flex items-center justify-center gap-1 border-l border-border py-2.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/5"

                      >

                        <CalendarDays className="h-3 w-3" />

                        Reservar

                      </button>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>

      </div>



      {bookingService && (

        <BookingSheet

          open={bookingOpen}

          onOpenChange={setBookingOpen}

          service={bookingService}

          additionalServiceOptions={additionalServiceOptions}

          liveBooking={

            viewerUserId && bookingMeta

              ? {

                  serviceId: bookingMeta.serviceId,

                  userId: viewerUserId,

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

          toast.success('¡Reserva confirmada!');

          setPaymentOpen(false);

          setBookingData(null);

        }}

      />

    </>

  );

};



export default UserServicesGrid;

