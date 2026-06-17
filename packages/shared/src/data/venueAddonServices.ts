export interface VenueAddonService {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'evento' | 'día' | 'dia';
  /** Miniatura del servicio publicado (proveedor). */
  imageUrl?: string;
  /** Distancia al lugar en km, si está disponible. */
  distanceKm?: number;
}

/** @deprecated Sin datos mock — configurar en el formulario del lugar */
export const DEFAULT_VENUE_ADDON_SERVICES: VenueAddonService[] = [];

export function normalizeVenueAddonServices(raw: unknown): VenueAddonService[] {
  if (!Array.isArray(raw)) return [];
  const parsed = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const id = String(row.id || '').trim();
      const name = String(row.name || '').trim();
      const price = Number(row.price);
      if (!id || !name || !Number.isFinite(price) || price < 0) return null;
      const unitRaw = String(row.unit || 'evento').toLowerCase();
      const unit: VenueAddonService['unit'] = unitRaw === 'día' || unitRaw === 'dia' ? 'día' : 'evento';
      return {
        id,
        name,
        description: String(row.description || '').trim() || name,
        price: Math.round(price),
        unit,
      } satisfies VenueAddonService;
    })
    .filter(Boolean) as VenueAddonService[];
  return parsed;
}
