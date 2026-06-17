import {
  Bed,
  Car,
  Bike,
  Waves,
  Bath,
  Footprints,
  Music,
  Sunset,
  Trees,
  Flower2,
  Flame,
  Droplet,
  Wine,
  Cigarette,
  Shirt,
  Gamepad2,
  Coffee,
  UtensilsCrossed,
  Users,
  PartyPopper,
  DoorOpen,
  ShowerHead,
  type LucideIcon,
} from "lucide-react";

export interface FacilidadOption {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
}

export const facilidadesDetailed: FacilidadOption[] = [
  { id: "hospedaje", label: "Hospedaje (capacidad)", description: "Incluye número de habitaciones y baños", icon: Bed },
  { id: "habitaciones", label: "Habitaciones", icon: DoorOpen },
  { id: "banos", label: "Baños", icon: ShowerHead },
  { id: "parqueadero-carro", label: "Parqueadero carro", icon: Car },
  { id: "parqueadero-moto", label: "Parqueadero Moto", icon: Bike },
  { id: "piscina", label: "Piscina", icon: Waves },
  { id: "jacuzzi", label: "Jacuzzi", icon: Bath },
  { id: "pista-baile", label: "Pista de baile", icon: Footprints },
  { id: "tarima", label: "Tarima", icon: Music },
  { id: "terraza", label: "Terraza", icon: Sunset },
  { id: "jardines", label: "Jardines", icon: Trees },
  { id: "spa", label: "Spa", icon: Flower2 },
  { id: "sauna", label: "Sauna", icon: Flame },
  { id: "turco", label: "Turco", icon: Droplet },
  { id: "bar", label: "Bar", icon: Wine },
  { id: "zona-fumadores", label: "Zona fumadores", icon: Cigarette },
  { id: "guardarropa", label: "Guardarropa para invitados", icon: Shirt },
  { id: "juegos-infantiles", label: "Juegos infantiles", icon: Gamepad2 },
  { id: "cafe-internet", label: "Café internet", icon: Coffee },
  { id: "restaurante", label: "Restaurante", icon: UtensilsCrossed },
  { id: "salon-juntas", label: "Salón de juntas", icon: Users },
  { id: "salon-eventos", label: "Salón de eventos", icon: PartyPopper },
];
