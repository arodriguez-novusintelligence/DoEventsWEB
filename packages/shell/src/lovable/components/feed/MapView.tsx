/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Crosshair, Ruler, ChevronDown, Navigation, MapPin, Calendar, Clock, ArrowRight, Users, Star, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { cn } from '@lovable/lib/utils';
import type { PublishedVenueDraft } from '@lovable/components/venues/VenueCreator';
import type { ServiceFormData } from '@lovable/data/servicesData';
import type { MapItemData } from '../../../lovable-bridge/mapAdapter';

const DEFAULT_CENTER = { lat: 6.2442, lng: -75.5812 };

type Category = 'eventos' | 'lugares' | 'servicios';

interface MapItem {
  id: string;
  category: Category;
  title: string;
  subtitle: string;
  image: string;
  pos: google.maps.LatLngLiteral;
  // event-only
  date?: string;
  timeRange?: string;
  location?: string;
  rating?: number;
  handle?: string;
  refId?: string;
}

// Pin color per category
const PIN_COLOR: Record<Category, string> = {
  eventos: 'hsl(var(--primary))',
  lugares: 'hsl(var(--accent-foreground, var(--primary)) / 0.85)',
  servicios: 'hsl(var(--chart-2, var(--primary)) / 0.75)',
};

const CATEGORY_LABEL: Record<Category, string> = {
  eventos: 'Eventos',
  lugares: 'Lugares',
  servicios: 'Servicios',
};

const NAV_CLEARANCE = 'calc(7.5rem + env(safe-area-inset-bottom, 0px))';

