import { useEffect, useMemo, useState } from 'react';
import { Calendar, CalendarDays, Clock, Pencil, Plus, User, X } from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import {
  EventActivity,
  EventDay,
  EventFormData,
  EventHost,
} from '@lovable/data/eventFormData';
import UserSearchPickerModal, { type UserSearchResult } from '../../../components/UserSearchPickerModal';
import { UserAvatar } from '@doevents/shared';

interface Props {
  formData: EventFormData;
  updateForm: (partial: Partial<EventFormData>) => void;
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const addCalendarDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const enumerateDatesInclusive = (startDate: string, endDate: string): string[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return [];
  const end = /^\d{4}-\d{2}-\d{2}$/.test(endDate) && endDate >= startDate
    ? endDate
    : startDate;
  const dates: string[] = [];
  let cursor = startDate;
  let guard = 0;
  while (cursor <= end && guard < 31) {
    dates.push(cursor);
    cursor = addCalendarDays(cursor, 1);
    guard += 1;
  }
  return dates.length ? dates : [startDate];
};

const formatDisplayDate = (isoDate: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const newActivity = (startTime?: string, endTime?: string): EventActivity => ({
  id: newId('act'),
  startTime: startTime?.trim() || '17:00',
  endTime: endTime?.trim() || startTime?.trim() || '17:00',
  description: '',
});

const buildDaysFromEventDates = (
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
): EventDay[] => {
  const dates = startDate.trim()
    ? enumerateDatesInclusive(startDate.trim(), (endDate || startDate).trim())
    : [''];

  return dates.map((date, idx) => ({
    id: newId('day'),
    name: `Día ${idx + 1}`,
    date,
    activities: [newActivity(startTime, endTime)],
  }));
};

const isTimeRangeValid = (start: string, end: string): boolean => {
  if (!start || !end) return true;
  return start <= end;
};

const StepAgenda = ({ formData, updateForm }: Props) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [pickerActivityId, setPickerActivityId] = useState<string | null>(null);

  // Prediligenciar agenda con las fechas/horas del paso de creación del evento.
  useEffect(() => {
    const startDate = formData.startDate?.trim() || '';
    const endDate = formData.endDate?.trim() || startDate;
    const startTime = formData.startTime?.trim() || '';
    const endTime = formData.endTime?.trim() || '';
    const agenda = formData.agenda ?? [];

    if (!agenda.length) {
      const seeded = buildDaysFromEventDates(startDate, endDate, startTime, endTime);
      updateForm({ agenda: seeded });
      setSelectedDayId(seeded[0]?.id || '');
      return;
    }

    // Si hay un solo día sin fecha y el evento ya tiene fecha, rellenarla.
    if (
      agenda.length === 1
      && !agenda[0].date?.trim()
      && startDate
    ) {
      const next = [{
        ...agenda[0],
        date: startDate,
        activities: agenda[0].activities?.length
          ? agenda[0].activities
          : [newActivity(startTime, endTime)],
      }];
      updateForm({ agenda: next });
      if (!selectedDayId) setSelectedDayId(next[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.startDate, formData.endDate, formData.startTime, formData.endTime, formData.agenda?.length]);

  const days: EventDay[] = formData.agenda?.length
    ? formData.agenda
    : buildDaysFromEventDates(
      formData.startDate || '',
      formData.endDate || '',
      formData.startTime || '',
      formData.endTime || '',
    );

  useEffect(() => {
    if (!selectedDayId && days[0]?.id) {
      setSelectedDayId(days[0].id);
    } else if (selectedDayId && !days.some((d) => d.id === selectedDayId) && days[0]) {
      setSelectedDayId(days[0].id);
    }
  }, [days, selectedDayId]);

  const selectedDay = days.find((d) => d.id === selectedDayId) ?? days[0];

  const eventDateHint = useMemo(() => {
    const start = formData.startDate?.trim();
    if (!start) return null;
    const end = formData.endDate?.trim();
    if (end && end !== start) {
      return `${formatDisplayDate(start)} → ${formatDisplayDate(end)}`;
    }
    return formatDisplayDate(start);
  }, [formData.startDate, formData.endDate]);

  const updateDays = (next: EventDay[]) => updateForm({ agenda: next });

  const addDay = () => {
    const lastDate = days[days.length - 1]?.date;
    const nextDate = lastDate && /^\d{4}-\d{2}-\d{2}$/.test(lastDate)
      ? addCalendarDays(lastDate, 1)
      : (formData.startDate || '');
    const nextDay: EventDay = {
      id: newId('day'),
      name: `Día ${days.length + 1}`,
      date: nextDate,
      activities: [newActivity(formData.startTime, formData.endTime)],
    };
    const next = [...days, nextDay];
    updateDays(next);
    setSelectedDayId(nextDay.id);
  };

  const updateDay = (id: string, patch: Partial<EventDay>) =>
    updateDays(days.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const removeDay = (id: string) => {
    const next = days.filter((d) => d.id !== id);
    const fallback = next.length
      ? next
      : buildDaysFromEventDates(
        formData.startDate || '',
        formData.endDate || formData.startDate || '',
        formData.startTime || '',
        formData.endTime || '',
      );
    updateDays(fallback);
    if (selectedDayId === id && fallback[0]) setSelectedDayId(fallback[0].id);
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
        d.id === dayId
          ? {
              ...d,
              activities: [...d.activities, newActivity(formData.startTime, formData.endTime)],
            }
          : d,
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
    if (!pickerActivityId || !selectedDay) return null;
    return selectedDay.activities.find((a) => a.id === pickerActivityId) ?? null;
  }, [pickerActivityId, selectedDay]);

  if (!selectedDay) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <CalendarDays className="h-5 w-5" />
          </span>
          Agenda del evento
        </h2>
        <p className="mt-1 text-sm text-foreground">
          Itinerario de actividades.{' '}
          <span className="text-muted-foreground">(Opcional)</span>
        </p>
        {eventDateHint && (
          <p className="mt-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
            Fecha parametrizada del evento: {eventDateHint}
            {formData.startTime ? ` · ${formData.startTime}` : ''}
            {formData.endTime ? ` – ${formData.endTime}` : ''}
          </p>
        )}
      </div>

      {/* Days picker */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
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
            className="ml-auto flex items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm font-semibold text-foreground"
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
          {selectedDay.date && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDisplayDate(selectedDay.date)}
            </p>
          )}
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
        <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-4 py-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
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
          <div key={act.id} className="relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
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
    <UserAvatar name={host.name} imageUrl={host.avatar} userId={host.id} size={40} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold text-foreground">{host.name}</p>
      <p className="truncate text-xs text-muted-foreground">{host.email}</p>
    </div>
    <button type="button" onClick={onChange} className="text-sm font-semibold text-primary">
      Cambiar
    </button>
    <button type="button" onClick={onRemove} className="text-muted-foreground">
      <X className="h-4 w-4" />
    </button>
  </div>
);

export default StepAgenda;
