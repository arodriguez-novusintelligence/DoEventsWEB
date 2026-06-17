import { useState } from "react";
import { ChevronUp, ChevronDown, MapPin, Grid3X3, DollarSign, RefreshCcw, ExternalLink, Compass, HelpCircle, Info } from "lucide-react";
import { VenueData } from "@lovable/types/venue";
import { cn } from "@lovable/lib/utils";
import { Button } from "@lovable/components/ui/button";

interface VenueDetailsProps {
  venue: VenueData;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);
};

const VenueDetails = ({ venue }: VenueDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const refundPolicyLabels: Record<string, string> = {
    "mismo-dia": "El mismo día de la reserva",
    "1-dia": "Hasta 1 día antes del inicio de la reserva",
    "7-dias": "Hasta 7 días antes del inicio de la reserva",
    "30-dias": "Hasta 30 días antes del inicio de la reserva",
    "caso-a-caso": "Se evaluará caso a caso",
  };

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <span className="font-semibold">Información adicional del lugar</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="space-y-6 pb-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Descripción del lugar</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {venue.description}
            </p>
          </div>

          {/* Location Card with Google Maps */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Ubicación</h4>
            </div>
            <div className="rounded-xl overflow-hidden border border-border">
              {venue.coordinates && (
                <div className="aspect-video bg-secondary/30 relative">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d${venue.coordinates.lng}!3d${venue.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMDknMTUuNSJOIDc1wrAyNScyNS42Ilc!5e0!3m2!1ses!2sco!4v1234567890`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                </div>
              )}
              <div className="p-4 bg-card">
                <p className="text-sm font-medium">{venue.address}</p>
                <p className="text-sm text-muted-foreground">{venue.city}, {venue.department}</p>
                {venue.directions && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    📍 {venue.directions}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => window.open(`https://www.google.com/maps?q=${venue.coordinates?.lat},${venue.coordinates?.lng}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver en Google Maps
                </Button>
              </div>
            </div>
          </div>

          {/* Seating Map */}
          {venue.seatingMap && venue.seatingMap.zones?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Grid3X3 className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Mapa de silletería</h4>
              </div>
              <div className="rounded-xl overflow-hidden border border-border">
                {venue.seatingMap.imageUrl ? (
                  <div className="aspect-video bg-secondary/20 relative">
                    <img
                      src={venue.seatingMap.imageUrl}
                      alt="Mapa de silletería"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="p-4 bg-card">
                  <p className="text-sm text-muted-foreground mb-3">
                    {venue.seatingMap.description}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {venue.seatingMap.zones.map((zone) => (
                      <div key={zone.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {zone.name}: {zone.capacity} personas
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paid Services */}
          {venue.paidServices && venue.paidServices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Servicios adicionales con costo</h4>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {venue.paidServices.map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-3 bg-card">
                      <span className="text-sm">{service.name}</span>
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Refund Policy */}
          {venue.refundPolicy && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCcw className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Política de reembolso</h4>
              </div>
              <div className="rounded-xl border border-border p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">
                    {refundPolicyLabels[venue.refundPolicy.type]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground pl-4">
                  {venue.refundPolicy.description}
                </p>
              </div>
            </div>
          )}

          {/* Event Types */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Tipo de eventos que se pueden hacer en el lugar</h4>
            <div className="flex flex-wrap gap-2">
              {venue.eventTypes.map((type) => (
                <span
                  key={type}
                  className="text-xs text-muted-foreground hover:text-primary cursor-default"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Servicios incluidos</h4>
            <div className="flex flex-wrap gap-2">
              {venue.services.map((service) => (
                <span
                  key={service}
                  className="text-xs text-muted-foreground hover:text-primary cursor-default"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          {venue.accessibility.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Accesibilidad</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {venue.accessibility.join(". ")}
            </p>
          </div>
          )}

          {/* Facilities */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Facilidades</h4>
            <p className="text-sm text-muted-foreground">
              {venue.facilities.join(". ")}
            </p>
          </div>

          {/* Security */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Seguridad</h4>
            <p className="text-sm text-muted-foreground">
              {venue.security.join(". ")}
            </p>
          </div>


          {/* Nearby References */}
          {venue.nearbyReferences && venue.nearbyReferences.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Referencias y puntos cercanos</h4>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {venue.nearbyReferences.map((ref) => (
                    <div key={ref.name} className="flex items-center justify-between gap-3 p-3 bg-card">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ref.name}</p>
                        <p className="text-xs text-muted-foreground">{ref.type}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary shrink-0">{ref.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Refund Information */}
          {venue.cancellationPolicy && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Información de reembolsos</h4>
              </div>
              <div className="rounded-xl border border-border p-4 bg-card">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {venue.cancellationPolicy}
                </p>
                <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed">
                  Los reembolsos se procesan al mismo método de pago utilizado en la reserva, y pueden tardar entre 5 y 10 días hábiles en reflejarse según tu entidad bancaria.
                </p>
              </div>
            </div>
          )}

          {/* FAQs */}
          {venue.faqs && venue.faqs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Preguntas frecuentes</h4>
              </div>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {venue.faqs.map((faq, idx) => {
                  const open = openFaq === idx;
                  return (
                    <div key={idx} className="bg-card">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : idx)}
                        className="w-full flex items-center justify-between gap-3 p-3 text-left"
                      >
                        <span className="text-sm font-medium">{faq.question}</span>
                        {open ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {open && (
                        <p className="px-3 pb-3 text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lodging */}
          {venue.hasLodging && venue.lodgingDetails && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Hospedaje</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Número de habitaciones:</span>
                  <span>{venue.lodgingDetails.rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cupo máximo por habitación:</span>
                  <span>{venue.lodgingDetails.maxPerRoom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total máximo de huéspedes:</span>
                  <span>{venue.lodgingDetails.totalGuests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Se aceptan niños:</span>
                  <span>{venue.lodgingDetails.acceptsChildren ? "Sí" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Se aceptan mascotas:</span>
                  <span>{venue.lodgingDetails.acceptsPets ? "Sí" : "No"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;
