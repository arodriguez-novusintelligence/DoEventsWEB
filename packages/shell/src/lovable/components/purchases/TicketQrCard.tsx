import { Calendar, Clock } from 'lucide-react';

export interface TicketQrCardData {
  id: string;
  category: string;
  /** Hex del mapa de silletería (p. ej. #E1BEE7) */
  categoryColor?: string;
  eventImage?: string;
  eventTitle?: string;
  eventDate: string;
  startTime?: string;
  qrUrl?: string;
  qrData?: string;
  seatLabel?: string;
  /** Enviada por el dueño: QR atenuado / no usable. */
  isTransferredOut?: boolean;
  /** Involucrada en transferencia (enviada o recibida): muestra el tag. */
  isTransferred?: boolean;
  isRefunded?: boolean;
  transferredLabel?: string;
}

function categoryBadgeClass(category: string): string {
  const raw = category.toLowerCase();
  if (raw.includes('vip')) return 'bg-amber-500 text-white';
  return 'bg-orange-500 text-white';
}

function isValidHexColor(color?: string): color is string {
  return Boolean(color && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
}

/** Texto legible sobre pasteles del mapa. */
function contrastTextForHex(hex: string): string {
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.62 ? '#1f2937' : '#ffffff';
}

function formatTimeLabel(time?: string): string {
  if (!time || time === '—') return '—';
  if (/a\.?\s*m\.?/i.test(time)) return time;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const hour = Number(match[1]);
  const min = match[2];
  const suffix = hour >= 12 ? 'P. M.' : 'A. M.';
  const h12 = hour % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${min} ${suffix}`;
}

interface TicketQrCardProps {
  ticket: TicketQrCardData;
  showImage?: boolean;
}

export function TicketQrCard({ ticket, showImage = true }: TicketQrCardProps) {
  const qrUrl = ticket.qrUrl
    || (ticket.qrData
      ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=0&data=${encodeURIComponent(ticket.qrData)}`
      : '');

  // Solo atenuar si el dueño ya la envió o está reembolsada (el receptor debe ver QR usable).
  const dimmed = Boolean(ticket.isTransferredOut || ticket.isRefunded);
  const showTransferLabel = Boolean(
    ticket.transferredLabel
    || ticket.isTransferredOut
    || (ticket.isTransferred && !ticket.isRefunded),
  );
  const hasHex = isValidHexColor(ticket.categoryColor);

  return (
    <article className="overflow-hidden rounded-3xl bg-card shadow-md">
      {showImage && (
        <div className="p-3 pb-0">
          <div className="h-40 w-full overflow-hidden rounded-2xl bg-muted">
            {ticket.eventImage ? (
              <img src={ticket.eventImage} alt={ticket.eventTitle || ''} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                {ticket.eventTitle || 'Evento'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Categoría</p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase ${
                hasHex ? '' : categoryBadgeClass(ticket.category)
              }`}
              style={hasHex
                ? {
                    backgroundColor: ticket.categoryColor,
                    color: contrastTextForHex(ticket.categoryColor),
                  }
                : undefined}
            >
              {ticket.category || 'General'}
            </span>
            {hasHex && (
              <span
                className="inline-block h-3 w-8 shrink-0 rounded-sm"
                style={{ backgroundColor: ticket.categoryColor }}
                title="Color en el mapa de silletería"
                aria-hidden
              />
            )}
          </div>
          {ticket.seatLabel && ticket.seatLabel !== '—' && (
            <p className="mt-2 text-base font-extrabold text-foreground">Silla - {ticket.seatLabel}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-sm text-muted-foreground">Fecha</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm font-extrabold text-foreground">{ticket.eventDate}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="mb-1.5 text-sm text-muted-foreground">Hora inicio</p>
            <div className="flex items-center justify-end gap-2">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm font-extrabold text-foreground">{formatTimeLabel(ticket.startTime)}</span>
            </div>
          </div>
        </div>

        <div className={`relative pt-1 ${dimmed ? 'opacity-35 grayscale' : ''}`}>
          <div className="flex justify-center">
            {qrUrl && !dimmed ? (
              <img src={qrUrl} alt="QR" className="h-56 w-56" />
            ) : dimmed ? (
              <div className="flex h-56 w-56 flex-col items-center justify-center rounded-xl bg-muted px-4 text-center text-sm font-semibold text-muted-foreground">
                {ticket.isRefunded ? 'Boleta inhabilitada' : 'QR no usable'}
              </div>
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                QR no disponible
              </div>
            )}
          </div>
          {ticket.qrData && !dimmed && (
            <p className="mt-3 break-all text-center text-sm font-medium tracking-wide text-foreground">
              {ticket.qrData}
            </p>
          )}
        </div>

        {(dimmed || showTransferLabel) && (
          <p className="text-center text-xs font-semibold text-amber-600">
            {ticket.isRefunded ? 'Boleta reembolsada / inhabilitada' : ticket.transferredLabel || 'Boleta transferida'}
          </p>
        )}
      </div>
    </article>
  );
}

export default TicketQrCard;
