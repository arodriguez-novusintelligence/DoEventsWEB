import { Building2 } from 'lucide-react';
import { PlaceDetailPage } from './PlaceDetailPage';

/** Detalle de venue — alias Lovable sobre integración real `PlaceDetailPage`. */
export const VenueDetail = () => (
  <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24" role="main" aria-label="Detalle del lugar">
    <div className="sticky top-0 z-10 border-b border-border/40 bg-gradient-to-r from-primary/5 via-background to-accent/5 px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-2 ring-primary/20">
          <Building2 className="h-4 w-4 text-primary" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Lugar</p>
      </div>
    </div>
    <PlaceDetailPage />
  </div>
);

export default VenueDetail;
