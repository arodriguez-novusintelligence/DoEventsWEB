import React from 'react';

export interface TicketQrCardProps {
  ticketIndex: number;
  ticketTotal: number;
  eventName: string;
  category: string;
  seatLabel?: string;
  gateName?: string;
  eventDate?: string;
  eventTime?: string;
  ticketId?: string;
  qrUrl?: string | null;
  locationLabel?: string;
  sectorLabel?: string;
  onShare?: () => void;
  isProvisional?: boolean;
}

export const TicketQrCard: React.FC<TicketQrCardProps> = ({
  ticketIndex,
  ticketTotal,
  eventName,
  category,
  seatLabel,
  gateName,
  eventDate,
  eventTime,
  ticketId,
  qrUrl,
  locationLabel,
  sectorLabel,
  onShare,
  isProvisional = false,
}) => (
  <div className="de-tuboleta-card">
    <header className="de-tuboleta-card__header">
      <span>Entrada {ticketIndex} de {ticketTotal}</span>
      <small>{eventName}</small>
    </header>

    <div className="de-tuboleta-card__body">
      <div className="de-tuboleta-card__qr-wrap">
        {qrUrl ? (
          <>
            <img src={qrUrl} alt={`QR boleta ${seatLabel || category}`} className="de-tuboleta-card__qr" />
            {isProvisional && (
              <p className="de-tuboleta-card__qr-note">
                QR provisional de reserva. Completa el pago en 15 minutos para confirmar tu entrada.
              </p>
            )}
          </>
        ) : (
          <div className="de-tuboleta-card__qr-placeholder">
            <span>QR</span>
            <small>{isProvisional ? 'Generando QR de reserva…' : 'Disponible tras confirmar el pago'}</small>
          </div>
        )}
      </div>

      <div className="de-tuboleta-card__brand">
        <strong>DoEvents</strong>
        <span>Tu boleta digital</span>
      </div>

      <div className="de-tuboleta-card__grid">
        <div>
          <p>Localidad</p>
          <strong>{locationLabel || category || 'General'}</strong>
        </div>
        <div>
          <p>Tribuna / Sector</p>
          <strong>{sectorLabel || category || 'General'}</strong>
        </div>
        <div>
          <p>Asiento</p>
          <strong>{seatLabel || 'Admisión general'}</strong>
        </div>
        <div>
          <p>Puerta</p>
          <strong>{gateName || 'Principal'}</strong>
        </div>
        <div>
          <p>Fecha</p>
          <strong>{eventDate || '—'}</strong>
        </div>
        <div>
          <p>Hora</p>
          <strong>{eventTime || '—'}</strong>
        </div>
      </div>

      {ticketId && (
        <p className="de-tuboleta-card__code">{ticketId}</p>
      )}

      {onShare && (
        <button type="button" className="de-tuboleta-card__share" onClick={onShare}>
          Compartir entrada
        </button>
      )}
    </div>
  </div>
);

export default TicketQrCard;
