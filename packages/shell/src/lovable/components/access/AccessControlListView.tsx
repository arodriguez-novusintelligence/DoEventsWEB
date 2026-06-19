import { useState } from 'react';
import { ChevronLeft, Calendar, MapPin, DoorOpen, Users, ScanLine, Settings2, Plus, Lock, Shield } from 'lucide-react';
import ScanQRSheet from './ScanQRSheet';
import { toast } from 'sonner';
import type { AccessEventView } from '../../../lovable-bridge/accessAdapter';
import { isAccessControlEnabled } from '../../../lovable-bridge/accessAdapter';

interface Props {
  onBack: () => void;
  events?: AccessEventView[];
  onConfigureEvent?: (event: AccessEventView) => void;
  onAssignEvent?: () => void;
}

const statusStyles: Record<AccessEventView['status'], string> = {
  activo: 'bg-emerald-100 text-emerald-700',
  en_ejecucion: 'bg-blue-100 text-blue-700',
  inactivo: 'bg-muted text-muted-foreground',
  finalizado: 'bg-muted text-muted-foreground',
  cancelado: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<AccessEventView['status'], string> = {
  activo: 'Activo',
  en_ejecucion: 'En ejecución',
  inactivo: 'Inactivo',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const EventCard = ({
  ev,
  onScan,
  onConfigure,
}: {
  ev: AccessEventView;
  onScan: (ev: AccessEventView) => void;
  onConfigure?: (ev: AccessEventView) => void;
}) => {
  const canControl = isAccessControlEnabled(ev.status);

  return (
    <div className={`rounded-2xl bg-card p-5 shadow-md border border-border/40 ${!canControl ? 'opacity-90' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-extrabold text-foreground leading-tight">{ev.title}</h2>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[ev.status]}`}>
          {statusLabels[ev.status]}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-primary font-medium">
        <Calendar className="h-4 w-4" />
        {ev.date} – {ev.time}
      </div>
      <div className="mt-1 flex items-start gap-2 text-sm text-primary font-medium">
        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
        <span className="leading-snug">{ev.location}</span>
      </div>

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

      {canControl ? (
        <>
          <button
            onClick={() => onScan(ev)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <ScanLine className="h-4 w-4" /> Escanear código
          </button>
          <button
            onClick={() => onConfigure?.(ev)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            <Settings2 className="h-4 w-4" /> Configurar
          </button>
        </>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            El control de acceso no está disponible para eventos finalizados o cancelados.
          </span>
        </div>
      )}
    </div>
  );
};

const AccessControlListView = ({
  onBack,
  events = [],
  onConfigureEvent,
  onAssignEvent,
}: Props) => {
  const [tab, setTab] = useState<'mios' | 'asignados'>('mios');
  const [scanFor, setScanFor] = useState<AccessEventView | null>(null);

  const tabItems = events.filter((e) => (tab === 'mios' ? !e.assigned : e.assigned));
  const activeItems = tabItems.filter((e) => isAccessControlEnabled(e.status));
  const pastItems = tabItems.filter((e) => e.status === 'finalizado' || e.status === 'cancelado');
  const inactiveItems = tabItems.filter((e) => e.status === 'inactivo');

  const handleScan = (ev: AccessEventView) => {
    if (!isAccessControlEnabled(ev.status)) {
      toast.error('Este evento ya no permite control de acceso');
      return;
    }
    setScanFor(ev);
  };

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="mx-auto max-w-lg">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(var(--primary-deep))] px-5 pt-5 pb-8 rounded-b-3xl">
          <button onClick={onBack} className="text-primary-foreground/90 mb-3">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-primary-foreground">Do</span>
            <span className="h-2 w-2 rounded-full bg-primary-foreground/90" />
            <span className="text-2xl font-extrabold text-primary-foreground">events</span>
          </div>
          <p className="mt-1 text-sm text-primary-foreground/85 font-medium">Control y gestión de accesos</p>
        </div>

        <div className="px-4 -mt-3">
          <p className="text-xs text-muted-foreground mb-4 px-1">
            Solo eventos activos o en ejecución permiten escaneo y configuración de puertas.
          </p>

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

          {tabItems.length === 0 && (
            <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
              <Shield className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-foreground">Sin eventos en esta categoría</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tab === 'mios'
                  ? 'Publica un evento o espera asignación de staff para controlar accesos.'
                  : 'Aún no tienes eventos asignados como staff de acceso.'}
              </p>
            </div>
          )}

          {activeItems.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Activos / En ejecución
                </span>
                <span className="text-xs text-muted-foreground">({activeItems.length})</span>
              </div>
              <div className="space-y-4">
                {activeItems.map((ev) => (
                  <EventCard key={ev.id} ev={ev} onScan={handleScan} onConfigure={onConfigureEvent} />
                ))}
              </div>
            </section>
          )}

          {inactiveItems.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Inactivos
                </span>
                <span className="text-xs text-muted-foreground">({inactiveItems.length})</span>
              </div>
              <div className="space-y-4">
                {inactiveItems.map((ev) => (
                  <EventCard key={ev.id} ev={ev} onScan={handleScan} onConfigure={onConfigureEvent} />
                ))}
              </div>
            </section>
          )}

          {pastItems.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Finalizados / Cancelados
                </span>
                <span className="text-xs text-muted-foreground">({pastItems.length})</span>
              </div>
              <div className="space-y-4">
                {pastItems.map((ev) => (
                  <EventCard key={ev.id} ev={ev} onScan={handleScan} onConfigure={onConfigureEvent} />
                ))}
              </div>
            </section>
          )}

          {tab === 'mios' && (
            <button
              onClick={() => {
                if (onAssignEvent) onAssignEvent();
                else toast.info('La asignación de staff requiere invitación del organizador');
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
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
        eventId={scanFor?.id || ''}
      />
    </div>
  );
};

export default AccessControlListView;
