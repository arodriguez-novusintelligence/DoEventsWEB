import { useState } from 'react';
import { Calendar, MapPin, DoorOpen, Users, ScanLine, Settings2, Plus, Lock, Shield, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import ScanQRSheet from './ScanQRSheet';
import { toast } from 'sonner';
import ProfileSectionBanner from '@lovable/components/profile/ProfileSectionBanner';
import { Button } from '@lovable/components/ui/button';
import type { AccessEventView } from '../../../lovable-bridge/accessAdapter';
import { isAccessControlEnabled } from '../../../lovable-bridge/accessAdapter';

interface Props {
  onBack: () => void;
  events?: AccessEventView[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onConfigureEvent?: (event: AccessEventView) => void;
  onAssignEvent?: () => void;
}

const statusStyles: Record<AccessEventView['status'], string> = {
  activo: 'bg-success/10 text-success',
  en_ejecucion: 'bg-primary/10 text-primary',
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
    <div className={`rounded-2xl bg-card p-5 shadow-sm border border-border/60 ${!canControl ? 'opacity-90' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-extrabold text-foreground leading-tight">{ev.title}</h2>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm ${statusStyles[ev.status]}`}>
          {statusLabels[ev.status]}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm text-primary font-extrabold">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <Calendar className="h-4 w-4" />
        </span>
        {ev.date} – {ev.time}
      </div>
      <div className="mt-1 flex items-start gap-2 text-sm text-primary font-extrabold">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <MapPin className="h-4 w-4" />
        </span>
        <span className="leading-snug">{ev.location}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
          <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <DoorOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-primary leading-none">{ev.doors}</div>
          <div className="text-[11px] font-extrabold text-muted-foreground mt-1">Puertas</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm">
          <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-primary leading-none">{ev.staff}</div>
          <div className="text-[11px] font-extrabold text-muted-foreground mt-1">Staff</div>
        </div>
      </div>

      {canControl ? (
        <>
          <button
            onClick={() => onScan(ev)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <ScanLine className="h-4 w-4" /> Escanear código
          </button>
          <button
            onClick={() => onConfigure?.(ev)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-extrabold text-primary shadow-sm hover:bg-primary/5 transition-colors"
          >
            <Settings2 className="h-4 w-4" /> Configurar
          </button>
        </>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-3 text-xs font-extrabold text-muted-foreground shadow-sm">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-primary/20">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </span>
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
  loading = false,
  loadError = null,
  onRetry,
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
        <ProfileSectionBanner
          title="Control de accesos"
          subtitle="Escaneo QR y gestión de puertas"
          icon={Shield}
          onBack={onBack}
        />

        <div className="px-4 pt-4">
          <p className="text-xs font-extrabold text-muted-foreground mb-4 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
            Solo eventos activos o en ejecución permiten escaneo y configuración de puertas.
          </p>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground">Cargando eventos…</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <p className="mt-3 text-sm font-extrabold text-destructive">{loadError}</p>
              {onRetry && (
                <Button type="button" variant="outline" size="sm" className="mt-4 gap-1.5 rounded-full font-extrabold shadow-sm" onClick={onRetry}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reintentar
                </Button>
              )}
            </div>
          )}

          {!loading && !loadError && (
          <>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {(['mios', 'asignados'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-3 text-sm font-extrabold shadow-sm transition-all ${
                  tab === k
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
                    : 'bg-card text-muted-foreground border border-border/60'
                }`}
              >
                {k === 'mios' ? 'Mis eventos' : 'Eventos asignados'}
              </button>
            ))}
          </div>

          {tabItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-primary/25 border-border/60 bg-card p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <p className="mt-3 text-sm font-extrabold text-foreground">Sin eventos en esta categoría</p>
              <p className="mt-1 text-xs font-extrabold text-muted-foreground">
                {tab === 'mios'
                  ? 'Publica un evento o espera asignación de staff para controlar accesos.'
                  : 'Aún no tienes eventos asignados como staff de acceso.'}
              </p>
            </div>
          )}

          {activeItems.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-extrabold text-success shadow-sm">
                  Activos / En ejecución
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">({activeItems.length})</span>
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
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-extrabold text-muted-foreground shadow-sm">
                  Inactivos
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">({inactiveItems.length})</span>
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
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-extrabold text-muted-foreground shadow-sm">
                  Finalizados / Cancelados
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">({pastItems.length})</span>
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-primary/25 border-border/60 bg-primary/5 px-4 py-3 text-sm font-extrabold text-primary shadow-sm"
            >
              <Plus className="h-4 w-4" /> Asignar evento
            </button>
          )}
          </>
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
