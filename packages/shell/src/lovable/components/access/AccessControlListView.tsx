import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Calendar, MapPin, DoorOpen, Users, ScanLine, Settings2, Plus, Eye, CheckCircle2 } from 'lucide-react';
import { UserAvatar } from '@doevents/shared';
import ScanQRSheet from './ScanQRSheet';
import { toast } from 'sonner';

import type { AccessEventView } from '../../../lovable-bridge/accessAdapter';
import { isAccessControlEnabled } from '../../../lovable-bridge/accessAdapter';
type EventStatus = 'activo' | 'inactivo' | 'proximo' | 'finalizado' | 'cancelado' | 'en-curso';

interface Organizer {
  id: string;
  name: string;
  initials: string;
  email: string;
  avatar?: string;
}

interface AccessEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: EventStatus;
  doors: number;
  staff: number;
  assigned?: boolean;
  organizer?: Organizer;
  assignedGate?: string;
}


interface Props {
  events?: AccessEventView[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onBack: () => void;
  onConfigureEvent?: (event: AccessEvent) => void;
  onAssignEvent?: () => void;
  onConfigure?: (eventId: string) => void;
  onViewOrganizer?: (organizer: Organizer) => void;
  onViewEvent?: (event: AccessEvent) => void;
  initialTab?: 'mios' | 'asignados';
  focusEventId?: string;
  autoOpenScan?: boolean;
}

function mapViewStatus(status: AccessEventView['status']): EventStatus {
  if (status === 'en_ejecucion') return 'en-curso';
  if (status === 'cancelado') return 'cancelado';
  if (status === 'finalizado') return 'finalizado';
  if (status === 'inactivo') return 'inactivo';
  return 'activo';
}

function toAccessEvent(view: AccessEventView): AccessEvent {
  return {
    id: view.id,
    title: view.title,
    date: view.date,
    time: view.time,
    location: view.location,
    status: mapViewStatus(view.status),
    doors: view.doors,
    staff: view.staff,
    assigned: view.assigned,
    assignedGate: view.assignedGate,
    organizer: view.organizer ? {
      id: view.organizer.id || '',
      name: view.organizer.name || 'Organizador',
      initials: (view.organizer.name || 'O').slice(0, 2).toUpperCase(),
      email: view.organizer.email || '',
      avatar: view.organizer.avatar,
    } : undefined,
  };
}

const statusStyles: Record<EventStatus, string> = {
  activo: 'bg-emerald-100 text-emerald-700',
  'en-curso': 'bg-emerald-500 text-primary-foreground',
  proximo: 'bg-amber-100 text-amber-700',
  inactivo: 'bg-muted text-muted-foreground',
  finalizado: 'bg-muted text-muted-foreground',
  cancelado: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<EventStatus, string> = {
  activo: 'Activo',
  'en-curso': 'En curso',
  proximo: 'Próximo',
  inactivo: 'Inactivo',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const parseDMY = (d: string): number => {
  // "DD/MM/YYYY" -> timestamp
  const [dd, mm, yyyy] = d.split('/').map(Number);
  if (!dd || !mm || !yyyy) return 0;
  return new Date(yyyy, mm - 1, dd).getTime();
};

// Orden por prioridad de estado: activos arriba, finalizados/cancelados al final
const statusPriority: Record<EventStatus, number> = {
  'en-curso': 0,
  activo: 1,
  proximo: 2,
  inactivo: 3,
  finalizado: 4,
  cancelado: 5,
};

const sortEvents = (list: AccessEvent[]): AccessEvent[] => {
  return [...list].sort((a, b) => {
    const pa = statusPriority[a.status];
    const pb = statusPriority[b.status];
    if (pa !== pb) return pa - pb;
    // Dentro del mismo grupo: fecha más reciente primero (descendente)
    return parseDMY(b.date) - parseDMY(a.date);
  });
};

const AccessControlListView = ({
  events = [],
  loading = false,
  loadError = null,
  onRetry,
  onBack,
  onConfigureEvent,
  onAssignEvent,
  onConfigure,
  onViewOrganizer,
  onViewEvent,
  initialTab = 'mios',
  focusEventId,
  autoOpenScan = false,
}: Props) => {
  const [tab, setTab] = useState<'mios' | 'asignados'>(initialTab);
  const [scanFor, setScanFor] = useState<AccessEvent | null>(null);

  const mappedEvents = useMemo(
    () => events.map(toAccessEvent),
    [events],
  );

  const items = useMemo(
    () => sortEvents(mappedEvents.filter((e) => (tab === 'mios' ? !e.assigned : e.assigned))),
    [mappedEvents, tab],
  );

  const canScan = (s: EventStatus) => s === 'activo' || s === 'en-curso';
  const isConfigured = (ev: AccessEvent) => ev.doors > 0 && ev.staff > 0;

  useEffect(() => {
    if (!focusEventId || !autoOpenScan) return;
    const match = mappedEvents.find((event) => event.id === focusEventId);
    if (match) {
      setTab(match.assigned ? 'asignados' : 'mios');
      if (canScan(match.status)) {
        setScanFor(match);
      }
    }
  }, [focusEventId, autoOpenScan, mappedEvents]);

  return (
    <div className="min-h-screen bg-secondary pt-16 pb-36">
      <div className="mx-auto max-w-lg">
        {/* Header banner */}
        <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-4 pb-10 rounded-b-3xl">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center justify-between gap-2">
              <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 rounded-lg px-2 py-1 -ml-2 transition">
                <ChevronLeft className="h-4 w-4" /> Atrás
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
                <ScanLine className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-primary-foreground leading-tight truncate">Control de Accesos</h1>
                <p className="text-[11px] text-primary-foreground/80">{mappedEvents.length} Eventos disponibles</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <p className="text-xs text-muted-foreground mb-4 px-1">
            Tus eventos: configuración de puertas y staff, y escaneo de tickets.
          </p>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['mios', 'asignados'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-3 text-sm font-semibold shadow-sm transition-all ${
                  tab === k
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground border border-border'
                }`}
              >
                {k === 'mios' ? 'Mis eventos' : 'Eventos asignados'}
              </button>
            ))}
          </div>

          {/* Event cards */}
          <div className="space-y-4">
            {loading && (
              <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
                Cargando eventos…
              </div>
            )}
            {!loading && loadError && (
              <div className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
                <p>{loadError}</p>
                {onRetry && (
                  <button type="button" onClick={onRetry} className="mt-3 text-primary font-semibold">
                    Reintentar
                  </button>
                )}
              </div>
            )}
            {!loading && !loadError && items.length === 0 && (
              <div className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
                No tienes eventos en esta categoría.
              </div>
            )}

            {items.map((ev) =>
              ev.assigned ? (
                // ===== Assigned event card =====
                <div key={ev.id} className="rounded-2xl bg-card p-5 shadow-md border border-border/40">
                  {/* Organizer */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Organizador</p>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={ev.organizer?.name || 'Organizador'} imageUrl={ev.organizer?.avatar} userId={ev.organizer?.id} size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{ev.organizer?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{ev.organizer?.email}</p>
                      </div>
                      <button
                        onClick={() => ev.organizer && onViewOrganizer?.(ev.organizer)}
                        className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition"
                      >
                        Ver perfil
                      </button>
                    </div>
                  </div>

                  <div className="my-4 border-t border-border/60" />

                  {/* Title + status */}
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-extrabold text-foreground leading-tight">{ev.title}</h2>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[ev.status]}`}>
                      {statusLabels[ev.status]}
                    </span>
                  </div>

                  {/* Dirección */}
                  <p className="mt-3 text-xs font-semibold text-foreground">Dirección</p>
                  <div className="mt-1 flex items-start gap-2 text-sm text-primary font-medium">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="leading-snug">{ev.location}</span>
                  </div>

                  {/* Fecha */}
                  <p className="mt-3 text-xs font-semibold text-foreground">Fecha y hora</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-primary font-medium">
                    <Calendar className="h-4 w-4" />
                    {ev.date} - {ev.time}
                  </div>

                  {/* Puerta asignada */}
                  <p className="mt-3 text-xs font-semibold text-foreground">Puerta asignada</p>
                  <div className="mt-1 flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <DoorOpen className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">{ev.assignedGate ?? 'Por asignar'}</span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => canScan(ev.status) && setScanFor(ev)}
                    disabled={!canScan(ev.status)}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow transition-colors ${
                      canScan(ev.status)
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-primary/30 text-primary-foreground/80 cursor-not-allowed'
                    }`}
                  >
                    <ScanLine className="h-4 w-4" /> Escanear código
                  </button>
                  <button
                    onClick={() => onViewEvent ? onViewEvent(ev) : toast('Ver evento')}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Eye className="h-4 w-4" /> Ver evento
                  </button>
                </div>
              ) : (
                // ===== My event card =====
                <div key={ev.id} className="rounded-2xl bg-card p-5 shadow-md border border-border/40">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-extrabold text-foreground leading-tight">{ev.title}</h2>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
                      {isConfigured(ev) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Configurado
                        </span>
                      )}
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[ev.status]}`}>
                        {statusLabels[ev.status]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-primary font-medium">
                    <Calendar className="h-4 w-4" />
                    {ev.date} – {ev.time}
                  </div>
                  <div className="mt-1 flex items-start gap-2 text-sm text-primary font-medium">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="leading-snug">{ev.location}</span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                      <DoorOpen className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-2xl font-extrabold text-primary leading-none">{ev.doors}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">Puertas</div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                      <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-2xl font-extrabold text-primary leading-none">{ev.staff}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">Staff</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => canScan(ev.status) && setScanFor(ev)}
                    disabled={!canScan(ev.status)}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow transition-colors ${
                      canScan(ev.status)
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-primary/30 text-primary-foreground/80 cursor-not-allowed'
                    }`}
                  >
                    <ScanLine className="h-4 w-4" /> Escanear código
                  </button>
                  <button
                    onClick={() => onConfigureEvent?.(ev) ?? onConfigure?.(ev.id)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Settings2 className="h-4 w-4" /> Configurar
                  </button>
                </div>
              )
            )}
          </div>

          {tab === 'mios' && (
            <button
              onClick={() => onAssignEvent ? onAssignEvent() : toast('Asignar nuevo evento')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
            >
              <Plus className="h-4 w-4" /> Asignar evento
            </button>
          )}
        </div>
      </div>

      <ScanQRSheet
        open={!!scanFor}
        onOpenChange={(v) => !v && setScanFor(null)}
        eventTitle={scanFor?.title || ''}
      />
    </div>
  );
};

export default AccessControlListView;