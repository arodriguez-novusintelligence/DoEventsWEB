import { useState } from "react";
import { Input } from "@lovable/components/ui/input";
import { Textarea } from "@lovable/components/ui/textarea";
import { Button } from "@lovable/components/ui/button";
import { MapPinPlus } from "lucide-react";
import SeatingMapSection from "@lovable/components/venues/seating/SeatingMapSection";

const underlineInput =
  "border-0 border-b border-border rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-primary bg-transparent";

const Field = ({
  label,
  children,
  bold = false,
}: {
  label: string;
  children: React.ReactNode;
  bold?: boolean;
}) => (
  <div className="space-y-1.5">
    <p className={`text-sm ${bold ? "font-semibold text-foreground" : "text-foreground"}`}>
      {label}
    </p>
    {children}
  </div>
);

const LocationSection = () => {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="space-y-5">
      {/* Card principal */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-5">
        {/* Consultar mapa link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="flex items-center gap-1.5 text-primary font-medium text-sm"
          >
            Consultar mapa
            <MapPinPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Mapa */}
        {showMap && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-sm font-medium text-foreground">Ubicación en el mapa</p>
            <p className="text-xs text-muted-foreground">
              Arrastra el marcador para ajustar la ubicación exacta
            </p>
            <div className="rounded-xl overflow-hidden border border-border aspect-video">
              <iframe
                src="https://www.google.com/maps?q=6.1543,-75.4267&z=16&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Ubicación del lugar"
                className="w-full h-full"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Calle 13C-145 Rionegro - Antioquia
            </p>
          </div>
        )}

        <Field label="Dirección del Lugar">
          <Input placeholder="Ej: Calle 48c #97- 45" className={underlineInput} />
        </Field>

        <Field label="Barrio">
          <Input placeholder="Ej: Manila" className={underlineInput} />
        </Field>

        <Field label="Ciudad">
          <Input placeholder="Ej: Medellín" className={underlineInput} />
        </Field>

        <Field label="Departamento">
          <Input placeholder="Ej: Antioquia" className={underlineInput} />
        </Field>

        <Field label="Como llegar">
          <Input placeholder="Ej: Calle 48c #97- 45" className={underlineInput} />
        </Field>

        <Field label="Referencias o puntos cercanos" bold>
          <Textarea
            placeholder="Describe brevemente los lugares cercanos a tu lugar de evento."
            className={`${underlineInput} min-h-[44px] resize-none py-2`}
          />
        </Field>
      </div>

      {/* Mapa de silletería - card aparte */}
      <SeatingMapSection />
    </div>
  );
};

export default LocationSection;