import { PlaceDetailPage } from './PlaceDetailPage';

/** Detalle de venue — alias Lovable sobre integración real `PlaceDetailPage`. */
export const VenueDetail = () => (
  <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24" role="main" aria-label="Detalle del lugar">
    <PlaceDetailPage />
  </div>
);

export default VenueDetail;
