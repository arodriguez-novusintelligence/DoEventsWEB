import { useMemo, useState } from 'react';
import { Calendar, CalendarDays, Clock, Pencil, Plus, User, X } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import {
  EventActivity,
  EventDay,
  EventFormData,
  EventHost,
} from '@lovable/data/eventFormData';
import UserSearchPickerModal, { type UserSearchResult } from '../../../components/UserSearchPickerModal';

interface Props {
  formData: EventFormData;
  updateForm: (partial: Partial<EventFormData>) => void;
}

const newActivity = (): EventActivity => ({
  id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  startTime: '17:00',
  endTime: '17:00',
  description: '',
});

const newDay = (idx: number): EventDay => ({
  id: `day-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: `Día ${idx}`,
  date: '',
  activities: [newActivity()],
});

const isTimeRangeValid = (start: string, end: string): boolean => {
  if (!start || !end) return true;
  return start <= end;
};

const StepAgenda = ({ formData, updateForm }: Props) => {
  const days: EventDay[] = formData.agenda?.length
    ? formData.agenda
    : [newDay(1)];

  const [selectedDayId, setSelectedDayId] = useState<string>(days[0].id);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [pickerActivityId, setPickerActivityId] = useState<string | null>(null);




  const selectedDay = days.find((d) => d.id === selectedDayId) ?? days[0];

  const updateDays = (next: EventDay[]) => updateForm({ agenda: next });

  const addDay = () => {
    const next = [...days, newDay(days.length + 1)];
    updateDays(next);
    setSelectedDayId(next[next.length - 1].id);
  };

  const updateDay = (id: string, patch: Partial<EventDay>) =>
    updateDays(days.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const removeDay = (id: string) => {
    const next = days.filter((d) => d.id !== id);
    updateDays(next.length ? next : [newDay(1)]);
    if (selectedDayId === id && next[0]) setSelectedDayId(next[0].id);
  };

  const updateActivity = (
    dayId: string,
    actId: string,
    patch: Partial<EventActivity>,
  ) => {
    updateDays(
      days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              activities: d.activities.map((a) =>
                a.id === actId ? { ...a, ...patch } : a,
              ),
            }
          : d,
      ),
    );
  };

  const addActivity = (dayId: string) => {
    updateDays(
      days.map((d) =>
        d.id === dayId ? { ...d, activities: [...d.activities, newActivity()] } : d,
      ),
    );
  };

  const removeActivity = (dayId: string, actId: string) => {
    updateDays(
      days.map((d) =>
        d.id === dayId
          ? { ...d, activities: d.activities.filter((a) => a.id !== actId) }
          : d,
      ),
    );
  };

  const pickerActivity = useMemo(() => {
    if (!pickerActivityId) return null;
    return selectedDay.activities.find((a) => a.id === pickerActivityId) ?? null;
  }, [pickerActivityId, selectedDay]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary">Agenda del evento</h2>
        <p className="mt-1 text-sm text-foreground">
          Itinerario de actividades.{' '}
          <span className="text-muted-foreground">(Opcional)</span>
        </p>
      </div>

      {/* Days picker */}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-sm font-bold text-foreground">Días del evento</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {days.map((d) => {
            const active = d.id === selectedDayId;
            const editing = editingDayId === d.id;
            return (
              <div key={d.id} className="flex items-center gap-1">
                {editing ? (
                  <input
                    autoFocus
                    value={d.name}
                    onChange={(e) => updateDay(d.id, { name: e.target.value })}
                    onBlur={() => setEditingDayId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingDayId(null)}
                    className="w-24 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedDayId(d.id)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {d.name}
                    {active && (
                      <Pencil
                        className="h-3.5 w-3.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDayId(d.id);
                        }}
                      />
                    )}
                  </button>
                )}
                {days.length > 1 && active && (
                  <button
                    type="button"
                    onClick={() => removeDay(d.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Eliminar día"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addDay}
            className="ml-auto flex items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground"
          >
            <Plus className="h-4 w-4" /> Agregar día
          </button>
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-foreground">
            Fecha del día seleccionado
          </label>
          <div className="mt-1 flex items-center gap-2 border-b border-border py-2">
            <input
              type="date"
              value={selectedDay.date}
              onChange={(e) => updateDay(selectedDay.id, { date: e.target.value })}
              className="flex-1 bg-transparent text-sm text-foreground outline-none"
            />
            <Calendar className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Itinerario de actividades</h3>
        <span className="text-sm font-semibold text-muted-foreground">
          {selectedDay.name}
        </span>
      </div>

      {selectedDay.activities.length === 0 && (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Sin actividades en este día</p>
          <p className="mt-1 text-xs text-muted-foreground">Agrega la primera actividad al itinerario</p>
        </div>
      )}

      <div className="relative space-y-4 pl-4 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-0.5 before:bg-primary/20">
        {selectedDay.activities.map((act, idx) => {
          const timeInvalid = !isTimeRangeValid(act.startTime, act.endTime);
          return (
          <div key={act.id} className="relative rounded-2xl bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="absolute -left-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-4 ring-secondary">
                {idx + 1}
              </span>
              {selectedDay.activities.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeActivity(selectedDay.id, act.id)}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <label className="text-xs font-semibold text-foreground">Hora de inicio</label>
            <div className="mt-1 mb-3 flex items-center gap-2 border-b border-border py-2">
              <input
                type="time"
                value={act.startTime}
                onChange={(e) =>
                  updateActivity(selectedDay.id, act.id, { startTime: e.target.value })
                }
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
              <Clock className="h-4 w-4 text-primary" />
            </div>

            <label className="text-xs font-semibold text-foreground">Hora de finalización</label>
            <div className="mt-1 mb-1 flex items-center gap-2 border-b border-border py-2">
              <input
                type="time"
                value={act.endTime}
                onChange={(e) =>
                  updateActivity(selectedDay.id, act.id, { endTime: e.target.value })
                }
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
              <Clock className="h-4 w-4 text-primary" />
            </div>
            {timeInvalid && (
              <p className="mb-3 text-xs font-medium text-destructive">
                La hora de fin debe ser posterior o igual a la de inicio
              </p>
            )}

            <label className="text-xs font-semibold text-foreground">
              Descripción de la actividad
            </label>
            <input
              value={act.description}
              onChange={(e) =>
                updateActivity(selectedDay.id, act.id, { description: e.target.value })
              }
              placeholder="Ingresa una breve descripción de la actividad"
              className="mt-1 mb-4 w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />

            <div className="flex items-center gap-2 text-sm text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>Responsable de la actividad (opcional)</span>
            </div>

            {act.responsible ? (
              <ResponsibleCard
                host={act.responsible}
                onChange={() => setPickerActivityId(act.id)}
                onRemove={() =>
                  updateActivity(selectedDay.id, act.id, { responsible: undefined })
                }
              />
            ) : (
              <button
                type="button"
                onClick={() => setPickerActivityId(act.id)}
                className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary"
              >
                <Plus className="h-4 w-4" /> Agregar responsable
              </button>
            )}
          </div>
        );
        })}

        <Button
          variant="outline"
          onClick={() => addActivity(selectedDay.id)}
          className="w-full rounded-full border-primary py-6 text-base font-bold text-primary"
        >
          + Agregar actividad
        </Button>
      </div>

      {pickerActivity && (
        <UserSearchPickerModal
          title="Seleccionar responsable"
          multiSelect={false}
          onSelectSingle={(user: UserSearchResult) => {
            updateActivity(selectedDay.id, pickerActivity.id, {
              responsible: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatarUrl,
                initials: user.initials,
                source: 'platform',
              },
            });
            setPickerActivityId(null);
          }}
          onConfirm={() => undefined}
          onClose={() => setPickerActivityId(null)}
        />
      )}
    </div>
  );
};

const ResponsibleCard = ({
  host,
  onChange,
  onRemove,
}: {
  host: EventHost;
  onChange: () => void;
  onRemove: () => void;
}) => (
  <div className="mt-2 flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
    {host.avatar ? (
      <img src={host.avatar} alt={host.name} className="h-10 w-10 rounded-full object-cover" />
    ) : (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
        {host.initials || host.name.charAt(0)}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold text-foreground">{host.name}</p>
      <p className="truncate text-xs text-muted-foreground">{host.email}</p>
    </div>
    <button onClick={onChange} className="text-sm font-semibold text-primary">
      Cambiar
    </button>
    <button onClick={onRemove} className="text-muted-foreground">
      <X className="h-4 w-4" />
    </button>
  </div>
);

export default StepAgenda;
