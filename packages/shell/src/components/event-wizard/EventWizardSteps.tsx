import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  CATEGORY_COLORS,
  TextField,
  WIZARD_STEPS,
  buildSeatGrid,
  getVenueById,
  listUserVenues,
  newWizardId,
  venueDetailToWizardState,
  type EventWizardState,
  type GeocodedPlace,
  type SavedVenueSummary,
  type WizardCategory,
  type WizardFloor,
  type WizardGate,
} from '@doevents/shared';
import { FloorPlanEditor } from './FloorPlanEditor';
import { CategoryFormModal } from './FloorPlanModals';
import { FloorPlanPreview } from './FloorPlanShapeView';
import { EventLocationField } from './EventLocationField';

type PlanoView = 'canvas' | 'categories' | 'gates' | 'tickets';

interface StepProps {
  state: EventWizardState;
  eventTypes: Array<{ id: string; nombre?: string }>;
  userId?: string;
  onChange: (patch: Partial<EventWizardState>) => void;
  onUpdateEventForm: (key: keyof EventWizardState['eventForm'], value: string) => void;
  onUpdateVenueForm: (key: keyof EventWizardState['venueForm'], value: string) => void;
}

export const WizardStepper: React.FC<{ step: number }> = ({ step }) => (
  <nav className="de-wizard-v2-stepper" aria-label="Pasos del wizard">
    {WIZARD_STEPS.map((item, idx) => (
      <div
        key={item.id}
        className={[
          'de-wizard-v2-stepper__item',
          item.id === step ? 'de-wizard-v2-stepper__item--active' : '',
          item.id < step ? 'de-wizard-v2-stepper__item--done' : '',
        ].filter(Boolean).join(' ')}
      >
        <span className="de-wizard-v2-stepper__num">{idx + 1}</span>
        <span className="de-wizard-v2-stepper__label">{item.label}</span>
      </div>
    ))}
  </nav>
);

function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`de-wizard-accordion${open ? ' de-wizard-accordion--open' : ''}`}>
      <button type="button" className="de-wizard-accordion__head" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className="de-wizard-accordion__chev">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="de-wizard-accordion__body">{children}</div>}
    </div>
  );
}