// Load Google Maps JS API once
let googleMapsPromise: Promise<typeof google> | null = null;
function loadGoogleMaps(): Promise<typeof google> {
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if ((window as any).google?.maps) return resolve((window as any).google);
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      || import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return reject(new Error('Missing Google Maps browser key'));
    (window as any).__initGoogleMaps = () => resolve((window as any).google);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__initGoogleMaps${channel ? `&channel=${channel}` : ''}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

// Custom HTML overlay for image markers (pin color varies per category)
function createImageMarker(
  google: typeof window.google,
  map: google.maps.Map,
  position: google.maps.LatLngLiteral,
  imageUrl: string,
  color: string,
  onClick: () => void,
  selected: boolean,
) {
  class ImageMarker extends google.maps.OverlayView {
    div: HTMLDivElement | null = null;
    onAdd() {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.cursor = 'pointer';
      div.style.transform = 'translate(-50%, -100%)';
      div.style.zIndex = selected ? '10' : '1';
      div.innerHTML = `
        <div style="position:relative;width:56px;height:68px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.3));">
          <svg viewBox="0 0 56 68" width="56" height="68" style="position:absolute;inset:0;">
            <path d="M28 67 C28 67 4 42 4 24 a24 24 0 1 1 48 0 C52 42 28 67 28 67 Z"
                  fill="${color}"
                  stroke="${selected ? '#ffffff' : 'rgba(255,255,255,.9)'}"
                  stroke-width="${selected ? 3 : 2}"/>
          </svg>
          <div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);width:40px;height:40px;border-radius:50%;background:url('${imageUrl}') center/cover;border:2px solid white;"></div>
        </div>`;
      div.addEventListener('click', onClick);
      this.div = div;
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(div);
    }
    draw() {
      if (!this.div) return;
      const proj = this.getProjection();
      if (!proj) return;
      const point = proj.fromLatLngToDivPixel(new google.maps.LatLng(position));
      if (point) {
        this.div.style.left = `${point.x}px`;
        this.div.style.top = `${point.y}px`;
      }
    }
    onRemove() {
      this.div?.parentNode?.removeChild(this.div);
      this.div = null;
    }
  }
  const m = new ImageMarker() as unknown as google.maps.OverlayView;
  m.setMap(map);
  return m;
}

export interface MapViewProps {
  mapItems?: MapItemData[];
  userLocation?: { lat: number; lng: number };
  distanceKm?: number;
  distanceOptions?: number[];
  loading?: boolean;
  onDistanceChange?: (km: number) => void;
  onOpenEvent?: (eventId: string) => void;
  onOpenVenue?: (venueId?: string) => void;
  onOpenService?: (serviceId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

const FILTERS: Array<{ key: 'todos' | Category; label: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'lugares', label: 'Lugares' },
  { key: 'servicios', label: 'Servicios' },
];

const MapView = ({
  mapItems,
  userLocation,
  distanceKm: distanceKmProp = 5,
  distanceOptions = [5, 10, 25, 50],
  loading = false,
  onDistanceChange,
  onOpenEvent,
  onOpenVenue,
  onOpenService,
  onOpenProfile,
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef<google.maps.OverlayView[]>([]);
  const mapInitializedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | Category>('todos');
  const [distanceMenuOpen, setDistanceMenuOpen] = useState(false);
  const distance = distanceKmProp;
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mapRetryKey, setMapRetryKey] = useState(0);

  const items = useMemo<MapItem[]>(() => (
    (mapItems || []).map((it) => ({
      id: it.id,
      category: it.category,
      title: it.title,
      subtitle: it.subtitle,
      image: it.image,
      pos: { lat: it.lat, lng: it.lng },
      date: it.date,
      timeRange: it.timeRange,
      location: it.location,
      rating: it.rating,
      handle: it.handle,
      refId: it.refId,
    }))
  ), [mapItems]);

  const filtered = items.filter((it) => {
    if (filter !== 'todos' && it.category !== filter) return false;
    if (searchQuery && !it.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (mapInitializedRef.current && mapRetryKey === 0) return;
    if (mapRetryKey > 0) {
      mapInitializedRef.current = false;
      mapInstance.current = null;
      setLoaded(false);
      setError(null);
    }
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current || mapInitializedRef.current) return;
        const withCoords = items.filter((it) => it.pos.lat && it.pos.lng);
        const center = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : withCoords.length
            ? {
              lat: withCoords.reduce((s, it) => s + it.pos.lat, 0) / withCoords.length,
              lng: withCoords.reduce((s, it) => s + it.pos.lng, 0) / withCoords.length,
            }
            : DEFAULT_CENTER;
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        mapInitializedRef.current = true;
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
    return () => { cancelled = true; };
  }, [items, userLocation, mapRetryKey]);

  useEffect(() => {
    if (!loaded || !mapInstance.current || !(window as any).google || !userLocation) return;
    const google = (window as any).google;
    const position = { lat: userLocation.lat, lng: userLocation.lng };
    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        map: mapInstance.current,
        position,
        clickable: false,
        zIndex: 999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: 'hsl(var(--primary))',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Tu ubicación',
      });
      return;
    }
    userMarkerRef.current.setPosition(position);
  }, [loaded, userLocation]);

  // Render markers
  useEffect(() => {
    if (!loaded || !mapInstance.current || !(window as any).google) return;
    const google = (window as any).google;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    filtered.forEach((it) => {
      const m = createImageMarker(
        google,
        mapInstance.current!,
        it.pos,
        it.image,
        PIN_COLOR[it.category],
        () => setSelectedId(it.id),
        selectedId === it.id,
      );
      markersRef.current.push(m);
    });
  }, [loaded, filtered, selectedId]);

  const handleLocate = () => {
    if (!userLocation) return;
    mapInstance.current?.panTo(userLocation);
    mapInstance.current?.setZoom(14);
  };

  const handleOpenItem = (it: MapItem) => {
    if (it.category === 'eventos' && it.refId) {
      onOpenEvent?.(it.refId);
      return;
    }
    if (it.category === 'servicios' && it.refId) {
      onOpenService?.(it.refId);
      return;
    }
    if (it.category === 'lugares') {
      onOpenVenue?.(it.refId);
    }
  };

  const selectedItem = filtered.find((i) => i.id === selectedId) || null;

  return (
    <div
      className="relative flex flex-col bg-background"
      style={{ height: 'calc(100dvh - 4rem)', paddingBottom: NAV_CLEARANCE }}
    >
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="relative flex flex-col items-center rounded-2xl bg-card px-6 py-4 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">Cargando mapa…</p>
          </div>
        </div>
      )}
      {/* Floating search + distance */}
      <div className="absolute left-0 right-0 top-0 z-30 flex items-center gap-2 px-3 pt-3">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-lg border border-border">
          <Search className="h-4 w-4 text-primary shrink-0" />
          <input
            type="text"
            placeholder="Buscar evento, lugar o perfil"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Crosshair className="h-4 w-4 text-foreground/70 shrink-0" />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDistanceMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2.5 shadow-lg border border-border active:scale-95"
          >
            <Ruler className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{distance} km</span>
            <ChevronDown className="h-3.5 w-3.5 text-primary" />
          </button>
          {distanceMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDistanceMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-xl border border-border bg-card py-1 shadow-xl">
                {distanceOptions.map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => {
                      onDistanceChange?.(km);
                      setDistanceMenuOpen(false);
                    }}
                    className={cn(
                      'block w-full px-4 py-2 text-left text-sm hover:bg-accent',
                      km === distance ? 'font-bold text-primary' : 'text-foreground',
                    )}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="absolute left-0 right-0 top-[68px] z-30 px-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const color = f.key !== 'todos' ? PIN_COLOR[f.key] : undefined;
            return (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setSelectedId(null); }}
                className={cn(
                  'flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-md transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border'
                )}
              >
                {color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white/80"
                    style={{ backgroundColor: color }}
                  />
                )}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Google Map */}
      <div ref={mapRef} className="flex-1 w-full bg-secondary" />

      {!loaded && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-secondary/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Cargando mapa…</p>
        </div>
      )}

      {loaded && items.length === 0 && !error && (
        <div className="absolute inset-x-6 top-1/3 z-20 flex flex-col items-center rounded-2xl border border-dashed border-primary/25 bg-card/95 p-6 text-center shadow-lg">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Sin eventos cerca</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajusta el radio de búsqueda o explora otra categoría.
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 top-28 z-30 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-sm text-destructive">No se pudo cargar Google Maps: {error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 gap-1.5 rounded-full"
            onClick={() => {
              googleMapsPromise = null;
              setMapRetryKey((k) => k + 1);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Locate button — solo centra el mapa cuando el usuario lo solicita */}
      <button
        type="button"
        onClick={handleLocate}
        disabled={!userLocation}
        className="absolute right-4 bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px)+5.5rem)] z-30 flex h-11 w-11 items-center justify-center rounded-full bg-card border border-border shadow-lg text-primary hover:bg-accent disabled:opacity-40"
        aria-label="Centrar en mi ubicación"
      >
        <Navigation className="h-5 w-5" />
      </button>

      {/* Bottom cards — above floating BottomNav */}
      <div
        className="absolute left-0 right-0 z-50 pb-2 pointer-events-auto"
        style={{ bottom: NAV_CLEARANCE }}
      >
        <div className="flex justify-center pb-2 pt-1">
          <div className="h-1 w-12 rounded-full bg-foreground/30" />
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory">
          {filtered.map((it) => (
            <button
              key={it.id}
              onClick={() => {
                if (selectedId === it.id) handleOpenItem(it);
                else setSelectedId(it.id);
              }}
              className={cn(
                'shrink-0 w-[85%] snap-center rounded-full bg-card border shadow-xl overflow-hidden transition-all flex items-center gap-3 pl-1.5 pr-3 py-1.5 text-left',
                selectedId === it.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              )}
            >
              <div className="relative shrink-0">
                <img src={it.image} alt={it.title} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card"
                  style={{ backgroundColor: PIN_COLOR[it.category] }}
                  aria-label={CATEGORY_LABEL[it.category]}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-card-foreground truncate">{it.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: PIN_COLOR[it.category] }}
              >
                {CATEGORY_LABEL[it.category]}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="w-full rounded-full bg-card border border-border px-4 py-3 text-center text-xs text-muted-foreground">
              Sin resultados para "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Selected detail card */}
      {selectedItem && (
        <div
          className="absolute left-3 right-3 z-30 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ bottom: 'calc(13rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="relative h-40 bg-black">
            <img src={selectedItem.image} alt={selectedItem.title} className="h-full w-full object-cover" />
            <span
              className="absolute top-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow"
              style={{ backgroundColor: PIN_COLOR[selectedItem.category] }}
            >
              {CATEGORY_LABEL[selectedItem.category]}
            </span>
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-card/90 text-foreground flex items-center justify-center shadow"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-bold text-base text-card-foreground">{selectedItem.title}</h3>
            <p className="text-sm text-muted-foreground">{selectedItem.subtitle}</p>

            {selectedItem.location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{selectedItem.location}</span>
              </div>
            )}
            {selectedItem.category === 'eventos' && (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>{selectedItem.date}</span>
                </div>
                {selectedItem.timeRange && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>{selectedItem.timeRange}</span>
                </div>
                )}
              </>
            )}
            {selectedItem.category === 'lugares' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>Capacidad disponible</span>
              </div>
            )}
            {selectedItem.category === 'servicios' && selectedItem.rating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                <span className="font-semibold text-foreground">{selectedItem.rating.toFixed(1)}</span>
                {selectedItem.handle && <span className="text-muted-foreground">· {selectedItem.handle}</span>}
              </div>
            )}

            <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const dest = `${selectedItem.pos.lat},${selectedItem.pos.lng}`;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`, '_blank', 'noopener,noreferrer');
                }}
                className="flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
              >
                Cómo llegar <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleOpenItem(selectedItem)}
                className="flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                Ver detalle <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
