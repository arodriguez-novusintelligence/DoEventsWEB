import React from 'react';

export interface ReservationCountdownProps {
  label: string;
  urgent?: boolean;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  compact?: boolean;
}

export const ReservationCountdown: React.FC<ReservationCountdownProps> = ({
  label,
  urgent = false,
  subtitle,
  onAction,
  actionLabel,
  compact = false,
}) => (
  <div className={`de-reservation-clock${urgent ? ' de-reservation-clock--urgent' : ''}${compact ? ' de-reservation-clock--compact' : ''}`}>
    <div className="de-reservation-clock__ring" aria-hidden="true">
      <span className="de-reservation-clock__icon">⏱</span>
      <strong className="de-reservation-clock__time">{label}</strong>
    </div>
    <div className="de-reservation-clock__body">
      <strong>Reserva activa — 15 minutos</strong>
      {subtitle && <p>{subtitle}</p>}
      {onAction && actionLabel && (
        <button type="button" className="de-reservation-clock__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

export default ReservationCountdown;
