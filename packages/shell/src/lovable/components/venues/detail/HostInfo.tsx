import { Phone, Mail } from "lucide-react";
import { VenueData } from "@lovable/types/venue";

interface HostInfoProps {
  venue: VenueData;
}

const HostInfo = ({ venue }: HostInfoProps) => {
  return (
    <div className="space-y-4 py-4 border-t border-border">
      <h3 className="font-semibold">Datos del Host</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Número de contacto</p>
            <p className="text-sm">{venue.hostPhone}</p>
          </div>
          <a
            href={`tel:${venue.hostPhone}`}
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Correo electrónico</p>
            <p className="text-sm">{venue.hostEmail}</p>
          </div>
          <a
            href={`mailto:${venue.hostEmail}`}
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default HostInfo;
