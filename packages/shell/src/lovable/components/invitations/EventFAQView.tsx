import { ChevronLeft } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  { q: '¿Hay parqueo?', a: 'Sí hay parqueo disponible en el lugar del evento, con capacidad limitada. Recomendamos llegar con anticipación.' },
  { q: '¿Hay comida?', a: 'Sí hay venta de comida y bebidas durante todo el evento, con opciones vegetarianas y sin gluten.' },
  { q: '¿Puedo ingresar con menores de edad?', a: 'Sí, los menores de 12 años entran gratis acompañados de un adulto responsable.' },
  { q: '¿Se permite el ingreso con cámaras?', a: 'Se permiten cámaras personales, no profesionales ni con trípode sin autorización previa del organizador.' },
  { q: '¿Qué pasa si llueve?', a: 'El evento se realiza bajo techo, así que se desarrollará normalmente sin importar el clima.' },
  { q: '¿Aceptan pago en efectivo en el lugar?', a: 'No, todos los boletos deben adquirirse previamente a través de la plataforma Do.Events.' },
  { q: '¿Puedo transferir mi boleta?', a: 'Sí, desde la sección "Mis Boletos" puedes transferir tu boleta a otra persona registrada en la plataforma.' },
];

const EventFAQView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="mx-auto max-w-lg pb-24 min-h-screen bg-background">
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-4">
          <ChevronLeft className="h-5 w-5" />
          Atras
        </button>
        <h1 className="text-2xl font-extrabold text-primary leading-tight mb-5">
          Preguntas frecuentes
        </h1>
        <div className="space-y-4">
          {FAQS.map((f, i) => (
            <div key={i} className="rounded-2xl bg-card p-5 shadow-sm">
              <p className="font-bold text-foreground mb-2">{f.q}</p>
              <p className="text-sm text-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventFAQView;
