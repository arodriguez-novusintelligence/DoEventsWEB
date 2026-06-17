import VenueCreator from '@lovable/components/venues/VenueCreator';
import type { PlaceFormData } from '@lovable/data/placeData';

export type { PlaceFormData };

interface MyPlacesViewProps {
  onBack: (formData?: PlaceFormData) => void;
  onPlacePublished?: (form: PlaceFormData) => void | Promise<void>;
  onSaveDraft?: (form: PlaceFormData) => void | Promise<void>;
  initialForm?: PlaceFormData;
  mode?: 'create' | 'edit';
  headerTitle?: string;
  submitLabel?: string;
  ownerUserId?: string;
}

/** Formulario productivo de lugares — acordeón v17 conectado al API. */
const MyPlacesView = (props: MyPlacesViewProps) => <VenueCreator {...props} />;

export default MyPlacesView;
