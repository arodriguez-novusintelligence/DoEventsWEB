import { useState } from 'react';
import { Heart, ChevronRight, CalendarDays, Music, Mic, MonitorPlay, Store, Smile, Trophy, MapPin, PartyPopper, Users, Briefcase, Home, Building2, Trees, Warehouse, Hotel, UtensilsCrossed, Truck, Camera, Mic2, ShieldCheck, Megaphone, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import dessertFestival from '@lovable/assets/dessert-festival.jpg';
import modernKitchen from '@lovable/assets/modern-kitchen.jpg';
import outdoorDining from '@lovable/assets/outdoor-dining.jpg';
import vintageCars from '@lovable/assets/vintage-cars.jpg';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';
import type { ServiceFormData } from '@lovable/data/servicesData';

type FilterType = 'todos' | 'eventos' | 'lugares' | 'perfiles';

type Category = {
  label: string;
  icon: LucideIcon;
  bg: string;
  color: string;
};

const categories: Category[] = [
  { label: 'Conciertos', icon: Music, bg: 'bg-pink-100', color: 'text-pink-500' },
  { label: 'Conferencias', icon: Mic, bg: 'bg-violet-100', color: 'text-violet-500' },
  { label: 'Exposiciones', icon: MonitorPlay, bg: 'bg-blue-100', color: 'text-blue-500' },
  { label: 'Ferias', icon: Store, bg: 'bg-emerald-100', color: 'text-emerald-500' },
  { label: 'Standup', icon: Smile, bg: 'bg-amber-100', color: 'text-amber-500' },
  { label: 'Deportes', icon: Trophy, bg: 'bg-orange-100', color: 'text-orange-500' },
  { label: 'Recorridos', icon: MapPin, bg: 'bg-teal-100', color: 'text-teal-500' },
  { label: 'Fiestas', icon: PartyPopper, bg: 'bg-fuchsia-100', color: 'text-fuchsia-500' },
];

const venueCategories: Category[] = [
  { label: 'Casa campestre', icon: Trees, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  { label: 'Salón eventos', icon: Building2, bg: 'bg-blue-100', color: 'text-blue-600' },
  { label: 'Finca', icon: Home, bg: 'bg-amber-100', color: 'text-amber-600' },
  { label: 'Hotel', icon: Hotel, bg: 'bg-pink-100', color: 'text-pink-600' },
  { label: 'Bodega', icon: Warehouse, bg: 'bg-violet-100', color: 'text-violet-600' },
  { label: 'Restaurante', icon: UtensilsCrossed, bg: 'bg-orange-100', color: 'text-orange-600' },
];

const serviceCategories: Category[] = [
  { label: 'Catering', icon: UtensilsCrossed, bg: 'bg-orange-100', color: 'text-orange-600' },
  { label: 'Entretenimiento', icon: Music, bg: 'bg-pink-100', color: 'text-pink-600' },
  { label: 'Multimedia', icon: Camera, bg: 'bg-blue-100', color: 'text-blue-600' },
  { label: 'Logística', icon: Truck, bg: 'bg-amber-100', color: 'text-amber-600' },
  { label: 'Seguridad', icon: ShieldCheck, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  { label: 'Marketing/publicidad', icon: Megaphone, bg: 'bg-violet-100', color: 'text-violet-600' },
  { label: 'Maestro Ceremonia/presentador', icon: Mic2, bg: 'bg-teal-100', color: 'text-teal-600' },
  { label: 'Servicio de transporte', icon: Truck, bg: 'bg-fuchsia-100', color: 'text-fuchsia-600' },
];

const favoriteEvents = [
  {
    id: 'f1',
    image: outdoorDining,
    title: 'TROPIPOP',
    date: '09/06/2026',
    location: 'Cra. 42a # 17A-38, Puente...',
    description: 'Concierto musical',
  },
  {
    id: 'f2',
    image: modernKitchen,
    title: 'Copia de Celebracion Cum...',
    date: '24/06/2026',
    location: 'Bogota - Colombia',
    description: 'Bienvenidos a la fiesta de Juanita es una fiesta de sobres',
  },
];

const nearbyEvents = [
  {
    id: 'n1',
    image: dessertFestival,
    title: 'Standup comedy Medellín',
    date: '19/06/2026',
    location: 'Cra. 42 #08 - 61 piso 2, El...',
    description: 'Standup comedy, humorista colombiano',
  },
  {
    id: 'n2',
    image: vintageCars,
    title: 'Expo Felino',
    date: '23/08/2026',
    location: 'Bloque 18, El Poblado, Itag...',
    description: 'Evento de mascotas',
  },
];

const recommendedEvents = [
  {
    id: 'r1',
    image: modernKitchen,
    title: 'Musical El Fantasma de La...',
    date: '23/06/2026',
    location: 'F3HJ+8PX, Centro Olimpic...',
    description: 'El Fantasma de la Ópera',
  },
  {
    id: 'r2',
    image: outdoorDining,
    title: 'Copia de Copia de Celebracion Cum...',
    date: '24/06/2026',
    location: 'Bogota - Colombia',
    description: 'Bienvenidos a la fiesta de Juanita es una fiesta de sobres',
  },
];

const otherEvents = [
  {
    id: 'o1',
    image: vintageCars,
    title: 'Standup comedy Medellín',
    date: '19/06/2026',
    location: 'Cra. 42 #08 - 61 piso 2, El Poblado, Medellín, El Poblado, Medellín, Antioquia, Colombia',
  },
  {
    id: 'o2',
    image: dessertFestival,
    title: 'Feria de las flores',
    date: '01/08/2026',
    location: 'Medellín - Antioquia',
  },
];

const upcomingEvents = [
  {
    id: 'u1',
    image: modernKitchen,
    title: 'Copia de Copia de Copia de Celebracion Cumpleanos SALOME',
  },
];

type EventItem = {
  id: string;
  image: string;
  title: string;
  date: string;
  location: string;
  description?: string;
};

const EventCard = ({ event, onClick }: { event: EventItem; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="min-w-[210px] max-w-[210px] flex-shrink-0 rounded-2xl bg-card shadow-sm overflow-hidden border border-border/40 text-left transition-transform active:scale-[0.98]"
  >
    <div className="relative h-36">
      <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
      <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-primary/90 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
        activo
      </span>
      <span className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
        <Heart className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </div>
    <div className="p-3.5">
      <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{event.title}</h3>
      <p className="mt-2 text-sm font-semibold text-foreground">{event.date}</p>
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{event.location}</p>
      {event.description && (
        <p className="mt-2 text-xs text-foreground/80 line-clamp-2">{event.description}</p>
      )}
    </div>
  </button>
);

const Dots = () => (
  <div className="mt-4 flex items-center justify-center gap-1.5">
    <span className="h-1.5 w-8 rounded-full bg-primary" />
    <span className="h-1.5 w-6 rounded-full bg-primary/30" />
    <span className="h-1.5 w-6 rounded-full bg-primary/20" />
  </div>
);

const SectionHeader = ({ title, action }: { title: string; action?: boolean }) => (
  <div className="flex items-end justify-between gap-3">
    <h2 className="text-lg font-extrabold text-foreground leading-tight">{title}</h2>
    {action && (
      <button className="flex items-center gap-0.5 text-sm font-semibold text-primary whitespace-nowrap">
        Ver más <ChevronRight className="h-4 w-4" />
      </button>
    )}
  </div>
);

interface EventsViewProps {
  publishedEvents?: EventItem[];
  publishedVenues?: PublishedVenueDraft[];
  publishedServices?: ServiceFormData[];
  onOpenEvent?: (event: EventItem) => void;
  onOpenVenue?: (venue: PublishedVenueDraft) => void;
  onOpenService?: (service: ServiceFormData) => void;
}

const defaultNearbyVenues: PublishedVenueDraft[] = [
  {
    id: 'nv-1',
    name: 'Finca Corralejas',
    link: '#',
    address: 'Rionegro - Antioquia',
    type: 'Casa campestre',
    capacity: 120,
    image: outdoorDining,
  },
  {
    id: 'nv-2',
    name: 'Salón Imperial',
    link: '#',
    address: 'El Poblado - Medellín',
    type: 'Salón de eventos',
    capacity: 300,
    image: modernKitchen,
  },
];

const VenueCard = ({ venue, onClick }: { venue: PublishedVenueDraft; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="min-w-[210px] max-w-[210px] flex-shrink-0 rounded-2xl bg-card shadow-sm overflow-hidden border border-border/40 text-left transition-transform active:scale-[0.98]"
  >
    <div className="relative h-36">
      <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
      <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-primary/90 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
        Lugar
      </span>
      <span className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
        <Heart className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </div>
    <div className="p-3.5">
      <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{venue.name}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{venue.address}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{venue.type}</span>
        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{venue.capacity}</span>
      </div>
    </div>
  </button>
);

const sectorImage = (sector: string): string => {
  const map: Record<string, string> = {
    'Catering': modernKitchen,
    'Entretenimiento': outdoorDining,
    'Multimedia': dessertFestival,
    'Logística': vintageCars,
    'Seguridad': outdoorDining,
    'Servicio de transporte': vintageCars,
    'Marketing/publicidad': dessertFestival,
    'Maestro Ceremonia/presentador': modernKitchen,
  };
  return map[sector] || modernKitchen;
};

const defaultServices: ServiceFormData[] = [
  {
    sectors: ['Catering'],
    activities: { Catering: ['Mesero', 'Barman'] },
    activityPricing: {
      'Catering::Mesero': { currency: 'COP', cost: '120000', pricingType: 'Por día', description: '' },
      'Catering::Barman': { currency: 'COP', cost: '180000', pricingType: 'Por día', description: '' },
    },
    pricingTypes: ['Por día'],
    selectedDates: ['2026-06-15'],
    blockedDates: [],
    globalStartTime: '09:00',
    globalEndTime: '23:00',
    bookingPreference: 'instant',
    refundPolicy: 'Hasta 7 días antes del inicio de la reserva',
    servicePhoto: '',
    galleryMedia: [],
    faqs: [],
    acceptedConditions: true,
    sectorOther: '',
    activityOthers: {},
    pricingOther: '',
    pricingDetails: [],
    selectedDays: [false, false, false, false, false, false, false],
    customSchedule: false,
    daySchedules: [],
  },
  {
    sectors: ['Entretenimiento'],
    activities: { Entretenimiento: ["DJ's", 'Cantante'] },
    activityPricing: {
      "Entretenimiento::DJ's": { currency: 'USD', cost: '450', pricingType: 'Por evento', description: '' },
      'Entretenimiento::Cantante': { currency: 'USD', cost: '300', pricingType: 'Por presentación', description: '' },
    },
    pricingTypes: ['Por evento', 'Por presentación'],
    selectedDates: ['2026-07-04'],
    blockedDates: [],
    globalStartTime: '20:00',
    globalEndTime: '03:00',
    bookingPreference: 'approval',
    refundPolicy: 'Hasta 30 días antes del inicio de la reserva',
    servicePhoto: '',
    galleryMedia: [],
    faqs: [],
    acceptedConditions: true,
    sectorOther: '',
    activityOthers: {},
    pricingOther: '',
    pricingDetails: [],
    selectedDays: [false, false, false, false, false, false, false],
    customSchedule: false,
    daySchedules: [],
  },
  {
    sectors: ['Multimedia'],
    activities: { Multimedia: ['Fotógrafo', 'Camarógrafo'] },
    activityPricing: {
      'Multimedia::Fotógrafo': { currency: 'COP', cost: '600000', pricingType: 'Por evento', description: '' },
      'Multimedia::Camarógrafo': { currency: 'COP', cost: '800000', pricingType: 'Por evento', description: '' },
    },
    pricingTypes: ['Por evento', 'Por servicio'],
    selectedDates: ['2026-08-10'],
    blockedDates: [],
    globalStartTime: '10:00',
    globalEndTime: '22:00',
    bookingPreference: 'instant',
    refundPolicy: 'Hasta 1 día antes del inicio de la reserva',
    servicePhoto: '',
    galleryMedia: [],
    faqs: [],
    acceptedConditions: true,
    sectorOther: '',
    activityOthers: {},
    pricingOther: '',
    pricingDetails: [],
    selectedDays: [false, false, false, false, false, false, false],
    customSchedule: false,
    daySchedules: [],
  },
];

const ServiceCard = ({ service, onClick }: { service: ServiceFormData; onClick?: () => void }) => {
  const sector = service.sectors[0] || 'Servicio';
  const activities = service.sectors.flatMap((s) => service.activities[s] || []).slice(0, 3);
  const allActivities = service.sectors.flatMap((s) =>
    (service.activities[s] || []).map((act) => ({ sector: s, activity: act }))
  );
  const lowestPricing = allActivities.reduce<{ cost: number; currency: string } | null>((best, { sector, activity }) => {
    const p = service.activityPricing[`${sector}::${activity}`];
    if (!p || !p.cost) return best;
    const num = Number(p.cost);
    return !best || num < best.cost ? { cost: num, currency: p.currency } : best;
  }, null);

  return (
    <button
      onClick={onClick}
      className="min-w-[210px] max-w-[210px] flex-shrink-0 rounded-2xl bg-card shadow-sm overflow-hidden border border-border/40 text-left transition-transform active:scale-[0.98]"
    >
      <div className="relative h-36">
        <img src={sectorImage(sector)} alt={sector} className="h-full w-full object-cover" />
        <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-full bg-primary/90 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">
          Servicio
        </span>
        <span className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm">
          <Heart className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{sector}</h3>
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
          {activities.join(', ') || 'Varias actividades'}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{activities.length} actividades</span>
        </div>
        {lowestPricing && lowestPricing.cost > 0 && (
          <p className="mt-2 text-xs font-semibold text-primary">
            Desde {lowestPricing.currency} {lowestPricing.cost.toLocaleString()}
          </p>
        )}
      </div>
    </button>
  );
};

const EventsView = ({ publishedEvents = [], publishedVenues = [], publishedServices = [], onOpenEvent, onOpenVenue, onOpenService }: EventsViewProps) => {
  const [filter, setFilter] = useState<FilterType>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allNearbyVenues = [...publishedVenues, ...defaultNearbyVenues];
  const allNearbyServices = [...publishedServices, ...defaultServices];

  const showEvents = filter === 'todos' || filter === 'eventos';
  const showVenues = filter === 'todos' || filter === 'lugares';
  const showServices = filter === 'todos' || filter === 'perfiles';

  // Filter services by selected sector when "perfiles" is active
  const filteredServices = filter === 'perfiles' && selectedCategory
    ? allNearbyServices.filter((s) => s.sectors.includes(selectedCategory))
    : allNearbyServices;

  const topStrip: { title: string; items: Category[] } | null =
    filter === 'eventos' ? { title: 'Tipo de eventos', items: categories } :
    filter === 'lugares' ? { title: 'Tipo de lugares', items: venueCategories } :
    filter === 'perfiles' ? { title: 'Tipo de servicios', items: serviceCategories } :
    null;

  const handleFilterChange = (next: FilterType) => {
    setFilter(next);
    setSelectedCategory(null);
  };

  const filterPills: { id: FilterType; label: string; dot: string }[] = [
    { id: 'todos', label: 'Todos', dot: '' },
    { id: 'eventos', label: 'Eventos', dot: 'bg-violet-500' },
    { id: 'lugares', label: 'Lugares', dot: 'bg-orange-500' },
    { id: 'perfiles', label: 'Servicios', dot: 'bg-emerald-500' },
  ];

  return (
    <div className="mx-auto max-w-lg pb-40 bg-background">
      {/* Filter pills - above category strip */}
      <div className="px-4 pt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {filterPills.map((p) => {
          const active = filter === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleFilterChange(p.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap shadow-sm transition-all border border-border/40 ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground hover:bg-accent/50'
              }`}
            >
              {p.dot && <span className={`h-2 w-2 rounded-full ${p.dot}`} />}
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Top category strip */}
      {topStrip && (
        <div className="px-4 pt-4">
          <h2 className="text-lg font-extrabold text-foreground">{topStrip.title}</h2>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {topStrip.items.map((c) => {
              const Icon = c.icon;
              const isActive = selectedCategory === c.label;
              const clickable = filter === 'perfiles';
              return (
                <button
                  key={c.label}
                  onClick={() => clickable && setSelectedCategory(isActive ? null : c.label)}
                  className="flex flex-col items-center gap-1.5 min-w-[64px] max-w-[64px]"
                >
                  <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary ring-2 ring-primary/40' : c.bg}`}>
                    <Icon className={`h-6 w-6 ${isActive ? 'text-primary-foreground' : c.color}`} strokeWidth={2} />
                  </div>
                  <span className={`text-[11px] font-medium text-center leading-tight line-clamp-2 ${isActive ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}


      {/* Tus eventos publicados (los que el usuario acaba de publicar) */}
      {showEvents && publishedEvents.length > 0 && (
        <section className="px-4 pt-6">
          <SectionHeader title="Tus eventos publicados" />
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {publishedEvents.map((e) => <EventCard key={e.id} event={e} onClick={() => onOpenEvent?.(e)} />)}
          </div>
        </section>
      )}

      {/* Eventos Favoritos */}
      {showEvents && (
        <section className="px-4 pt-6">
          <SectionHeader title="Eventos Favoritos" />
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {favoriteEvents.map((e) => <EventCard key={e.id} event={e} onClick={() => onOpenEvent?.(e)} />)}
          </div>
          <Dots />
        </section>
      )}

      {/* Eventos cercanos */}
      {showEvents && (
        <section className="px-4 pt-8 border-t border-border/60 mt-6">
          <div className="pt-6">
            <SectionHeader title="Eventos cercanos a tu ubicación" action />
            <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {nearbyEvents.map((e) => <EventCard key={e.id} event={e} onClick={() => onOpenEvent?.(e)} />)}
            </div>
            <Dots />
          </div>
        </section>
      )}

      {/* Lugares cercanos a mi ubicación */}
      {showVenues && (
        <section className="px-4 pt-8">
          <SectionHeader title="Lugares cercanos a mi ubicación" action />
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {allNearbyVenues.map((v) => <VenueCard key={v.id} venue={v} onClick={() => onOpenVenue?.(v)} />)}
          </div>
          <Dots />
        </section>
      )}

      {/* Servicios cercanos a mi ubicación */}
      {showServices && (
        <section className="px-4 pt-8">
          <SectionHeader
            title={selectedCategory ? `Servicios · ${selectedCategory}` : 'Servicios profesionales'}
            action
          />
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {filteredServices.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1 py-6">
                No hay perfiles que presten este servicio aún.
              </p>
            ) : (
              filteredServices.map((s, i) => <ServiceCard key={`svc-${i}`} service={s} onClick={() => onOpenService?.(s)} />)
            )}
          </div>
          <Dots />
        </section>
      )}

      {/* Eventos recomendados */}
      {showEvents && (
        <section className="px-4 pt-8">
          <SectionHeader title="Eventos recomendados" action />
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recommendedEvents.map((e) => <EventCard key={e.id} event={e} onClick={() => onOpenEvent?.(e)} />)}
          </div>
          <Dots />
        </section>
      )}

      {/* Tus eventos vigentes */}
      {showEvents && (
        <section className="px-4 pt-8">
          <h2 className="text-lg font-extrabold text-foreground">Tus eventos vigentes</h2>
          <div className="mt-3 space-y-3">
            {upcomingEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onOpenEvent?.({ id: e.id, image: e.image, title: e.title, date: '', location: '' })}
                className="flex w-full gap-3 rounded-2xl bg-card p-3 shadow-sm border border-border/40 items-center text-left active:scale-[0.99]"
              >
                <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden">
                  <img src={e.image} alt={e.title} className="h-full w-full object-cover" />
                  <span className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-primary/90 text-[9px] font-semibold text-primary-foreground">
                    activo
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground line-clamp-3 leading-snug pr-6">{e.title}</h3>
                </div>
                <Heart className="h-5 w-5 self-start text-primary" strokeWidth={2} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Otros eventos */}
      {showEvents && (
        <section className="px-4 pt-8">
          <h2 className="text-lg font-extrabold text-foreground">Otros eventos</h2>
          <div className="mt-3 space-y-3">
            {otherEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onOpenEvent?.(event)}
                className="flex w-full gap-3 rounded-2xl bg-card p-3 shadow-sm border border-border/40 text-left active:scale-[0.99]"
              >
                <div className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden">
                  <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                  <span className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-primary/90 text-[9px] font-semibold text-primary-foreground">
                    activo
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2">{event.title}</h3>
                    <Heart className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{event.date}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{event.location}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Crear evento CTA */}
      {showEvents && (
        <section className="px-4 pt-8 text-center">
          <div className="rounded-2xl bg-card border border-dashed border-border p-6 flex flex-col items-center">
            <CalendarDays className="h-12 w-12 text-primary/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              Crea tu primer evento y hazte conocer<br />en nuestra red de <strong className="text-foreground">eventers</strong>
            </p>
            <Button className="mt-4 w-full rounded-full" size="lg">
              Crear evento
            </Button>
          </div>
        </section>
      )}

    </div>
  );
};

export default EventsView;