export const DetailsStep: React.FC<StepProps> = ({
  state,
  eventTypes,
  userId,
  onChange,
  onUpdateEventForm,
  onUpdateVenueForm,
}) => {
  const form = state.eventForm;
  const [savedVenues, setSavedVenues] = useState<SavedVenueSummary[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoadingVenues(true);
    listUserVenues(userId, { isTemplate: true })
      .then(setSavedVenues)
      .catch(() => setSavedVenues([]))
      .finally(() => setLoadingVenues(false));
  }, [userId]);

  const handleReuseVenue = async (venueId: string) => {
    try {
      const detail = await getVenueById(venueId);
      const mapped = venueDetailToWizardState({ ...detail } as Parameters<typeof venueDetailToWizardState>[0]);
      onChange({
        templateVenueId: venueId,
        hasSeating: mapped.hasSeating,
        floors: mapped.floors,
        gates: mapped.gates,
        venueForm: { ...state.venueForm, ...mapped.venueForm },
      });
    } catch {
      onChange({ templateVenueId: venueId });
    }
  };

  const addMedia = (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...state.mediaItems];
    Array.from(files).forEach((file) => {
      next.push({
        id: newWizardId(),
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
      });
    });
    onChange({ mediaItems: next });
  };

  const removeMedia = (id: string) => {
    onChange({ mediaItems: state.mediaItems.filter((m) => m.id !== id) });
  };

  return (
    <div className="de-wizard-v2-details">
      <div className="de-wizard-v2-details__head">
        <h2>Cuéntanos sobre tu evento</h2>
        <p>Información básica, lugar y organizador en un solo paso.</p>
      </div>

      <div className="de-card de-card--lovable de-wizard-v2-card de-form-stack">
        <TextField label="Nombre del evento" value={form.nombre} onChange={(e) => onUpdateEventForm('nombre', e.target.value)} variant="bordered" placeholder="Ej. Concierto de verano" />
        <TextField label="Descripción" value={form.descripcion} onChange={(e) => onUpdateEventForm('descripcion', e.target.value)} variant="bordered" />
        <div className="de-wizard-grid-2">
          <TextField label="Fecha inicio" type="date" value={form.fechaIni} onChange={(e) => onUpdateEventForm('fechaIni', e.target.value)} variant="bordered" />
          <TextField label="Fecha fin" type="date" value={form.fechaFin} onChange={(e) => onUpdateEventForm('fechaFin', e.target.value)} variant="bordered" />
        </div>
        <div className="de-wizard-grid-2">
          <TextField label="Hora inicio" type="time" value={form.horaIni} onChange={(e) => onUpdateEventForm('horaIni', e.target.value)} variant="bordered" />
          <TextField label="Hora fin" type="time" value={form.horaFin} onChange={(e) => onUpdateEventForm('horaFin', e.target.value)} variant="bordered" />
        </div>
        <TextField label="Aforo estimado" value={form.aforo} onChange={(e) => onUpdateEventForm('aforo', e.target.value)} variant="bordered" />
        {eventTypes.length > 0 && (
          <label className="de-field">
            <span className="de-field__label">Tipo de evento</span>
            <select className="de-field__input" value={form.tipoEvento} onChange={(e) => onUpdateEventForm('tipoEvento', e.target.value)}>
              {eventTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.nombre || type.id}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <AccordionSection title="Lugar del evento" defaultOpen>
        <div className="de-form-stack">
          {savedVenues.length > 0 && (
            <label className="de-field">
              <span className="de-field__label">Reutilizar lugar guardado</span>
              <select
                className="de-field__input"
                value={state.templateVenueId || ''}
                onChange={(e) => e.target.value && handleReuseVenue(e.target.value)}
              >
                <option value="">{loadingVenues ? 'Cargando...' : 'Crear lugar nuevo'}</option>
                {savedVenues.map((v) => (
                  <option key={v.venueId} value={v.venueId}>{v.name}{v.city ? ` · ${v.city}` : ''}</option>
                ))}
              </select>
            </label>
          )}
          <TextField label="Nombre del lugar" value={state.venueForm.name} onChange={(e) => onUpdateVenueForm('name', e.target.value)} variant="bordered" placeholder="Ej: Néctar Arena" />
          <TextField label="Capacidad del lugar" value={state.venueForm.capacity} onChange={(e) => onUpdateVenueForm('capacity', e.target.value)} variant="bordered" />
          <TextField label="Descripción del lugar" value={state.venueForm.description} onChange={(e) => onUpdateVenueForm('description', e.target.value)} variant="bordered" />
          <TextField label="Teléfono de contacto del lugar" value={state.venueForm.phone} onChange={(e) => onUpdateVenueForm('phone', e.target.value)} variant="bordered" />
          <EventLocationField
            ubicacion={form.ubicacion}
            direccion={state.venueForm.address || form.direccion}
            latitude={state.venueForm.latitude || form.latitude}
            longitude={state.venueForm.longitude || form.longitude}
            ciudad={state.venueForm.city || form.ciudad}
            departamento={form.departamento}
            onUbicacionChange={(value) => {
              onUpdateEventForm('ubicacion', value);
              onUpdateVenueForm('city', value);
            }}
            onDireccionChange={(value) => {
              onUpdateEventForm('direccion', value);
              onUpdateVenueForm('address', value);
            }}
            onPlaceResolved={(place: GeocodedPlace) => {
              onUpdateEventForm('ubicacion', place.label);
              onUpdateEventForm('ciudad', place.city || form.ciudad);
              onUpdateEventForm('departamento', place.departamento || form.departamento);
              onUpdateEventForm('latitude', String(place.lat));
              onUpdateEventForm('longitude', String(place.lng));
              onUpdateVenueForm('city', place.city || '');
              onUpdateVenueForm('latitude', String(place.lat));
              onUpdateVenueForm('longitude', String(place.lng));
              onUpdateVenueForm('address', place.label);
            }}
          />
          <label className="de-wizard-check">
            <input type="checkbox" checked={state.saveVenueAsTemplate} onChange={(e) => onChange({ saveVenueAsTemplate: e.target.checked })} />
            <span>Guardar este lugar para reutilizarlo en futuros eventos</span>
          </label>
          <div className="de-wizard-toggle-row">
            <button type="button" className={`de-wizard-toggle${state.hasSeating ? ' de-wizard-toggle--active' : ''}`} onClick={() => onChange({ hasSeating: true })}>
              <strong>Silletería numerada</strong>
              <span>Diseña el mapa con filas y asientos</span>
            </button>
            <button type="button" className={`de-wizard-toggle${!state.hasSeating ? ' de-wizard-toggle--active' : ''}`} onClick={() => onChange({ hasSeating: false })}>
              <strong>Admisión general</strong>
              <span>Solo categorías de boleta sin mapa</span>
            </button>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Organizador">
        <div className="de-form-stack">
          <TextField label="Nombre del organizador" value={form.organizerName} onChange={(e) => onUpdateEventForm('organizerName', e.target.value)} variant="bordered" />
          <TextField label="Teléfono" value={form.TelPrin} onChange={(e) => onUpdateEventForm('TelPrin', e.target.value)} variant="bordered" />
          <TextField label="Email" type="email" value={form.email} onChange={(e) => onUpdateEventForm('email', e.target.value)} variant="bordered" />
        </div>
      </AccordionSection>

      <AccordionSection title="Multimedia (opcional)">
        <div className="de-wizard-media">
          <p className="de-wizard-intro">Agrega fotos o banner del evento. No es obligatorio para publicar.</p>
          <label className="de-wizard-media__upload">
            <input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => addMedia(e.target.files)} />
            <span>+ Agregar imagen o video</span>
          </label>
          {state.mediaItems.length > 0 && (
            <div className="de-wizard-media__grid">
              {state.mediaItems.map((item) => (
                <div key={item.id} className="de-wizard-media__item">
                  {item.file?.type?.startsWith('video/') ? (
                    <video src={item.previewUrl} controls className="de-wizard-media__video" />
                  ) : (
                    <img src={item.previewUrl} alt={item.name} />
                  )}
                  <button type="button" onClick={() => removeMedia(item.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </AccordionSection>
    </div>
  );
};

function defaultCategory(index: number, gateId: string): WizardCategory {
  const rows = 5;
  const seatsPerRow = 8;
  return {
    categoryId: newWizardId(),
    name: index === 0 ? 'General' : `Categoría ${index + 1}`,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    relX: 10 + (index % 2) * 45,
    relY: 25 + Math.floor(index / 2) * 30,
    width: 40,
    height: 22,
    geometry: 'RECTANGLE',
    rotation: 0,
    zIndex: index + 1,
    ringThickness: 55,
    locked: false,
    gateId,
    rows,
    seatsPerRow,
    seats: buildSeatGrid(rows, seatsPerRow),
    price: index === 0 ? 80000 : 50000,
    isPaid: true,
    currency: 'COP',
    description: '',
    colOrder: 'asc',
    rowOrder: 'asc',
    disableSeatsEnabled: false,
  };
}

export const PlanoStep: React.FC<StepProps> = ({ state, onChange }) => {
  const [activeFloorId, setActiveFloorId] = useState(state.floors[0]?.floorId || '');
  const [view, setView] = useState<PlanoView>('canvas');
  const [editingCategory, setEditingCategory] = useState<WizardCategory | null>(null);
  const floor = state.floors.find((f) => f.floorId === activeFloorId) || state.floors[0];
  const eventCapacity = Number(state.eventForm.aforo) || Number(state.venueForm.capacity) || 100;
  const categories = state.floors.flatMap((f) => f.categories);
  const totalSeats = state.hasSeating
    ? categories.reduce((s, c) => s + c.seats.length, 0)
    : categories.reduce((s, c) => s + c.seatsPerRow, 0);
  const totalRevenue = categories.reduce((s, c) => {
    const qty = state.hasSeating ? c.seats.length : c.seatsPerRow;
    return s + (c.isPaid ? c.price * qty : 0);
  }, 0);

  const updateFloor = (nextFloor: WizardFloor) => {
    onChange({ floors: state.floors.map((f) => (f.floorId === nextFloor.floorId ? nextFloor : f)) });
  };

  const updateGate = (gateId: string, patch: Partial<WizardGate>) => {
    onChange({ gates: state.gates.map((g) => (g.gateId === gateId ? { ...g, ...patch } : g)) });
  };

  const updateCategoryPrice = (categoryId: string, patch: Partial<WizardCategory>) => {
    onChange({
      floors: state.floors.map((f) => ({
        ...f,
        categories: f.categories.map((c) => (c.categoryId === categoryId ? { ...c, ...patch } : c)),
      })),
    });
  };

  const updateCategory = (categoryId: string, patch: Partial<WizardCategory>) => {
    onChange({
      floors: state.floors.map((f) => ({
        ...f,
        categories: f.categories.map((c) => (c.categoryId === categoryId ? { ...c, ...patch } : c)),
      })),
    });
    if (editingCategory?.categoryId === categoryId) {
      setEditingCategory((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  };

  const deleteCategory = (categoryId: string) => {
    onChange({
      floors: state.floors.map((f) => ({
        ...f,
        categories: f.categories.filter((c) => c.categoryId !== categoryId),
      })),
    });
    setEditingCategory(null);
  };

  const usedSeatsAll = categories.reduce(
    (acc, c) => acc + (c.seats.length || c.rows * c.seatsPerRow),
    0,
  );

  const editingCatOnFloor = editingCategory
    ? floor.categories.find((c) => c.categoryId === editingCategory.categoryId)
    : null;

  const usedSeatsForModal = editingCategory && editingCatOnFloor
    ? usedSeatsAll
      - (editingCategory.seats.length || editingCategory.rows * editingCategory.seatsPerRow)
      + (editingCatOnFloor.seats.length || editingCatOnFloor.rows * editingCatOnFloor.seatsPerRow)
    : usedSeatsAll;

  const planoNav: Array<{ id: PlanoView; label: string; icon: string; badge?: number }> = [
    { id: 'canvas', label: 'Plano', icon: '▦' },
    { id: 'categories', label: 'Categorías', icon: '◎', badge: categories.length },
    { id: 'gates', label: 'Puertas', icon: '⛩', badge: state.gates.length },
    { id: 'tickets', label: 'Boletas', icon: '₿' },
  ];

  useEffect(() => {
    if (!state.hasSeating && categories.length === 0) {
      const gateId = state.gates[0]?.gateId || newWizardId();
      const cat = defaultCategory(0, gateId);
      cat.seats = [];
      cat.rows = 0;
      cat.seatsPerRow = Number(state.eventForm.aforo) || 100;
      onChange({ floors: state.floors.map((f, i) => (i === 0 ? { ...f, categories: [cat] } : f)) });
    }
  }, [state.hasSeating]);

  if (!floor) return null;

  return (
    <div className={`de-wizard-v2-plano de-wizard-v2-plano--view-${view}`}>
      <div className="de-wizard-v2-plano__summary">
        <span>{totalSeats} asientos</span>
        <span className="de-wizard-v2-plano__summary-dot">·</span>
        <span>${totalRevenue.toLocaleString('es-CO')} estimado</span>
      </div>

      <nav className="de-wizard-v2-plano__nav" aria-label="Secciones del plano">
        {planoNav.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`de-wizard-v2-plano__nav-btn${view === item.id ? ' de-wizard-v2-plano__nav-btn--active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="de-wizard-v2-plano__nav-icon" aria-hidden>{item.icon}</span>
            <span className="de-wizard-v2-plano__nav-label">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="de-wizard-v2-plano__nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {state.floors.length > 1 && view === 'canvas' && (
        <div className="de-wizard-tabs">
          {state.floors.map((f) => (
            <button key={f.floorId} type="button" className={`de-wizard-tabs__btn${f.floorId === activeFloorId ? ' de-wizard-tabs__btn--active' : ''}`} onClick={() => setActiveFloorId(f.floorId)}>
              {f.name}
            </button>
          ))}
        </div>
      )}

      {view === 'canvas' && (
        <div className="de-wizard-v2-plano__canvas">
          {state.hasSeating ? (
            <>
              <p className="de-wizard-v2-plano__hint">
                Dibuja figuras en la cuadrícula, elige zona o elemento, y genera la silletería en Categorías.
              </p>
              <FloorPlanEditor
                compact
                floor={{ ...floor, elements: floor.elements || [] }}
                floors={state.floors}
                gates={state.gates}
                eventCapacity={eventCapacity}
                onFloorChange={updateFloor}
              />
            </>
          ) : (
            <div className="de-wizard-v2-plano__panel">
              <h3>Admisión general</h3>
              <p className="de-wizard-intro">No hay mapa de sillas. Configura precios y cupos en la pestaña Boletas.</p>
              <button type="button" className="de-wizard-v2-plano__panel-cta" onClick={() => setView('tickets')}>
                Ir a Boletas →
              </button>
            </div>
          )}
        </div>
      )}

      {view === 'categories' && (
        <div className="de-wizard-v2-plano__panel">
          <div className="de-wizard-v2-plano__panel-head">
            <h3>Zonas y silletería</h3>
            <p>Lista de categorías del plano. Toca una para editar filas, asientos y puerta de acceso.</p>
          </div>
          {categories.length === 0 ? (
            <div className="de-wizard-v2-plano__empty">
              <p>Aún no hay categorías.</p>
              <button type="button" className="de-wizard-v2-plano__panel-cta" onClick={() => setView('canvas')}>
                Dibujar en el plano →
              </button>
            </div>
          ) : (
            categories.map((cat, idx) => {
              const seatCount = state.hasSeating ? cat.seats.length : cat.seatsPerRow;
              const gateName = state.gates.find((g) => g.gateId === cat.gateId)?.name || 'Sin puerta';
              return (
                <button
                  key={cat.categoryId}
                  type="button"
                  className="de-wizard-v2-cat-card"
                  onClick={() => setEditingCategory(cat)}
                >
                  <span className="de-wizard-v2-cat-card__dot" style={{ background: cat.color }} />
                  <span className="de-wizard-v2-cat-card__body">
                    <strong>{cat.name.trim() || `Zona ${idx + 1}`}</strong>
                    <small>
                      {seatCount} asientos · {cat.rows}×{cat.seatsPerRow} · {gateName}
                    </small>
                  </span>
                  <span className="de-wizard-v2-cat-card__edit">Editar</span>
                </button>
              );
            })
          )}
          <button type="button" className="de-wizard-v2-plano__panel-cta de-wizard-v2-plano__panel-cta--secondary" onClick={() => setView('canvas')}>
            + Añadir zona en el plano
          </button>
        </div>
      )}

      {view === 'gates' && (
        <div className="de-wizard-v2-plano__panel">
          <div className="de-wizard-v2-plano__panel-head">
            <h3>Puertas de acceso</h3>
            <p>Asigna cada categoría a una puerta para controlar el ingreso al evento.</p>
          </div>
          {state.gates.map((gate) => (
            <div key={gate.gateId} className="de-wizard-v2-gate-card">
              <TextField
                label={`Puerta #${gate.gateNumber}`}
                value={gate.name}
                onChange={(e) => updateGate(gate.gateId, { name: e.target.value })}
                variant="bordered"
              />
            </div>
          ))}
          <Button
            label="+ Puerta"
            variant="secondary"
            tone="lovable"
            onClick={() => onChange({
              gates: [...state.gates, {
                gateId: newWizardId(),
                gateNumber: state.gates.length + 1,
                name: `Puerta ${state.gates.length + 1}`,
                description: '',
              }],
            })}
          />
        </div>
      )}

      {view === 'tickets' && (
        <div className="de-wizard-v2-plano__panel">
          <div className="de-wizard-v2-plano__panel-head">
            <h3>Precios por categoría</h3>
            <p>Define si cada zona es de pago y su valor en COP.</p>
          </div>
          {categories.length === 0 ? (
            <div className="de-wizard-v2-plano__empty">
              <p>Crea categorías primero en el plano.</p>
              <button type="button" className="de-wizard-v2-plano__panel-cta" onClick={() => setView('canvas')}>
                Ir al plano →
              </button>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.categoryId} className="de-wizard-v2-ticket-card">
                <div className="de-wizard-v2-ticket-card__head">
                  <span className="de-wizard-ticket-dot" style={{ background: cat.color }} />
                  <strong>{cat.name.trim() || 'Sin nombre'}</strong>
                  <span className="de-wizard-v2-ticket-card__qty">
                    {state.hasSeating ? cat.seats.length : cat.seatsPerRow} asientos
                  </span>
                </div>
                <label className="de-wizard-check">
                  <input
                    type="checkbox"
                    checked={cat.isPaid}
                    onChange={(e) => updateCategoryPrice(cat.categoryId, { isPaid: e.target.checked })}
                  />
                  <span>Boleta de pago</span>
                </label>
                {cat.isPaid && (
                  <TextField
                    label="Precio COP"
                    type="number"
                    value={String(cat.price)}
                    onChange={(e) => updateCategoryPrice(cat.categoryId, { price: Number(e.target.value) || 0 })}
                    variant="bordered"
                  />
                )}
                <p className="de-wizard-v2-ticket-card__subtotal">
                  Subtotal: ${((state.hasSeating ? cat.seats.length : cat.seatsPerRow) * (cat.isPaid ? cat.price : 0)).toLocaleString('es-CO')}
                </p>
              </div>
            ))
          )}
          <div className="de-wizard-v2-revenue-total de-wizard-v2-revenue-total--inline">
            <span>Recaudación estimada</span>
            <strong>${totalRevenue.toLocaleString('es-CO')}</strong>
          </div>
        </div>
      )}

      {editingCategory && (
        <CategoryFormModal
          open
          category={floor.categories.find((c) => c.categoryId === editingCategory.categoryId) || editingCategory}
          gates={state.gates}
          floorName={floor.name}
          eventCapacity={eventCapacity}
          usedSeats={usedSeatsForModal}
          onChange={(patch) => updateCategory(editingCategory.categoryId, patch)}
          onSave={() => {
            const cat = floor.categories.find((c) => c.categoryId === editingCategory.categoryId);
            if (cat) {
              const idx = floor.categories.findIndex((c) => c.categoryId === cat.categoryId);
              const name = cat.name.trim() || `Zona ${idx + 1}`;
              const expected = cat.rows * cat.seatsPerRow;
              const seats = cat.seats.length === expected
                ? cat.seats
                : buildSeatGrid(cat.rows, cat.seatsPerRow);
              updateCategory(cat.categoryId, { name, seats });
            }
            setEditingCategory(null);
          }}
          onClose={() => setEditingCategory(null)}
          onDelete={() => deleteCategory(editingCategory.categoryId)}
        />
      )}
    </div>
  );
};

export const PublishReviewStep: React.FC<StepProps & { totalSeats: number }> = ({ state, totalSeats }) => {
  const categories = state.floors.flatMap((f) => f.categories);
  const revenueByCategory = useMemo(() => categories.map((cat) => {
    const qty = state.hasSeating ? cat.seats.length : cat.seatsPerRow;
    const subtotal = cat.isPaid ? cat.price * qty : 0;
    return { cat, qty, subtotal };
  }), [categories, state.hasSeating]);
  const totalRevenue = revenueByCategory.reduce((s, r) => s + r.subtotal, 0);

  return (
    <div className="de-wizard-v2-publish">
      <div className="de-wizard-v2-publish__head">
        <h2>Revisión final</h2>
        <p>Verifica los detalles antes de publicar.</p>
      </div>
      <div className="de-wizard-v2-publish__grid">
        <div className="de-wizard-v2-publish__map-card">
          {state.hasSeating && categories.length > 0 ? (
            <FloorPlanPreview floors={state.floors} />
          ) : (
            <div className="de-wizard-v2-publish__map-placeholder">Sin mapa de silletería</div>
          )}
          <div className="de-wizard-v2-publish__event-info">
            <h3>{state.eventForm.nombre || 'Sin nombre'}</h3>
            <p>{state.venueForm.name || 'Lugar'} · {state.eventForm.ciudad || state.venueForm.city || 'Ciudad'}</p>
            <div className="de-wizard-v2-publish__meta">
              <div><small>Fecha</small><strong>{state.eventForm.fechaIni || '—'} {state.eventForm.horaIni}</strong></div>
              <div><small>Aforo</small><strong>{totalSeats || state.eventForm.aforo}</strong></div>
            </div>
            <p className="de-wizard-v2-publish__contact">
              {state.eventForm.organizerName && <>Organizador: {state.eventForm.organizerName}<br /></>}
              {state.eventForm.TelPrin && <>Tel: {state.eventForm.TelPrin}<br /></>}
              {state.venueForm.phone && <>Lugar: {state.venueForm.phone}</>}
            </p>
          </div>
        </div>

        <aside className="de-wizard-v2-publish__sidebar">
          <h4>Boletería por categoría</h4>
          {revenueByCategory.map(({ cat, qty, subtotal }) => (
            <div key={cat.categoryId} className="de-wizard-v2-revenue-row">
              <span className="de-wizard-ticket-dot" style={{ background: cat.color }} />
              <div>
                <strong>{cat.name}</strong>
                <small>{qty} {state.hasSeating ? 'asientos' : 'cupos'} · ${cat.price.toLocaleString('es-CO')}</small>
              </div>
              <strong>${subtotal.toLocaleString('es-CO')}</strong>
            </div>
          ))}
          <div className="de-wizard-v2-revenue-total">
            <span>Recaudación estimada</span>
            <strong>${totalRevenue.toLocaleString('es-CO')}</strong>
          </div>
          <div className="de-wizard-v2-gates-list">
            <h4>Puertas configuradas</h4>
            {state.gates.map((g) => (
              <span key={g.gateId} className="de-wizard-v2-gate-chip">{g.name}</span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

// Legacy exports for compatibility
export const EventInfoStep = DetailsStep;
export const VenueLayoutStep = DetailsStep;
export const SeatingMapStep = PlanoStep;
export const TicketsAccessStep = PlanoStep;
export const ReviewStep = PublishReviewStep;
