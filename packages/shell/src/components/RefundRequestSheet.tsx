import React, { useEffect, useMemo, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { checkRefundEligibility, requestEventRefund } from '@doevents/shared';
import type { Ticket } from '@lovable/data/ticketsData';

const REFUND_REASONS = [
  { id: 'cancelled', label: 'Evento cancelado o pospuesto' },
  { id: 'force_majeure', label: 'Fuerza mayor (con asistencia DoEvents)' },
  { id: 'personal', label: 'Inasistencia personal documentada' },
  { id: 'other', label: 'Otro motivo' },
] as const;

export interface RefundRequestResult {
  filingId: string;
  refundId: string;
  ticketIds: string[];
}

interface RefundRequestSheetProps {
  open: boolean;
  userId: string;
  tickets: Ticket[];
  onClose: () => void;
  onSuccess: (result: RefundRequestResult) => void;
}

export const RefundRequestSheet: React.FC<RefundRequestSheetProps> = ({
  open,
  userId,
  tickets,
  onClose,
  onSuccess,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reasonType, setReasonType] = useState<string>('other');
  const [reasonDetail, setReasonDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [eligibilityMsg, setEligibilityMsg] = useState('');

  const eventId = tickets[0]?.eventId;
  const orderId = tickets[0]?.orderId;

  const selectableTickets = useMemo(
    () => tickets.filter((t) => t.status === 'aprobada' && t.orderId),
    [tickets],
  );

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setReasonDetail('');
      setEligible(null);
      return;
    }
    if (selectableTickets.length === 1) {
      setSelected(new Set([selectableTickets[0].id]));
    }
  }, [open, selectableTickets]);

  useEffect(() => {
    if (!open || !eventId || !orderId || !userId) return;
    let cancelled = false;
    setChecking(true);
    checkRefundEligibility(eventId, userId, orderId)
      .then((res) => {
        if (cancelled) return;
        setEligible(Boolean(res?.canRequestRefund));
        setEligibilityMsg(res?.reason || '');
      })
      .catch(() => {
        if (!cancelled) {
          setEligible(false);
          setEligibilityMsg('No se pudo verificar la elegibilidad de reembolso.');
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => { cancelled = true; };
  }, [open, eventId, orderId, userId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!orderId || !selected.size || !eligible) return;
    const reasonLabel = REFUND_REASONS.find((r) => r.id === reasonType)?.label || reasonType;
    const fullReason = reasonDetail.trim()
      ? `${reasonLabel}: ${reasonDetail.trim()}`
      : reasonLabel;

    setLoading(true);
    try {
      const ticketInstanceIds = selectableTickets
        .filter((t) => selected.has(t.id))
        .map((t) => t.ticketInstanceId || t.id);

      const result = await requestEventRefund({
        userId,
        orderId,
        reason: fullReason,
        ticketInstanceIds,
      });

      onSuccess({
        filingId: result.filingId,
        refundId: result.refundId,
        ticketIds: [...selected],
      });
      onClose();
    } catch (err) {
      setEligibilityMsg(err instanceof Error ? err.message : 'Error al solicitar reembolso');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border px-4 py-4 bg-card">
          <h2 className="text-lg font-bold text-foreground">Solicitar reembolso</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecciona las boletas a reembolsar. Recibirás un ID de radicación por correo y WhatsApp.
            El organizador del evento será notificado con el detalle de tu solicitud.
          </p>

          {checking && (
            <p className="text-sm text-muted-foreground">Verificando elegibilidad…</p>
          )}

          {!checking && eligible === false && (
            <div className="flex gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{eligibilityMsg || 'Este evento no permite reembolsos con la política configurada.'}</span>
            </div>
          )}

          {eligible && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Boletas</p>
                {selectableTickets.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggle(t.id)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{t.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category}
                        {t.seatLabel ? ` · Asiento ${t.seatLabel}` : ''}
                        {t.price ? ` · $${t.price.toLocaleString('es-CO')}` : ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Motivo del reembolso</p>
                <select
                  value={reasonType}
                  onChange={(e) => setReasonType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                >
                  {REFUND_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  placeholder="Describe brevemente el motivo (opcional pero recomendado)"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none"
                />
              </div>

              {eligibilityMsg && (
                <p className="text-xs text-muted-foreground">{eligibilityMsg}</p>
              )}

              <button
                type="button"
                disabled={loading || !selected.size}
                onClick={handleSubmit}
                className="w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {loading ? 'Radicando solicitud…' : `Solicitar reembolso (${selected.size} boleta${selected.size !== 1 ? 's' : ''})`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundRequestSheet;
