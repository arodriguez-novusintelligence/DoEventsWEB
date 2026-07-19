import { useMemo, useState } from 'react';
import { CheckCircle2, DoorOpen, MapPin, Trash2, UserPlus, Users, HelpCircle } from 'lucide-react';
import { UserAvatar, resolveUserAvatarUrl } from '@doevents/shared';
import { EventFormData, EventGate, EventHost, EventFormUpdater } from '@lovable/data/eventFormData';
import UserSearchPickerModal, { type UserSearchResult } from '../../../components/UserSearchPickerModal';

interface Props {
  formData: EventFormData;
  updateForm: EventFormUpdater;
}

const toEventHost = (user: UserSearchResult): EventHost => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: resolveUserAvatarUrl(user.avatarUrl, user.id),
  initials: user.initials,
  source: 'platform',
});

const StepAccessControl = ({ formData, updateForm }: Props) => {
  const gates: EventGate[] = formData.location.gates ?? [];
  const assignments = formData.accessControl ?? {};
  const staffById = formData.accessStaff ?? {};
  const [pickerGateId, setPickerGateId] = useState<string | null>(null);

  const totalAssigned = useMemo(
    () => gates.reduce((s, g) => s + (assignments[g.id]?.length ?? 0), 0),
    [gates, assignments],
  );
  const gatesWithStaff = gates.filter((g) => (assignments[g.id]?.length ?? 0) > 0).length;
  const allAssigned = gates.length > 0 && gatesWithStaff === gates.length;

  const removeUser = (gateId: string, userId: string) => {
    updateForm((prev) => {
      const ac = prev.accessControl ?? {};
      return {
        accessControl: {
          ...ac,
          [gateId]: (ac[gateId] ?? []).filter((id) => id !== userId),
        },
      };
    });
  };

  const addUsers = (gateId: string, users: UserSearchResult[]) => {
    updateForm((prev) => {
      const ac = prev.accessControl ?? {};
      const staff = { ...(prev.accessStaff ?? {}) };
      const existing = new Set(ac[gateId] ?? []);
      users.forEach((u) => {
        existing.add(u.id);
        staff[u.id] = toEventHost(u);
      });
      return {
        accessControl: { ...ac, [gateId]: Array.from(existing) },
        accessStaff: staff,
      };
    });
  };

  if (gates.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
          <DoorOpen className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-extrabold text-foreground">Sin puertas configuradas</h3>
        <p className="mt-1 text-sm font-extrabold text-muted-foreground">
          Vuelve al paso de Lugar y agrega al menos una puerta para asignar personal de acceso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-primary">Control de accesos</h2>
        <p className="mt-1 text-sm text-foreground">
          Asigna el personal a cada puerta del lugar, encargado de escanear los QR de los boletos a la entrada de tu evento.{' '}
          <span className="font-extrabold">Recuerda, deben ser usuarios de la plataforma.</span>
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-foreground">{formData.name || 'Evento sin nombre'}</h3>
        {formData.location.detectedCity && (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-extrabold text-primary">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formData.location.detectedCity}
          </p>
        )}
        <p className="mt-3 text-sm font-extrabold text-foreground">Personal asignado</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-secondary/60 p-4 text-center shadow-sm">
            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <DoorOpen className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-extrabold text-primary tabular-nums">{gates.length}</p>
            <p className="text-xs font-extrabold text-muted-foreground">Puertas</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-secondary/60 p-4 text-center shadow-sm">
            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-extrabold text-primary tabular-nums">{totalAssigned}</p>
            <p className="text-xs font-extrabold text-muted-foreground">Asignados</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-extrabold text-muted-foreground">
          <span>Configuración de puertas</span>
          <span className="font-extrabold">
            {gatesWithStaff}/{gates.length} asignadas
          </span>
        </div>
      </div>

      {/* Banner */}
      {allAssigned ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-success/10 px-4 py-3 text-sm font-extrabold text-success shadow-sm">
          <CheckCircle2 className="h-5 w-5" />
          Asignación completa
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-primary/10 px-4 py-3 text-sm font-extrabold text-primary shadow-sm">
          <HelpCircle className="h-5 w-5" />
          Asigna al menos una persona por puerta
        </div>
      )}

      {/* Gate cards */}
      <div className="space-y-4">
        {gates.map((gate) => {
          const userIds = assignments[gate.id] ?? [];
          const assigned = userIds.map((id) => staffById[id] || {
            id,
            name: 'Usuario',
            initials: 'U',
            source: 'platform' as const,
          });
          return (
            <div key={gate.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-primary/20 text-primary">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-foreground">{gate.name}</p>
                  <p className="text-xs font-extrabold text-muted-foreground">Personal asignado ({assigned.length})</p>
                </div>
              </div>

              {assigned.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/25 border-border/60 bg-secondary/40 py-8 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                    <UserPlus className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-extrabold text-foreground">Sin personal asignado</p>
                  <p className="text-xs font-extrabold text-muted-foreground">Asigna usuarios de la plataforma a esta puerta</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assigned.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar name={u.name} imageUrl={u.avatar} userId={u.id} size={40} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-foreground">{u.name}</p>
                          <p className="truncate text-xs font-extrabold text-muted-foreground">
                            {u.username ? `@${u.username.replace(/^@/, '')}` : u.email || ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUser(gate.id, u.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-destructive/30 text-destructive shadow-sm hover:bg-destructive/10"
                        aria-label={`Quitar ${u.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setPickerGateId(gate.id)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-3 text-sm font-extrabold text-primary shadow-sm"
              >
                <UserPlus className="h-4 w-4" /> Asignar personal
              </button>
            </div>
          );
        })}
      </div>

      {pickerGateId && (
        <UserSearchPickerModal
          title="Asignar personal"
          subtitle={gates.find((g) => g.id === pickerGateId)?.name}
          alreadyAssigned={assignments[pickerGateId] ?? []}
          confirmLabel="Asignar seleccionados"
          onConfirm={(users) => {
            addUsers(pickerGateId, users);
            setPickerGateId(null);
          }}
          onClose={() => setPickerGateId(null)}
        />
      )}
    </div>
  );
};

export default StepAccessControl;
