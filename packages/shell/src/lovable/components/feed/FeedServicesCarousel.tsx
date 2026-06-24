import { Star } from 'lucide-react';
import { resolveEventImageUrl } from '@doevents/shared';

export interface FeedServiceCard {
  id: string;
  name: string;
  role: string;
  rating: number;
  handle: string;
  description: string;
  image: string;
}

const SERVICE_PROVIDERS: FeedServiceCard[] = [
  {
    id: 'sp-1',
    name: 'Daniel Arroyave',
    role: 'Cantante',
    rating: 5.0,
    handle: '@darromel',
    description:
      'Soy un talentoso cantante conocido por su poderosa voz y su carisma en el escenario. Con una carrera que abarca géneros como pop y balada, ha cautivado a millones de fans en todo el mundo.',
    image: luis,
  },
  {
    id: 'sp-2',
    name: 'Carlos Martínez',
    role: 'Fotógrafo',
    rating: 5.0,
    handle: '@carlosphoto',
    description:
      'Capturando momentos únicos en cada evento. Mi pasión por la fotografía me lleva a contar historias a través de imágenes.',
    image: carlos,
  },
  {
    id: 'sp-3',
    name: 'Laura Gómez',
    role: 'Diseñadora',
    rating: 4.9,
    handle: '@lauradg',
    description:
      'Transformo ideas en visuales impactantes con un enfoque creativo e innovador para proyectos aventureros.',
    image: laura,
  },
  {
    id: 'sp-4',
    name: 'María Rivera',
    role: 'Chef Catering',
    rating: 4.8,
    handle: '@chefmaria',
    description:
      'Cocina gourmet para eventos privados y corporativos. Sabores que sorprenden y conquistan a cada invitado.',
    image: maria,
  },
  {
    id: 'sp-5',
    name: 'Miguel Torres',
    role: 'DJ / Sonido',
    rating: 4.9,
    handle: '@djmiguel',
    description:
      'Música y producción de audio profesional para fiestas, bodas y eventos corporativos. La mejor energía en cada set.',
    image: miguel,
  },
  {
    id: 'sp-6',
    name: 'Pedro Lara',
    role: 'Logística',
    rating: 4.7,
    handle: '@pedroevents',
    description:
      'Coordinación integral de eventos: montaje, transporte y staff. Llevo tu evento del concepto a la realidad.',
    image: pedro,
  },
  {
    id: 'sp-7',
    name: 'Isabel Cano',
    role: 'Maestra de Ceremonia',
    rating: 5.0,
    handle: '@isabelmc',
    description:
      'Presentadora bilingüe con experiencia en bodas, galas y lanzamientos. Le pongo magia y ritmo a tu evento.',
    image: isabel,
  },
  {
    id: 'sp-8',
    name: 'Ana Pérez',
    role: 'Marketing/Publicidad',
    rating: 4.8,
    handle: '@anamkt',
    description:
      'Estrategias digitales para hacer brillar tu evento. Diseño campañas que conectan y convierten audiencias.',
    image: ana,
  },
];

interface FeedServicesCarouselProps {
  onOpenService?: (card: FeedServiceCard) => void;
}

const FeedServicesCarousel = ({ onOpenService }: FeedServicesCarouselProps) => {
  return (
    <section className="my-5">
      <div className="mx-4 mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Servicios cercanos a mi ubicación
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {SERVICE_PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpenService?.(p)}
            className="flex w-[68%] shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm sm:w-[260px] text-left active:scale-[0.98] transition-transform"
          >
            <div className="h-44 w-full overflow-hidden bg-muted">
              <img
                src={p.image}
                alt={p.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="text-base font-semibold text-foreground">{p.role}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Calificación</span>
                <span className="font-semibold text-foreground">
                  {p.rating.toFixed(1)}
                </span>
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{p.handle}</p>
              <p className="mt-1 text-xs leading-snug text-foreground/80">
                {p.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FeedServicesCarousel;