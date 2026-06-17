export function normalizePublishStatus(status?: string | null): string {
  return String(status || '').toLowerCase().trim();
}

export function isActivePublishStatus(status?: string | null): boolean {
  const s = normalizePublishStatus(status);
  if (!s) return true;
  return ['active', 'activo', 'published', 'publicado', 'en_ejecucion', 'ejecucion'].includes(s);
}

export function isDraftPublishStatus(status?: string | null): boolean {
  const s = normalizePublishStatus(status);
  return ['draft', 'borrador', 'inactive', 'inactivo'].includes(s);
}

export function publishStatusLabel(status?: string | null): string | null {
  if (isActivePublishStatus(status)) return null;
  if (isDraftPublishStatus(status)) return 'Borrador';
  const s = normalizePublishStatus(status);
  if (!s || s === 'deleted' || s === 'eliminado') return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
