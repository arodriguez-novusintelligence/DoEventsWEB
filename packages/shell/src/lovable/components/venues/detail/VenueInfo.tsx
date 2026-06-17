import { MapPin, Star, Thermometer, Users, Calendar, LogIn, LogOut } from "lucide-react";
import { VenueData } from "@lovable/types/venue";

interface VenueInfoProps {
  venue: VenueData;
}

const VenueInfo = ({ venue }: VenueInfoProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-2xl font-bold font-display text-primary">
        {venue.name}
      </h1>

      {/* Address */}
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm">{venue.address}</p>
          <button className="text-sm text-primary font-medium hover:underline">
            Cómo llegar →
          </button>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">Calificación</span>
        <div className="flex items-center ml-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= venue.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tipo de lugar</p>
            <p className="text-sm font-medium">{venue.venueTypes[0] || "Finca"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Thermometer className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Clima promedio</p>
            <p className="text-sm font-medium">{venue.averageTemperature || "19 grados"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aforo del lugar</p>
            <p className="text-sm font-medium">{venue.capacity}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Eventos realizados</p>
            <p className="text-sm font-medium">{venue.eventsCompleted}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <LogIn className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hora inicio (Check-in)</p>
            <p className="text-sm font-medium">{venue.startTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <LogOut className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hora fin (Check-out)</p>
            <p className="text-sm font-medium">{venue.endTime}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {venue.description}
      </p>

      {/* Price */}
      <div className="flex items-center justify-between py-4 border-t border-border">
        <span className="text-sm text-muted-foreground">Valor de la reserva</span>
        <div className="text-right">
          <span className="text-xl font-bold">{formatPrice(venue.basePrice)}</span>
          <p className="text-xs text-muted-foreground">Iva incluido</p>
        </div>
      </div>
    </div>
  );
};

export default VenueInfo;
