import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { listUserVenues, reverseGeocodePlace, RootState, MediaSourcePicker } from '@doevents/shared';
import { applyVenueToEventLocation, type VenueOwnership } from '../../../lovable-bridge/eventVenueBridge';
import { useNearbyVenues } from '../../../lovable-bridge/useNearbyVenues';
import {
  Home,
  HousePlus,
  MapPin,
  Plus,
  Minus,
  Search,
  Check,
  Ticket,
  Armchair,
  DoorOpen,
  Eye,
  EyeOff,
  Navigation,
  X,
  LayoutTemplate,
} from 'lucide-react';
import {
  EventFormData,
  EventGate,
  EventLocation,
  SeatingLayout,
  TicketingType,
  VenueMode,
  EventFormUpdater,
} from '@lovable/data/eventFormData';
import { VENUE_TYPES, Venue } from '@lovable/data/venuesData';
import { Switch } from '@lovable/components/ui/switch';
import { Input } from '@lovable/components/ui/input';
import { Button } from '@lovable/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@lovable/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  SEATING_MAP_TEMPLATES,
  applySeatingTemplateToLocation,
  formatTemplateCapacityLabel,
  getSeatingTemplate,
  type SeatingMapTemplate,
} from '@lovable/data/seatingTemplates';
import SeatingTemplateInfoPanel from '@lovable/components/venues/seating/SeatingTemplateInfoPanel';
import SeatingMapEditor, { shapeStyle, SeatsGrid } from './SeatingMapEditor';
import EventLocationMap from './EventLocationMap';
import { Maximize2, EyeOff as EyeOffIcon, Expand, Menu, Home as HomeIcon, Loader2 } from 'lucide-react';

interface Props {
  formData: EventFormData;
  updateForm: EventFormUpdater;
  showErrors: boolean;
}

const DEFAULT_COORDS: [number, number] = [18.4861, -69.9312]; // Santo Domingo

