import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  MediaSourcePicker,
  newWizardId,
  resolveDisplayLocation,
  resolveManualUserLocation,
  resolveUserLocation,
  RootState,
} from '@doevents/shared';
import { initialPlaceFormData, type PlaceFormData } from '@lovable/data/placeData';
import { saveLocalWizardDraft } from '../../../lib/wizardDraftBridge';

export interface PlaceFormContextValue {
  form: PlaceFormData;
  update: (partial: Partial<PlaceFormData>) => void;
  mode: 'create' | 'edit';
  userId: string;
  locating: boolean;
  publishing: boolean;
  placeTypeLabel: string;
  canPublish: boolean;
  missingRequiredFields: string[];
  completedCount: number;
  useDeviceLocation: () => Promise<void>;
  searchLocation: () => Promise<void>;
  addMedia: (files: FileList | null, kind: 'image' | 'video') => void;
  addGalleryImages: (items: Array<{ url: string; imageId?: string; key?: string }>) => void;
  removeMedia: (id: string) => void;
  handlePublish: () => Promise<void>;
}

const PlaceFormContext = createContext<PlaceFormContextValue | null>(null);

export function usePlaceForm(): PlaceFormContextValue {
  const ctx = useContext(PlaceFormContext);
  if (!ctx) throw new Error('usePlaceForm debe usarse dentro de PlaceFormProvider');
  return ctx;
}

interface PlaceFormProviderProps {
  children: ReactNode;
  initialForm?: PlaceFormData;
  mode?: 'create' | 'edit';
  onPlacePublished?: (form: PlaceFormData) => void | Promise<void>;
}

