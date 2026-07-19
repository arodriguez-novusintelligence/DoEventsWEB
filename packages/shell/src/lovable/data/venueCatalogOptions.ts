import { accesibilidad, seguridad, servicios } from './venueOptions';

export interface VenueCatalogOption {
  id: string;
  label: string;
}

export interface VenueCatalogSelection {
  id: string;
  label: string;
}

function buildCatalog(prefix: string, labels: readonly string[]): VenueCatalogOption[] {
  return labels.map((label, index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
    label,
  }));
}

export const VENUE_INCLUDED_SERVICE_CATALOG = buildCatalog('venue-svc', servicios);
export const VENUE_ACCESSIBILITY_CATALOG = buildCatalog('venue-acc', accesibilidad);
export const VENUE_SECURITY_CATALOG = buildCatalog('venue-sec', seguridad);

const catalogById = new Map<string, VenueCatalogOption>([
  ...VENUE_INCLUDED_SERVICE_CATALOG,
  ...VENUE_ACCESSIBILITY_CATALOG,
  ...VENUE_SECURITY_CATALOG,
].map((item) => [item.id, item]));

export function catalogLabelById(id: string): string {
  return catalogById.get(id)?.label || id;
}

export function resolveCatalogSelection(
  value: string,
  catalog: VenueCatalogOption[],
): VenueCatalogSelection {
  const byId = catalog.find((item) => item.id === value);
  if (byId) return { id: byId.id, label: byId.label };
  const byLabel = catalog.find((item) => item.label === value);
  if (byLabel) return { id: byLabel.id, label: byLabel.label };
  const customId = `venue-custom-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
  return { id: customId, label: value };
}

export function normalizeCatalogSelections(
  raw: unknown,
  catalog: VenueCatalogOption[],
): VenueCatalogSelection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (entry && typeof entry === 'object' && 'id' in entry && 'label' in entry) {
      const item = entry as VenueCatalogSelection;
      const known = catalog.find((c) => c.id === item.id);
      return known ? { id: known.id, label: known.label } : item;
    }
    if (typeof entry === 'string') {
      return resolveCatalogSelection(entry, catalog);
    }
    return null;
  }).filter((item): item is VenueCatalogSelection => Boolean(item?.label));
}

export function catalogSelectionLabels(items: VenueCatalogSelection[]): string[] {
  return items.map((item) => item.label);
}