const StepEventLocation = ({ formData, updateForm, showErrors }: Props) => {
  const loc = formData.location;
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const updateLoc = (partial: Partial<EventLocation>) =>
    updateForm((prev) => ({ location: { ...prev.location, ...partial } }));

  const setMode = (mode: VenueMode) => updateLoc({ mode });

  const [venueTab, setVenueTab] = useState<'nearby' | 'mine' | 'templates'>('mine');
  const [search, setSearch] = useState('');
  const [newGateName, setNewGateName] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewHidden, setPreviewHidden] = useState(false);
  const [floors, setFloors] = useState<number[]>([1]);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [floorToRemove, setFloorToRemove] = useState<number | null>(null);
  const [myVenues, setMyVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const { venues: nearbyVenues, loading: nearbyLoading } = useNearbyVenues(80);
  const allFigures = loc.seatingMap?.figures ?? [];
  const currentFloorFigures = useMemo(
    () => allFigures.filter((f) => (f.floor ?? 1) === activeFloor),
    [allFigures, activeFloor],
  );

  useEffect(() => {
    const fromFigures = Array.from(new Set(allFigures.map((f) => f.floor ?? 1))).sort((a, b) => a - b);
    if (!fromFigures.length) return;
    setFloors((prev) => {
      const merged = Array.from(new Set([...prev, ...fromFigures])).sort((a, b) => a - b);
      return merged.length === prev.length && merged.every((v, i) => v === prev[i]) ? prev : merged;
    });
  }, [allFigures]);

  const addFloor = () => {
    const next = (floors[floors.length - 1] ?? 0) + 1;
    setFloors([...floors, next]);
    setActiveFloor(next);
  };

  const confirmRemoveFloor = () => {
    if (floorToRemove == null || floorToRemove === 1) {
      setFloorToRemove(null);
      return;
    }
    const remaining = floors.filter((f) => f !== floorToRemove);
    const newFigures = allFigures.filter((f) => (f.floor ?? 1) !== floorToRemove);
    setFloors(remaining);
    if (activeFloor === floorToRemove) setActiveFloor(remaining[0] ?? 1);
    if (loc.seatingMap) {
      updateLoc({ seatingMap: { ...loc.seatingMap, figures: newFigures } });
    }
    setFloorToRemove(null);
    toast.success(`Piso ${floorToRemove} eliminado`);
  };

  useEffect(() => {
    if (!userId) {
      setMyVenues([]);
      return;
    }
    let cancelled = false;
    setVenuesLoading(true);
    listUserVenues(userId, { isTemplate: true })
      .then((venues) => {
        if (cancelled) return;
        setMyVenues(venues.map((v) => ({
          id: v.venueId,
          name: v.name,
          shortCode: v.venueId.slice(0, 9),
          type: 'Salón de eventos',
          capacity: v.capacity || 0,
          address: v.city || '—',
          source: 'mine' as const,
        })));
      })
      .catch(() => {
        if (!cancelled) setMyVenues([]);
      })
      .finally(() => {
        if (!cancelled) setVenuesLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  const showVenueEditor =
    loc.mode === 'custom'
    || (loc.mode === 'mine' && !!loc.selectedVenueId)
    || (loc.mode === 'mine' && !!loc.selectedTemplateId);

  const selectVenue = async (
    venueId: string,
    fallback?: Venue,
    ownership: VenueOwnership = 'own',
  ) => {
    try {
      const patch = await applyVenueToEventLocation(venueId, ownership);
      updateLoc({
        ...patch,
        mode: 'mine',
        selectedVenueId: venueId,
        selectedTemplateId: undefined,
        venueOwnership: ownership,
        customImages:
          (patch.customImages?.length ?? 0) > 0
            ? patch.customImages
            : fallback?.image
              ? [fallback.image]
              : [],
      });
      const hint = ownership === 'thirdParty'
        ? 'Se creará una copia editable en tu perfil. El venue original no se modificará.'
        : 'Los cambios actualizarán tu lugar guardado.';
      toast.success(`${patch.customName || fallback?.name || 'Lugar'} seleccionado. ${hint}`);
      requestAnimationFrame(() => {
        document.getElementById('selected-venue-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch {
      if (fallback) {
        updateLoc({
          selectedVenueId: venueId,
          selectedTemplateId: undefined,
          venueOwnership: ownership,
          customName: fallback.name,
          customType: fallback.type,
          customAddress: fallback.address,
          showMap: true,
        });
        toast.success(`${fallback.name} seleccionado.`);
      } else {
        toast.error('No se pudo cargar el lugar seleccionado.');
      }
    }
  };

  const nearbyAsVenues = useMemo(
    () => nearbyVenues.map((v) => ({
      id: v.id,
      name: v.name,
      shortCode: v.id.slice(0, 9),
      type: v.type,
      capacity: v.capacity || 0,
      address: v.city || '—',
      image: v.image,
      lat: undefined,
      lng: undefined,
      source: 'nearby' as const,
    })),
    [nearbyVenues],
  );

  const selectTemplate = (tpl: SeatingMapTemplate) => {
    updateLoc(applySeatingTemplateToLocation(tpl));
    setFloors(tpl.floors);
    setActiveFloor(tpl.floors[0] ?? 1);
    toast.success(`Plantilla "${tpl.name}" seleccionada`);
    requestAnimationFrame(() => {
      document.getElementById('selected-venue-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const filteredTemplates = useMemo(
    () => SEATING_MAP_TEMPLATES.filter((tpl) => {
      const q = search.toLowerCase();
      return tpl.name.toLowerCase().includes(q)
        || tpl.venueName.toLowerCase().includes(q)
        || tpl.city.toLowerCase().includes(q)
        || tpl.description.toLowerCase().includes(q);
    }),
    [search],
  );

  const selectedTemplate = loc.selectedTemplateId
    ? getSeatingTemplate(loc.selectedTemplateId)
    : undefined;

  const filteredVenues = useMemo(
    () =>
      (venueTab === 'mine' ? myVenues : nearbyAsVenues)
        .filter((v) => v.name.toLowerCase().includes(search.toLowerCase())),
    [venueTab, search, myVenues, nearbyAsVenues],
  );

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;
    const readers = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((urls) =>
      updateLoc({ customImages: [...(loc.customImages ?? []), ...urls] })
    );
  };

  const removeCustomImage = (idx: number) => {
    updateLoc({
      customImages: (loc.customImages ?? []).filter((_, i) => i !== idx),
    });
  };

  const addGalleryImages = (urls: string[]) => {
    if (!urls.length) return;
    updateLoc({ customImages: [...(loc.customImages ?? []), ...urls] });
  };

  const lat = loc.customLat ?? DEFAULT_COORDS[0];
  const lng = loc.customLng ?? DEFAULT_COORDS[1];

  const applyGeocodedPlace = (place: Awaited<ReturnType<typeof reverseGeocodePlace>>) => {
    if (!place) return;
    updateLoc({
      customLat: place.lat,
      customLng: place.lng,
      customAddress: place.label,
      detectedCity: place.city || place.departamento || place.label,
      showMap: true,
    });
  };

  const handleMapPick = async (newLat: number, newLng: number) => {
    const place = await reverseGeocodePlace(newLat, newLng);
    if (place) {
      applyGeocodedPlace(place);
      return;
    }
    updateLoc({
      customLat: newLat,
      customLng: newLng,
      customAddress: `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`,
      showMap: true,
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const place = await reverseGeocodePlace(pos.coords.latitude, pos.coords.longitude);
        if (place) applyGeocodedPlace(place);
        else {
          updateLoc({
            customLat: pos.coords.latitude,
            customLng: pos.coords.longitude,
            customAddress: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            showMap: true,
          });
        }
        toast('Ubicación capturada.');
      },
      () => {
        updateLoc({
          customLat: DEFAULT_COORDS[0],
          customLng: DEFAULT_COORDS[1],
          customAddress: loc.detectedCity ?? 'Santo Domingo, RD',
          showMap: true,
        });
        toast('No se pudo obtener la ubicación. Se usó la ciudad detectada.');
      }
    );
  };

  const addGate = () => {
    const name = newGateName.trim();
    if (!name) {
      toast('Ingresa un nombre para la puerta.');
      return;
    }
    const next: EventGate = {
      id: `g-${Date.now()}`,
      number: (loc.gates?.length ?? 0) + 1,
      name,
    };
    updateLoc({ gates: [...(loc.gates ?? []), next] });
    setNewGateName('');
  };

  const removeGate = (id: string) => {
    const remaining = (loc.gates ?? [])
      .filter((g) => g.id !== id)
      .map((g, i) => ({ ...g, number: i + 1 }));
    updateLoc({ gates: remaining });
  };

  const setTicketing = (t: TicketingType) => {
    if (t === 'with-seating' && (loc.gates?.length ?? 0) === 0) {
      toast.error('Agrega al menos una puerta de ingreso para usar el editor de mapa de silletería.');
    }
    updateLoc({
      ticketingType: t,
      seatingLayout: t === 'only-tickets' ? 'general' : 'numbered',
    });
  };

  const missingLocation =
    showVenueEditor && !loc.customLat && showErrors;
  const missingGates =
    showErrors &&
    showVenueEditor &&
    loc.ticketingType === 'with-seating' &&
    (!loc.gates || loc.gates.length === 0);
  const missingMap =
    showErrors &&
    showVenueEditor &&
    loc.ticketingType === 'with-seating' &&
    !(loc.seatingMap?.figures?.some((f) => f.role === 'category'));

  return (
    <div className="space-y-4 pb-4">
      <div className="px-1">
        <h2 className="text-xl font-bold text-primary">Ubicación del evento</h2>
        <p className="mt-1 text-sm text-foreground">
          Elige un lugar existente o configura uno personalizado.{' '}
          <span className="text-muted-foreground">(Obligatorio)</span>
        </p>
      </div>

      <h3 className="px-1 text-sm font-bold text-foreground">
        Selecciona el tipo de lugar
      </h3>

      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { id: 'mine' as VenueMode, label: 'Mis Lugares', icon: Home },
          { id: 'custom' as VenueMode, label: 'Personalizado', icon: HousePlus },
        ]).map((opt) => {
          const Active = opt.icon;
          const selected = loc.mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-card p-4 transition-all ${
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border'
              }`}
            >
              <Active
                className={`h-8 w-8 ${
                  selected ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-sm font-semibold ${
                  selected ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mis Lugares mode */}
      {loc.mode === 'mine' && (
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex gap-2 rounded-full bg-muted p-1">
            {([
              { id: 'nearby', label: 'Venues cercanos' },
              { id: 'mine', label: 'Mis venues' },
              { id: 'templates', label: 'Plantillas' },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setVenueTab(t.id)}
                className={`flex-1 rounded-full px-2 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  venueTab === t.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                venueTab === 'templates'
                  ? 'Buscar plantilla por nombre o ciudad'
                  : 'Buscar venue por nombre'
              }
              className="pl-9"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {venueTab === 'templates' ? (
              <>
                {filteredTemplates.length === 0 && (
                  <p className="w-full py-6 text-center text-sm text-muted-foreground">
                    No hay plantillas que coincidan con tu búsqueda.
                  </p>
                )}
                {filteredTemplates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    selected={loc.selectedTemplateId === tpl.id}
                    onSelect={() => selectTemplate(tpl)}
                  />
                ))}
              </>
            ) : (
              <>
            {(venuesLoading || (venueTab === 'nearby' && nearbyLoading)) && (
              <div className="flex w-full flex-col items-center gap-2 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando lugares…</p>
              </div>
            )}
            {!venuesLoading && !(venueTab === 'nearby' && nearbyLoading) && filteredVenues.length === 0 && (
              <div className="w-full rounded-2xl border border-dashed border-primary/25 bg-card py-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                  <HomeIcon className="h-7 w-7 text-primary" />
                </div>
                <p className="px-4 text-sm font-semibold text-foreground">
                  {venueTab === 'nearby'
                    ? 'No hay venues cercanos'
                    : 'No hay venues disponibles'}
                </p>
                <p className="mt-1 px-4 text-xs text-muted-foreground">
                  {venueTab === 'nearby'
                    ? 'Activa tu ubicación o prueba más tarde.'
                    : 'Crea un lugar o selecciona otra opción.'}
                </p>
              </div>
            )}
            {filteredVenues.map((v) => (
              <VenueCard
                key={v.id}
                venue={v}
                selected={loc.selectedVenueId === v.id}
                onSelect={() => {
                  void selectVenue(v.id, v, venueTab === 'mine' ? 'own' : 'thirdParty');
                }}
              />
            ))}
              </>
            )}
          </div>

          {showErrors && !loc.selectedVenueId && !loc.selectedTemplateId && (
            <p className="text-xs font-medium text-destructive">
              Selecciona un lugar para continuar.
            </p>
          )}
        </div>
      )}

      {loc.mode === 'mine' && (loc.selectedVenueId || loc.selectedTemplateId) && (
        <div
          id="selected-venue-editor"
          className="flex items-start gap-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            {loc.selectedTemplateId ? (
              <LayoutTemplate className="h-5 w-5" />
            ) : (
              <Home className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {loc.selectedTemplateId
                ? `Plantilla “${selectedTemplate?.name || loc.customName || 'seleccionada'}”`
                : `Editar detalles de “${loc.customName ?? 'lugar seleccionado'}”`}
            </p>
            <p className="text-xs text-muted-foreground">
              {loc.selectedTemplateId
                ? 'Mapa de silletería precargado. Puedes ajustar zonas, puertas y pisos antes de publicar.'
                : loc.venueOwnership === 'thirdParty'
                  ? 'Estás usando un venue de otro organizador. Se creará una copia en tu perfil; el original no se modifica.'
                  : 'Ajusta ubicación, mapa, puertas de acceso y mapa de silletería. Los cambios actualizarán tu lugar guardado.'}
            </p>
          </div>
        </div>
      )}

      {/* Editor de lugar — personalizado o Mis Lugares con venue seleccionado */}
      {showVenueEditor && (
        <div className="space-y-5 rounded-2xl bg-card p-4 shadow-sm">
          {/* Images */}
          <div>
            <label className="mb-2 block text-sm font-bold text-foreground">
              Imágenes del lugar{' '}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(loc.customImages ?? []).map((src, i) => (
                <div key={i} className="relative h-20 w-20">
                  <img
                    src={src}
                    alt={`Lugar ${i + 1}`}
                    className="h-full w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomImage(i)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <MediaSourcePicker
              userId={userId}
              variant="lovable"
              multiple
              maxCount={20}
              currentCount={(loc.customImages ?? []).length}
              deviceLabel="Subir imágenes"
              galleryLabel="Mi galería"
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onFiles={(files) => {
                const list = new DataTransfer();
                files.forEach((file) => list.items.add(file));
                handleAddImages(list.files);
              }}
              onGallerySelect={(items) => addGalleryImages(items.map((item) => item.url))}
            />
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-bold text-foreground">
              Nombre del lugar
            </label>
            <Input
              value={loc.customName ?? ''}
              onChange={(e) => updateLoc({ customName: e.target.value })}
              placeholder="Ingresa el nombre"
              className={
                showErrors && !loc.customName?.trim()
                  ? 'border-destructive'
                  : ''
              }
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-bold text-foreground">
              Tipo de lugar
            </label>
            <select
              value={loc.customType ?? ''}
              onChange={(e) => updateLoc({ customType: e.target.value })}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${
                showErrors && !loc.customType
                  ? 'border-destructive'
                  : 'border-input'
              }`}
            >
              <option value="">Seleccionar tipo</option>
              {VENUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Detected city */}
          {loc.detectedCity && (
            <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs">
              <span className="font-semibold text-primary">
                Ciudad detectada:
              </span>{' '}
              <span className="text-foreground">{loc.detectedCity}</span>
            </div>
          )}

          {/* Address input */}
          <div>
            <label className="mb-1 block text-sm font-bold text-foreground">
              Dirección del evento
            </label>
            <Input
              value={loc.customAddress ?? ''}
              onChange={(e) => updateLoc({ customAddress: e.target.value })}
              placeholder="Calle, número, sector…"
            />
          </div>

          {/* Map controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => updateLoc({ showMap: !loc.showMap })}
              className="rounded-full"
            >
              {loc.showMap ? (
                <>
                  <EyeOff className="mr-1 h-4 w-4" /> Ocultar mapa
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-4 w-4" /> Mostrar mapa
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={useMyLocation}
              className="rounded-full"
            >
              <Navigation className="mr-1 h-4 w-4" /> Usar mi ubicación
            </Button>
          </div>

          {/* Map */}
          {loc.showMap && (
            <EventLocationMap lat={lat} lng={lng} onPick={handleMapPick} />
          )}

          {missingLocation && (
            <p className="text-xs font-medium text-destructive">
              Captura la ubicación desde el mapa o usa tu ubicación.
            </p>
          )}

          {/* Save to my venues */}
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={!!loc.saveToMyVenues}
              onChange={(e) => updateLoc({ saveToMyVenues: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
            />
            Guardar este lugar para reutilizarlo en futuros eventos
          </label>

          {/* Owner toggle */}
          <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
            <span className="text-sm font-medium text-foreground">
              ¿Eres el dueño/administrador de este lugar?
            </span>
            <Switch
              checked={!!loc.isOwner}
              onCheckedChange={(v) => updateLoc({ isOwner: v })}
            />
          </div>
        </div>
      )}

      {/* Ticketing setup — only for custom venues */}
      {showVenueEditor && (
        <div className="space-y-4 rounded-2xl bg-card p-4 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Tipo de boletería</h3>
          <div className="grid grid-cols-2 gap-3">
            <TicketingCard
              selected={loc.ticketingType === 'only-tickets'}
              onClick={() => setTicketing('only-tickets')}
              icon={<Ticket className="h-7 w-7" />}
              label="Solo boletería"
              subtitle="Admisión general"
            />
            <TicketingCard
              selected={loc.ticketingType === 'with-seating'}
              onClick={() => setTicketing('with-seating')}
              icon={<Armchair className="h-7 w-7" />}
              label="Boletería con mapa de sillería"
              subtitle="Silletería numerada"
            />
          </div>
        </div>
      )}

      {/* Gates — only for custom venues */}
      {showVenueEditor && (
        <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
          <h3 className="text-base font-bold text-foreground">
            Agregar puertas de ingreso al lugar{' '}
            <span className="text-sm font-medium text-destructive">
              (obligatorio)
            </span>
          </h3>

          <div className="rounded-xl border border-border p-3">
            <div className="grid grid-cols-[60px_1fr_auto] items-end gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                  # de puerta
                </label>
                <div className="border-b border-input pb-1 text-sm font-bold text-foreground">
                  {(loc.gates?.length ?? 0) + 1}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                  Nombre de la puerta
                </label>
                <input
                  value={newGateName}
                  onChange={(e) => setNewGateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGate())}
                  placeholder="e.g. Main Entrance"
                  className="w-full border-b border-input bg-transparent pb-1 text-sm outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addGate}
              className="ml-auto mt-2 flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="h-4 w-4" /> Agregar puerta
            </button>
          </div>

          <div className="space-y-2">
            {(loc.gates ?? []).map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <DoorOpen className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">{g.number}</span>
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {g.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeGate(g.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive"
                  aria-label="Eliminar puerta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {missingGates && (
            <p className="text-xs font-medium text-destructive">
              Agrega al menos una puerta de ingreso.
            </p>
          )}
          {missingMap && (
            <p className="text-xs font-medium text-destructive">
              Diseña el mapa de silletería con al menos una zona de asientos.
            </p>
          )}
        </div>
      )}

      {/* Seating map editor — only when custom + with-seating + at least one gate */}
      {showVenueEditor && loc.ticketingType === 'with-seating' && (
        <>
          {(loc.gates?.length ?? 0) > 0 ? (
            <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <HomeIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {loc.customName?.trim() || 'Nuevo lugar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diseña las zonas (categorías) y referencias (elementos) del lugar.
                  </p>
                </div>
              </div>

              <h3 className="text-base font-bold text-foreground">
                Editor de mapa de silletería
              </h3>

              <button
                type="button"
                onClick={() => setPreviewHidden((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left"
              >
                <span className="text-sm font-semibold text-foreground">
                  Vista previa del editor
                </span>
                <span className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background">
                  <EyeOffIcon className="h-3.5 w-3.5" />
                  {previewHidden ? 'Mostrar editor' : 'Ocultar editor'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Maximize2 className="h-4 w-4" /> Vista completa · desliza
                </span>
                <span className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background">
                  <Expand className="h-3.5 w-3.5" /> Abrir editor
                </span>
              </button>

              {!previewHidden && (
                <div className="relative min-h-[260px] rounded-xl border border-border bg-card p-2">
                  {currentFloorFigures.length === 0 ? (
                    <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
                      <Menu className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">
                        Piso {activeFloor} vacío. Abre el editor para empezar.
                      </p>
                    </div>
                  ) : (
                    <SeatingPreview figures={currentFloorFigures} />
                  )}

                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-md"
                  >
                    <Maximize2 className="h-3.5 w-3.5" /> Ver completo
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => floors.length > 1 && setFloorToRemove(activeFloor)}
                  disabled={activeFloor === 1}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-primary disabled:opacity-30"
                  aria-label="Eliminar piso"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex flex-1 gap-2 overflow-x-auto">
                  {floors.map((f) => {
                    const isActive = f === activeFloor;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setActiveFloor(f)}
                        className={`flex-shrink-0 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all ${
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground'
                        }`}
                      >
                        Piso {f}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={addFloor}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-primary"
                  aria-label="Agregar piso"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {editorOpen && (
                <SeatingMapEditor
                  initialMap={
                    loc.seatingMap
                      ? { ...loc.seatingMap, figures: currentFloorFigures }
                      : undefined
                  }
                  gates={loc.gates ?? []}
                  totalCapacity={Number(formData.capacity) || 1000}
                  currentFloor={activeFloor}
                  onSave={(map) => {
                    const others = allFigures.filter(
                      (f) => (f.floor ?? 1) !== activeFloor,
                    );
                    const updated = map.figures.map((f) => ({
                      ...f,
                      floor: f.floor ?? activeFloor,
                    }));
                    updateLoc({
                      seatingMap: { ...map, figures: [...others, ...updated] },
                    });
                  }}
                  onClose={() => setEditorOpen(false)}
                />
              )}

              <AlertDialog
                open={floorToRemove !== null}
                onOpenChange={(o) => !o && setFloorToRemove(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar Piso {floorToRemove}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará todo el diseño realizado sobre el canvas
                      de este piso. Los cambios se perderán de forma definitiva y no
                      podrán recuperarse.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmRemoveFloor}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, eliminar piso
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl bg-card p-4 shadow-sm">
              <h3 className="text-base font-bold text-foreground">
                Editor de mapa de silletería
              </h3>
              <div className="flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <DoorOpen className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Agrega al menos una puerta de ingreso
                </p>
                <p className="text-xs text-muted-foreground">
                  Para acceder al editor de mapa de silletería, primero debes registrar al menos una puerta de ingreso al lugar.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TicketingCard = ({
  selected,
  onClick,
  icon,
  label,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card p-4 text-center transition-all ${
      selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
    }`}
  >
    <span className={selected ? 'text-primary' : 'text-muted-foreground'}>
      {icon}
    </span>
    <span
      className={`text-sm font-semibold leading-tight ${
        selected ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {label}
    </span>
    <span
      className={`text-[11px] font-medium ${
        selected ? 'text-primary/80' : 'text-muted-foreground/70'
      }`}
    >
      {subtitle}
    </span>
  </button>
);


const TemplateCard = ({
  template,
  selected,
  onSelect,
}: {
  template: SeatingMapTemplate;
  selected: boolean;
  onSelect: () => void;
}) => (
  <div
      className={`flex w-56 flex-shrink-0 flex-col overflow-hidden rounded-2xl border-2 bg-card transition-all ${
        selected ? 'border-primary shadow-md' : 'border-border'
      }`}
    >
      <div className="relative flex h-28 w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10">
        <LayoutTemplate className="h-10 w-10 text-primary" />
        {selected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-bold text-foreground">{template.name}</p>
        <p className="text-[11px] text-muted-foreground">{template.city}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
        <p className="text-xs font-medium text-foreground">
          {formatTemplateCapacityLabel(template)}
        </p>
        <p className="text-xs text-muted-foreground">
          {template.floors.length} piso(s) · {template.zones.length} zonas
        </p>
        <SeatingTemplateInfoPanel template={template} compact />
        <Button
          type="button"
          variant={selected ? 'default' : 'outline'}
          size="sm"
          onClick={onSelect}
          className="mt-2 w-full rounded-full"
        >
          {selected ? 'Seleccionada' : 'Usar plantilla'}
        </Button>
      </div>
    </div>
);

const VenueCard = ({
  venue,
  selected,
  onSelect,
}: {
  venue: Venue;
  selected: boolean;
  onSelect: () => void;
}) => (
  <div
    className={`flex w-56 flex-shrink-0 flex-col overflow-hidden rounded-2xl border-2 bg-card transition-all ${
      selected ? 'border-primary shadow-md' : 'border-border'
    }`}
  >
    <div className="relative h-28 w-full bg-muted">
      {venue.image ? (
        <img
          src={venue.image}
          alt={venue.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary/40">
          <Home className="h-10 w-10" />
        </div>
      )}
      {selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-1 p-3">
      <p className="line-clamp-2 text-sm font-bold text-foreground">
        {venue.name}
      </p>
      <p className="text-[11px] text-muted-foreground">{venue.shortCode}</p>
      <p className="text-xs text-muted-foreground">
        Capacidad: {venue.capacity} personas
      </p>
      <Button
        type="button"
        variant={selected ? 'default' : 'outline'}
        size="sm"
        onClick={onSelect}
        className="mt-2 w-full rounded-full"
      >
        {selected ? 'Seleccionado' : 'Seleccionar'}
      </Button>
    </div>
  </div>
);

export const SeatingPreview = ({
  figures,
  height = 240,
  seatStatesByFigure,
  interactive = false,
  onSeatClick,
}: {
  figures: import('@lovable/data/eventFormData').SeatingFigure[];
  height?: number | string;
  seatStatesByFigure?: Map<string, Record<string, import('../../../lovable-bridge/venueToFigures').SeatVisualState>>;
  interactive?: boolean;
  onSeatClick?: (figure: import('@lovable/data/eventFormData').SeatingFigure, label: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerW(e.contentRect.width);
    });
    ro.observe(el);
    setContainerW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  if (figures.length === 0) {
    return <div className="w-full rounded-lg bg-secondary" style={{ height }} />;
  }

  const needW = Math.max(...figures.map((f) => f.x + f.w));
  const needH = Math.max(...figures.map((f) => f.y + f.h));
  const worldW = Math.max(100, Math.ceil((needW + 20) / 10) * 10);
  const worldH = Math.max(100, Math.ceil((needH + 20) / 10) * 10);
  const EDITOR_REFERENCE_W = 1100;
  const fontScale = containerW > 0 ? containerW / EDITOR_REFERENCE_W : 0.5;
  const useFixedHeight = typeof height === 'number' || (typeof height === 'string' && !height.includes('%'));

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg bg-secondary"
      style={useFixedHeight ? { height } : { aspectRatio: `${worldW} / ${worldH}` }}
    >
      {figures.map((f) => {
        const rot = f.rotation ?? 0;
        const isImage = f.shape === 'image';
        const hasImage = !!f.imageUrl;
        return (
          <div
            key={f.id}
            className="absolute"
            style={{
              left: `${(f.x / worldW) * 100}%`,
              top: `${(f.y / worldH) * 100}%`,
              width: `${(f.w / worldW) * 100}%`,
              height: `${(f.h / worldH) * 100}%`,
              transform: `rotate(${rot}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              style={{
                background: hasImage || isImage ? '#fff' : f.color,
                color: f.color,
                ...shapeStyle(f.shape, {
                  arcInner: f.arcInner,
                  arcSpan: f.arcSpan,
                  rows: f.rows,
                  seatsPerRow: f.seatsPerRow,
                }),
                ...(hasImage
                  ? {
                      backgroundImage: `url(${f.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      border: 'none',
                    }
                  : {}),
              }}
            >
              {!hasImage && !isImage &&
                f.role === 'category' &&
                (f.rows ?? 0) > 0 &&
                (f.seatsPerRow ?? 0) > 0 && (
                  <SeatsGrid
                    figure={f}
                    seatStates={seatStatesByFigure?.get(f.id)}
                    interactive={interactive}
                    onSeatClick={onSeatClick ? (label) => onSeatClick(f, label) : undefined}
                  />
                )}
            </div>
          </div>
        );
      })}
      {figures.map((f) => {
        if (f.shape === 'image' || !f.name) return null;
        const labelDx = f.labelDx ?? 0;
        const labelDy = f.labelDy ?? 0;
        const labelRot = f.labelRotation ?? 0;
        const cx = f.x + f.w / 2 + labelDx;
        const cy = f.y + f.h / 2 + labelDy;
        return (
          <div
            key={`label-${f.id}`}
            className="pointer-events-none absolute"
            style={{
              left: `${(cx / worldW) * 100}%`,
              top: `${(cy / worldH) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${labelRot}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <span
              className="inline-block px-1 text-center"
              style={{
                color: f.textColor ?? '#1e293b',
                fontFamily: f.fontFamily,
                fontSize: `${Math.max(4, (f.fontSize ?? 11) * fontScale)}px`,
                fontWeight: f.fontWeight ?? 'bold',
                fontStyle: f.fontStyle ?? 'normal',
                textDecoration: f.textDecoration ?? 'none',
                textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                whiteSpace: 'nowrap',
                lineHeight: 1.05,
              }}
            >
              {f.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StepEventLocation;
