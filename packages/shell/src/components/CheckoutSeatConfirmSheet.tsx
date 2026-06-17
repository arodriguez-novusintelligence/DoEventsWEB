import React from 'react';
import { Button, TicketCategory, type VenueFloorDetail } from '@doevents/shared';
import { FullVenueMapViewer } from './FullVenueMapViewer';
import type { PreviewSeat } from './SeatSelectionMiniMap';

interface CheckoutSeatConfirmSheetProps {
  open: boolean;
  eventName: string;
  floors: VenueFloorDetail[];
  ticketCategories: TicketCategory[];
  selected: PreviewSeat[];
  selectedIds: Set<string>;
  highlightSeatId: string | null;
  totalAmount: number;
  submitting: boolean;
  onHighlight: (ticketInstanceId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const CheckoutSeatConfirmSheet: React.FC<CheckoutSeatConfirmSheetProps> = ({
  open,
  eventName,
  floors,
  ticketCategories,
  selected,
  selectedIds,
  highlightSeatId,
  totalAmount,
  submitting,
  onHighlight,
  onClose,
  onConfirm,
}) => {
  const highlighted = selected.find((s) => s.ticketInstanceId === highlightSeatId) || selected[0];

  if (!open) return null;

  return (
    <div className="de-sheet-overlay de-checkout-confirm-overlay" onClick={onClose} role="presentation">
      <div
        className="de-sheet de-checkout-confirm-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-confirm-title"
      >
        <header className="de-sheet__header">
          <div>
            <h2 id="checkout-confirm-title">Confirma tu ubicación</h2>
            <p className="de-checkout-confirm-sheet__sub">{eventName}</p>
          </div>
          <button type="button" className="de-sheet__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <div className="de-sheet__body de-checkout-confirm-sheet__body">
          <FullVenueMapViewer
            floors={floors}
            ticketCategories={ticketCategories}
            selectedIds={selectedIds}
            highlightSeats={selected.map((s) => ({
              categoryName: s.categoryName,
              label: s.label,
            }))}
            readOnly
            height="min(55vh, 420px)"
          />

          {highlighted && (
            <div className="de-checkout-confirm-sheet__focus-card">
              <div>
                <strong>{highlighted.categoryName}</strong>
                <span>Asiento {highlighted.label}</span>
              </div>
              <strong className="de-checkout-confirm-sheet__focus-price">
                ${highlighted.price.toLocaleString('es-CO')}
              </strong>
            </div>
          )}

          <div className="de-checkout-confirm-sheet__list">
            {selected.map((item) => (
              <button
                key={item.ticketInstanceId}
                type="button"
                className={`de-checkout-confirm-sheet__item${highlightSeatId === item.ticketInstanceId ? ' de-checkout-confirm-sheet__item--active' : ''}`}
                onClick={() => onHighlight(item.ticketInstanceId)}
              >
                <span className="de-checkout-confirm-sheet__item-dot" style={{ background: item.color || '#5856EB' }} />
                <span className="de-checkout-confirm-sheet__item-meta">
                  <strong>{item.categoryName}</strong>
                  <small>Asiento {item.label}</small>
                </span>
                <span className="de-checkout-confirm-sheet__item-price">
                  ${item.price.toLocaleString('es-CO')}
                </span>
              </button>
            ))}
          </div>
        </div>

        <footer className="de-checkout-confirm-sheet__footer">
          <div className="de-checkout-confirm-sheet__total">
            <span>Total a pagar</span>
            <strong>${totalAmount.toLocaleString('es-CO')} COP</strong>
          </div>
          <p className="de-checkout-confirm-sheet__reserve-note">
            Al confirmar, tus sillas se reservan por 15 minutos.
          </p>
          <Button
            label={submitting ? 'Reservando...' : 'Confirmar y pagar'}
            tone="lovable"
            disabled={submitting}
            onClick={onConfirm}
          />
          <button type="button" className="de-checkout-confirm-sheet__cancel" onClick={onClose}>
            Volver al mapa
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CheckoutSeatConfirmSheet;
