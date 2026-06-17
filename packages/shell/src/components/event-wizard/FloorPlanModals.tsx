import React, { useEffect, useState } from 'react';
import {
  Button,
  CATEGORY_PASTEL_COLORS,
  TextField,
  buildSeatGrid,
  geometryLabel,
  type WizardCategory,
  type WizardElement,
  type WizardGate,
  type FloorPlanGeometry,
} from '@doevents/shared';

const PositiveIntField: React.FC<{
  label: string;
  value: number;
  onCommit: (value: number) => void;
}> = ({ label, value, onCommit }) => {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      setDraft(String(value));
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      onCommit(parsed);
      setDraft(String(parsed));
      return;
    }
    setDraft(String(value));
  };

  return (
    <TextField
      label={label}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      onChange={(e) => {
        const next = e.target.value.replace(/\D/g, '');
        setDraft(next);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      variant="bordered"
    />
  );
};

export const KindPickerModal: React.FC<{
  open: boolean;
  onPick: (kind: 'category' | 'element') => void;
  onClose: () => void;
}> = ({ open, onPick, onClose }) => {
  if (!open) return null;
  return (
    <div className="de-fp-modal-backdrop" onClick={onClose} role="presentation">
      <div className="de-fp-modal de-fp-modal--picker" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>¿Qué deseas crear con esta figura?</h3>
        <p className="de-fp-modal__hint">Elige según el uso para mantener tu mapa ordenado y fácil de editar.</p>
        <div className="de-fp-picker-cards">
          <button type="button" className="de-fp-picker-card de-fp-picker-card--primary" onClick={() => onPick('category')}>
            <span className="de-fp-picker-card__icon">▣</span>
            <strong>Categoría</strong>
            <span>Zonas para venta de tickets. Aquí defines precio, puertas y silletería.</span>
          </button>
          <button type="button" className="de-fp-picker-card" onClick={() => onPick('element')}>
            <span className="de-fp-picker-card__icon">▦</span>
            <strong>Elemento</strong>
            <span>Objetos visuales o referencias del lugar: baños, barras, escenario, accesos, etc.</span>
          </button>
        </div>
        <div className="de-fp-modal__actions">
          <Button label="Cancelar" variant="secondary" tone="lovable" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export const CategoryFormModal: React.FC<{
  open: boolean;
  category: WizardCategory;
  gates: WizardGate[];
  floorName: string;
  eventCapacity: number;
  usedSeats: number;
  onChange: (patch: Partial<WizardCategory>) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}> = ({ open, category, gates, floorName, eventCapacity, usedSeats, onChange, onSave, onClose, onDelete }) => {
  if (!open) return null;
  const seatCount = category.seats.length || category.rows * category.seatsPerRow;
  const totalUsed = usedSeats;
  const available = Math.max(0, eventCapacity - totalUsed);
  const pct = eventCapacity > 0 ? Math.round((totalUsed / eventCapacity) * 100) : 0;
  const withinCapacity = totalUsed <= eventCapacity;

  const regenerate = () => {
    onChange({ seats: buildSeatGrid(category.rows, category.seatsPerRow) });
  };

  return (
    <div className="de-fp-modal-backdrop" onClick={onClose} role="presentation">
      <div className="de-fp-modal de-fp-modal--form" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="de-fp-modal__head">
          <h3>{category.name ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button type="button" className="de-fp-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="de-fp-modal__body de-form-stack">
          <TextField label="Categoría" value={category.name} onChange={(e) => onChange({ name: e.target.value })} variant="bordered" placeholder="Ej: Palco" />

          <label className="de-field">
            <span className="de-field__label">Color de la categoría</span>
            <div className="de-fp-color-row">
              {CATEGORY_PASTEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`de-fp-color-swatch${category.color === color ? ' de-fp-color-swatch--active' : ''}`}
                  style={{ background: color }}
                  onClick={() => onChange({ color })}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </label>

          <label className="de-field de-wizard-check">
            <input type="checkbox" checked={category.isPaid} onChange={(e) => onChange({ isPaid: e.target.checked })} />
            <span>Precio</span>
          </label>

          {category.isPaid && (
            <div className="de-wizard-grid-2">
              <label className="de-field">
                <span className="de-field__label">Moneda</span>
                <select className="de-field__input" value={category.currency} onChange={(e) => onChange({ currency: e.target.value })}>
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                </select>
              </label>
              <TextField label="Precio de boletería" type="number" value={String(category.price)} onChange={(e) => onChange({ price: Number(e.target.value) || 0 })} variant="bordered" />
            </div>
          )}

          <label className="de-field">
            <span className="de-field__label">Piso</span>
            <input className="de-field__input" value={floorName} readOnly />
          </label>

          <label className="de-field">
            <span className="de-field__label">Puerta de acceso</span>
            <select className="de-field__input" value={category.gateId} onChange={(e) => onChange({ gateId: e.target.value })}>
              <option value="">Seleccionar puerta</option>
              {gates.map((g) => (
                <option key={g.gateId} value={g.gateId}>{g.name}</option>
              ))}
            </select>
          </label>

          <label className="de-field">
            <span className="de-field__label">Geometría</span>
            <input className="de-field__input" value={geometryLabel(category.geometry)} readOnly />
          </label>

          <TextField label="Descripción" value={category.description} onChange={(e) => onChange({ description: e.target.value })} variant="bordered" placeholder="Sillas preferenciales con servicio de bar" />

          <div className={`de-fp-capacity-card${withinCapacity ? ' de-fp-capacity-card--ok' : ' de-fp-capacity-card--warn'}`}>
            <strong>{withinCapacity ? '✓ Dentro del aforo del evento' : '⚠ Excede el aforo del evento'}</strong>
            <div className="de-fp-capacity-bar">
              <span style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <small>{totalUsed} de {eventCapacity} sillas · {pct}% · {available} disponibles</small>
          </div>

          <p className="de-fp-section-title">Mapa de silletería · {seatCount} asientos</p>
          <div className="de-wizard-grid-2">
            <PositiveIntField label="Número de filas" value={category.rows} onCommit={(rows) => onChange({ rows })} />
            <PositiveIntField label="Sillas por fila" value={category.seatsPerRow} onCommit={(seatsPerRow) => onChange({ seatsPerRow })} />
          </div>

          <label className="de-field de-wizard-check">
            <input type="checkbox" checked={category.disableSeatsEnabled} onChange={(e) => onChange({ disableSeatsEnabled: e.target.checked })} />
            <span>Inhabilitar sillas</span>
          </label>

          <div className="de-wizard-grid-2">
            <label className="de-field">
              <span className="de-field__label">Orden filas</span>
              <select className="de-field__input" value={category.rowOrder} onChange={(e) => onChange({ rowOrder: e.target.value as 'asc' | 'desc' })}>
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </label>
            <label className="de-field">
              <span className="de-field__label">Orden columnas</span>
              <select className="de-field__input" value={category.colOrder} onChange={(e) => onChange({ colOrder: e.target.value as 'asc' | 'desc' })}>
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </label>
          </div>

          <Button label="Generar mapa de asientos" variant="secondary" tone="lovable" onClick={regenerate} />

          <div className="de-seating-preview-grid">
            {category.seats.slice(0, 80).map((seat) => (
              <span key={seat.seatId} className="de-seating-preview-seat" style={{ borderColor: category.color }}>{seat.seatCode}</span>
            ))}
            {category.seats.length > 80 && <span className="de-seating-preview-more">+{category.seats.length - 80} más</span>}
          </div>
        </div>

        <div className="de-fp-modal__actions de-fp-modal__actions--split">
          {onDelete && (
            <Button label="Eliminar zona" variant="secondary" tone="lovable" onClick={onDelete} />
          )}
          <Button label="Cancelar" variant="secondary" tone="lovable" onClick={onClose} />
          <Button label="Guardar cambios" tone="lovable" onClick={onSave} />
        </div>
      </div>
    </div>
  );
};

export const ElementFormModal: React.FC<{
  open: boolean;
  element: WizardElement;
  onChange: (patch: Partial<WizardElement>) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}> = ({ open, element, onChange, onSave, onClose, onDelete }) => {
  if (!open) return null;
  return (
    <div className="de-fp-modal-backdrop" onClick={onClose} role="presentation">
      <div className="de-fp-modal de-fp-modal--form" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="de-fp-modal__head">
          <h3>Nuevo elemento</h3>
          <button type="button" className="de-fp-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="de-fp-modal__body de-form-stack">
          <TextField label="Nombre del elemento" value={element.name} onChange={(e) => onChange({ name: e.target.value })} variant="bordered" placeholder="Ej: Pista de baile" />
          <label className="de-field">
            <span className="de-field__label">Geometría</span>
            <input className="de-field__input" value={geometryLabel(element.geometry as FloorPlanGeometry)} readOnly />
          </label>
          <label className="de-field">
            <span className="de-field__label">Tipo</span>
            <select className="de-field__input" value={element.type} onChange={(e) => onChange({ type: e.target.value as WizardElement['type'] })}>
              <option value="stage">Escenario</option>
              <option value="bathroom">Baño</option>
              <option value="stairs">Escaleras</option>
              <option value="entrance">Entrada</option>
              <option value="exit">Salida</option>
              <option value="other">Otro</option>
            </select>
          </label>
          <TextField label="Notas" value={element.notes} onChange={(e) => onChange({ notes: e.target.value })} variant="bordered" placeholder="Notas adicionales sobre el elemento" />
        </div>
        <div className="de-fp-modal__actions de-fp-modal__actions--split">
          {onDelete && (
            <Button label="Eliminar elemento" variant="secondary" tone="lovable" onClick={onDelete} />
          )}
          <Button label="Cancelar" variant="secondary" tone="lovable" onClick={onClose} />
          <Button label="Guardar cambios" tone="lovable" onClick={onSave} />
        </div>
      </div>
    </div>
  );
};
