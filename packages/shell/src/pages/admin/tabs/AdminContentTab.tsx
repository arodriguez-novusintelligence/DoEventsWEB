import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ExternalLink,
  MapPin,
  Search,
  Trash2,
  Briefcase,
} from 'lucide-react';
import {
  deleteAdminEvent,
  deleteAdminService,
  deleteAdminVenue,
  fetchAdminEvents,
  fetchAdminServices,
  fetchAdminVenues,
  getAdminEventDetail,
  getAdminServiceDetail,
  getAdminVenueDetail,
  getCurrentEnv,
  useToast,
  type AdminEventItem,
  type AdminServiceItem,
  type AdminVenueItem,
} from '@doevents/shared';

type ContentKind = 'events' | 'venues' | 'services';

const KIND_LABELS: Record<ContentKind, string> = {
  events: 'Eventos',
  venues: 'Lugares',
  services: 'Servicios',
};

export const AdminContentTab: React.FC = () => {
  const { showToast } = useToast();
  const [kind, setKind] = useState<ContentKind>('events');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [venues, setVenues] = useState<AdminVenueItem[]>([]);
  const [services, setServices] = useState<AdminServiceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminEventItem | AdminVenueItem | AdminServiceItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, venRes, svcRes] = await Promise.all([
        fetchAdminEvents(),
        fetchAdminVenues(100),
        fetchAdminServices(100),
      ]);
      setEvents(evRes.events || []);
      setVenues(venRes.venues || []);
      setServices(svcRes.services || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cargar contenido', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = <T,>(rows: T[], pick: (r: T) => string) => {
      if (!q) return rows;
      return rows.filter((r) => pick(r).toLowerCase().includes(q));
    };
    if (kind === 'events') {
      return filter(events, (e) => `${e.nombre} ${e.ciudad || ''} ${e.id}`);
    }
    if (kind === 'venues') {
      return filter(venues, (v) => `${v.name} ${v.city || ''} ${v.venueId}`);
    }
    return filter(services, (s) => `${s.name} ${s.category || ''} ${s.serviceId}`);
  }, [kind, query, events, venues, services]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      if (kind === 'events') setDetail(await getAdminEventDetail(id));
      else if (kind === 'venues') setDetail(await getAdminVenueDetail(id));
      else setDetail(await getAdminServiceDetail(id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cargar el detalle', 'error');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const publicUrl = () => {
    const base = getCurrentEnv().webBaseUrl || '';
    if (!detail || !selectedId) return '';
    if (kind === 'events') return `${base}/events/${selectedId}`;
    if (kind === 'venues') return `${base}/places/${selectedId}`;
    return `${base}/services/${selectedId}`;
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const label = KIND_LABELS[kind].slice(0, -1).toLowerCase();
    if (!window.confirm(`¿Eliminar este ${label}? Esta acción no se puede deshacer.`)) return;
    try {
      if (kind === 'events') await deleteAdminEvent(selectedId);
      else if (kind === 'venues') await deleteAdminVenue(selectedId);
      else await deleteAdminService(selectedId);
      showToast(`${KIND_LABELS[kind].slice(0, -1)} eliminado`, 'success');
      setSelectedId(null);
      setDetail(null);
      await loadLists();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo eliminar', 'error');
    }
  };

  const KindIcon = kind === 'events' ? Calendar : kind === 'venues' ? MapPin : Briefcase;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-bold">Gestión de contenido</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta el detalle de eventos, lugares y servicios publicados antes de eliminarlos o gestionarlos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(KIND_LABELS) as ContentKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setKind(k); setSelectedId(null); setDetail(null); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                kind === k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
              }`}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-3 text-sm"
            placeholder={`Buscar en ${KIND_LABELS[kind].toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold">{KIND_LABELS[kind]} ({items.length})</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            <div className="max-h-[28rem] space-y-2 overflow-y-auto">
              {kind === 'events' && (items as AdminEventItem[]).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openDetail(item.id)}
                  className={`flex w-full items-start justify-between rounded-xl border p-3 text-left text-sm ${
                    selectedId === item.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{item.ciudad || '—'} · {item.estatus}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item.id.slice(0, 8)}…</span>
                </button>
              ))}
              {kind === 'venues' && (items as AdminVenueItem[]).map((item) => (
                <button
                  key={item.venueId}
                  type="button"
                  onClick={() => void openDetail(item.venueId)}
                  className={`flex w-full items-start justify-between rounded-xl border p-3 text-left text-sm ${
                    selectedId === item.venueId ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.city || '—'}</p>
                  </div>
                </button>
              ))}
              {kind === 'services' && (items as AdminServiceItem[]).map((item) => (
                <button
                  key={item.serviceId}
                  type="button"
                  onClick={() => void openDetail(item.serviceId)}
                  className={`flex w-full items-start justify-between rounded-xl border p-3 text-left text-sm ${
                    selectedId === item.serviceId ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category || '—'} · {item.status || 'active'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          {!selectedId ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
              <KindIcon className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">Selecciona un elemento para ver su detalle</p>
            </div>
          ) : detailLoading ? (
            <p className="text-sm text-muted-foreground">Cargando detalle...</p>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {(detail as AdminVenueItem).mainImage || (detail as AdminServiceItem).profileImageUrl || (detail as AdminEventItem).imagen ? (
                  <img
                    src={(detail as AdminVenueItem).mainImage || (detail as AdminServiceItem).profileImageUrl || (detail as AdminEventItem).imagen}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted">
                    <KindIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold leading-tight">
                    {kind === 'events'
                      ? (detail as AdminEventItem).nombre
                      : kind === 'venues'
                        ? (detail as AdminVenueItem).name
                        : (detail as AdminServiceItem).name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground break-all">ID: {selectedId}</p>
                </div>
              </div>

              <dl className="space-y-2 text-sm">
                {kind === 'events' && (
                  <>
                    <Row label="Estado" value={(detail as AdminEventItem).estatus} />
                    <Row label="Ciudad" value={(detail as AdminEventItem).ciudad} />
                    <Row label="Fechas" value={`${(detail as AdminEventItem).fechaIni || '—'} → ${(detail as AdminEventItem).fechaFin || '—'}`} />
                    <Row label="Organizador" value={(detail as AdminEventItem).userId} />
                    {(detail as AdminEventItem).descripcion && (
                      <Row label="Descripción" value={(detail as AdminEventItem).descripcion} />
                    )}
                  </>
                )}
                {kind === 'venues' && (
                  <>
                    <Row label="Ciudad" value={(detail as AdminVenueItem).city} />
                    <Row label="Dirección" value={(detail as AdminVenueItem).address} />
                    <Row label="Capacidad" value={String((detail as AdminVenueItem).capacity || '—')} />
                    <Row label="Propietario" value={(detail as AdminVenueItem).ownerUserId} />
                    {(detail as AdminVenueItem).description && (
                      <Row label="Descripción" value={(detail as AdminVenueItem).description} />
                    )}
                  </>
                )}
                {kind === 'services' && (
                  <>
                    <Row label="Categoría" value={(detail as AdminServiceItem).category} />
                    <Row label="Ciudad" value={(detail as AdminServiceItem).city} />
                    <Row label="Estado" value={(detail as AdminServiceItem).status} />
                    <Row label="Proveedor" value={(detail as AdminServiceItem).userId} />
                    {(detail as AdminServiceItem).description && (
                      <Row label="Descripción" value={(detail as AdminServiceItem).description} />
                    )}
                  </>
                )}
              </dl>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <a
                  href={publicUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver en la app
                </a>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
    </div>
  );
}

export default AdminContentTab;