export function PlaceFormProvider({
  children,
  initialForm,
  mode = 'create',
  onPlacePublished,
}: PlaceFormProviderProps) {
  const userId = useSelector((s: RootState) => s.auth.idUser) || '';
  const [form, setForm] = useState<PlaceFormData>(initialForm || initialPlaceFormData());
  const [publishing, setPublishing] = useState(false);
  const [locating, setLocating] = useState(false);

  const update = (partial: Partial<PlaceFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  useEffect(() => {
    if (mode !== 'create' || !userId || !form.name.trim()) return;
    const timer = window.setTimeout(() => {
      saveLocalWizardDraft(userId, 'venue', form);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [form, userId, mode]);

  const placeTypeLabel = form.placeType === 'Otro' ? form.placeTypeOther : form.placeType;

  const completedCount = useMemo(() => {
    let count = 0;
    if (form.name.trim() && placeTypeLabel.trim()) count += 1;
    if (form.media.length > 0) count += 1;
    if (form.city.trim() && form.latitude && form.longitude) count += 1;
    if (form.hasSeating || Number(form.capacity) > 0) count += 1;
    if (!form.hasSeating || (form.gates.length > 0 && form.floors.some((f) => f.categories.length > 0))) count += 1;
    if (form.pricing.perDay || form.pricing.perMonth) count += 1;
    if (form.rentalUnit === 'month' || (form.globalStartTime && form.globalEndTime)) count += 1;
    if (form.refundPolicy) count += 1;
    if (form.acceptedConditions) count += 1;
    return count;
  }, [form, placeTypeLabel]);

  const missingRequiredFields = useMemo(() => {
    if (mode === 'edit') {
      return form.name.trim() ? [] : ['Nombre del lugar'];
    }
    const missing: string[] = [];
    if (!form.name.trim()) missing.push('Nombre del lugar');
    if (!placeTypeLabel.trim()) missing.push('Tipo de lugar');
    if (!form.city.trim() || !form.latitude || !form.longitude) missing.push('Ubicación en el mapa');
    if (!(Number(form.capacity) > 0)) missing.push('Capacidad del lugar');
    if (form.hasSeating && (form.gates.length === 0 || !form.floors.some((f) => f.categories.length > 0))) {
      missing.push('Mapa de silletería y puertas');
    }
    const hasDayPrice = Boolean(form.pricing.perDay?.trim());
    const hasMonthPrice = Boolean(form.pricing.perMonth?.trim());
    if (form.rentalUnit === 'day' && !hasDayPrice) {
      missing.push('Precio de alquiler por día');
    }
    if (form.rentalUnit === 'month' && !hasMonthPrice) {
      missing.push('Precio de alquiler por mes');
    }
    if (!hasDayPrice && !hasMonthPrice) {
      missing.push('Al menos un precio de alquiler (día o mes)');
    }
    if (form.rentalUnit === 'day' && (!form.globalStartTime || !form.globalEndTime)) {
      missing.push('Horario de disponibilidad');
    }
    if (!form.refundPolicy) missing.push('Política de reembolso');
    if (!form.acceptedConditions) missing.push('Aceptación de condiciones');
    return missing;
  }, [form, placeTypeLabel, mode]);

  const canPublish = missingRequiredFields.length === 0;

  const addMedia = (files: FileList | null, kind: 'image' | 'video') => {
    if (!files?.length) return;
    const next = [...form.media];
    Array.from(files).forEach((file) => {
      next.push({
        id: newWizardId(),
        preview: URL.createObjectURL(file),
        file,
        kind,
      });
    });
    update({ media: next.slice(0, 12) });
  };

  const addGalleryImages = (items: Array<{ url: string; imageId?: string; key?: string }>) => {
    if (!items.length) return;
    const next = [...form.media];
    items.forEach((item) => {
      next.push({
        id: newWizardId(),
        preview: item.url,
        url: item.url,
        galleryImageId: item.imageId,
        galleryKey: item.key,
        kind: 'image',
      });
    });
    update({ media: next.slice(0, 12) });
  };

  const removeMedia = (id: string) => {
    const item = form.media.find((m) => m.id === id);
    if (item?.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
    update({ media: form.media.filter((m) => m.id !== id) });
  };

  const useDeviceLocation = async () => {
    setLocating(true);
    try {
      const loc = await resolveUserLocation({ prompt: true, force: true });
      if (!loc) {
        toast.error('No se pudo obtener tu ubicación');
        return;
      }
      const locationLabel = resolveDisplayLocation({
        label: loc.label,
        locationLabel: loc.label,
        ciudad: loc.city,
        departamento: loc.departamento,
      });
      update({
        latitude: String(loc.lat),
        longitude: String(loc.lng),
        city: loc.city || form.city,
        department: loc.departamento || form.department,
        locationLabel: locationLabel !== '—' ? locationLabel : `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
      });
      toast.success('Ubicación del dispositivo aplicada');
    } finally {
      setLocating(false);
    }
  };

  const searchLocation = async () => {
    const query = [form.address, form.city, form.department].filter(Boolean).join(', ');
    if (!query.trim()) {
      toast.error('Escribe dirección o ciudad para buscar en el mapa');
      return;
    }
    setLocating(true);
    try {
      const loc = await resolveManualUserLocation(query);
      if (!loc) {
        toast.error('No encontramos esa ubicación');
        return;
      }
      const locationLabel = resolveDisplayLocation({
        label: loc.label,
        locationLabel: loc.label,
        ciudad: loc.city,
        departamento: loc.departamento,
      });
      update({
        latitude: String(loc.lat),
        longitude: String(loc.lng),
        city: loc.city || form.city,
        department: loc.departamento || form.department,
        locationLabel: locationLabel !== '—' ? locationLabel : query,
      });
      toast.success('Ubicación encontrada');
    } finally {
      setLocating(false);
    }
  };

  const handlePublish = async () => {
    if (publishing) return;
    if (missingRequiredFields.length) {
      toast.error(`Completa los campos obligatorios: ${missingRequiredFields.join(', ')}`);
      return;
    }
    setPublishing(true);
    try {
      await onPlacePublished?.(form);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (mode === 'edit' ? 'No se pudo guardar el lugar' : 'No se pudo publicar el lugar'));
      throw err;
    } finally {
      setPublishing(false);
    }
  };

  const value: PlaceFormContextValue = {
    form,
    update,
    mode,
    userId,
    locating,
    publishing,
    placeTypeLabel,
    canPublish,
    missingRequiredFields,
    completedCount,
    useDeviceLocation,
    searchLocation,
    addMedia,
    addGalleryImages,
    removeMedia,
    handlePublish,
  };

  return (
    <PlaceFormContext.Provider value={value}>
      {children}
    </PlaceFormContext.Provider>
  );
}

export function PlaceMediaPicker() {
  const {
    form, userId, addMedia, addGalleryImages, removeMedia,
  } = usePlaceForm();

  if (form.media.length >= 12) return null;

  return (
    <MediaSourcePicker
      userId={userId}
      variant="lovable"
      multiple
      maxCount={12}
      currentCount={form.media.length}
      deviceLabel="Agregar fotos"
      galleryLabel="Desde mi galería"
      className="mt-3 flex flex-col gap-2 sm:flex-row"
      onFiles={(files) => {
        const list = new DataTransfer();
        files.forEach((file) => list.items.add(file));
        addMedia(list.files, 'image');
      }}
      onGallerySelect={(items) => addGalleryImages(items)}
    />
  );
}
