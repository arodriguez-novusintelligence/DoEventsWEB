import { toast } from 'sonner';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { createElement } from 'react';
import { useNotifications, NotificationType } from '@lovable/contexts/NotificationsContext';

export type PurchaseKind = 'ticket' | 'venue' | 'service' | 'subscription';

interface PurchaseInfo {
  kind: PurchaseKind;
  /** Display name of what was purchased (event title, venue name, service role, plan name) */
  itemName: string;
  /** Optional seller display name (host/provider). Defaults vary per kind. */
  sellerName?: string;
  /** Optional buyer display name. Defaults to "Tú". */
  buyerName?: string;
  /** Formatted amount, e.g. "$ 1.250.000" or "US$ 70". */
  amount?: string;
  /** Optional buyer email (used in the email toast). */
  buyerEmail?: string;
  /** Optional seller email (used in the email toast). */
  sellerEmail?: string;
}

const KIND_LABELS: Record<PurchaseKind, { buyer: string; seller: string; buyerType: NotificationType; sellerType: NotificationType }> = {
  ticket: {
    buyer: 'Compra de boleta confirmada',
    seller: '¡Vendiste una boleta!',
    buyerType: 'ticket_purchase',
    sellerType: 'ticket_sold',
  },
  venue: {
    buyer: 'Reserva de lugar confirmada',
    seller: '¡Tu lugar ha sido reservado!',
    buyerType: 'venue_reservation',
    sellerType: 'venue_reserved',
  },
  service: {
    buyer: 'Reserva de servicio confirmada',
    seller: '¡Te reservaron un servicio!',
    buyerType: 'service_booking',
    sellerType: 'service_booked',
  },
  subscription: {
    buyer: '¡Suscripción PRO activada!',
    seller: '',
    buyerType: 'subscription_purchase',
    sellerType: 'subscription_purchase',
  },
};

/**
 * Hook that emits notifications for purchases:
 * - In-app bell notifications for buyer and (when applies) seller
 * - Email notification toasts for buyer and seller
 * - Push notification toasts for buyer and seller
 */
export const useNotifyPurchase = () => {
  const { addNotification } = useNotifications();

  return (info: PurchaseInfo) => {
    const labels = KIND_LABELS[info.kind];
    const buyer = info.buyerName || 'Tú';
    const seller = info.sellerName || 'Vendedor';
    const amountSuffix = info.amount ? ` · ${info.amount}` : '';

    // ── BELL: Buyer notification (always for "Tú") ──
    addNotification({
      type: labels.buyerType,
      fromUser: { name: 'Sistema', initials: '💳' },
      eventName: info.itemName,
      message: `${labels.buyer}${amountSuffix}`,
    });

    // ── BELL: Seller notification (skip for subscription — Lovable is the "seller") ──
    if (info.kind !== 'subscription') {
      addNotification({
        type: labels.sellerType,
        fromUser: { name: buyer, initials: buyer.slice(0, 2).toUpperCase() },
        eventName: info.itemName,
        message: `${labels.seller}${amountSuffix}`,
      });
    }

    // ── EMAIL toasts ──
    const buyerMail = info.buyerEmail || 'tu correo';
    toast(`Correo enviado a ${buyerMail}`, {
      description: `${labels.buyer} — ${info.itemName}`,
      icon: createElement(Mail, { className: 'h-4 w-4 text-primary' }),
    });
    if (info.kind !== 'subscription') {
      const sellerMail = info.sellerEmail || `${seller.toLowerCase().replace(/\s+/g, '')}@mail.com`;
      toast(`Correo enviado a ${sellerMail}`, {
        description: `${labels.seller} — ${info.itemName}`,
        icon: createElement(Mail, { className: 'h-4 w-4 text-primary' }),
      });
    }

    // ── PUSH toasts ──
    toast(`Push para ${buyer}`, {
      description: `${labels.buyer}${amountSuffix}`,
      icon: createElement(Smartphone, { className: 'h-4 w-4 text-primary' }),
    });
    if (info.kind !== 'subscription') {
      toast(`Push para ${seller}`, {
        description: `${labels.seller}${amountSuffix}`,
        icon: createElement(Smartphone, { className: 'h-4 w-4 text-primary' }),
      });
    }

    // ── Bell summary toast ──
    toast('Notificaciones enviadas', {
      description: info.kind === 'subscription'
        ? 'Te avisamos por campana, correo y push.'
        : 'Comprador y vendedor recibieron campana, correo y push.',
      icon: createElement(Bell, { className: 'h-4 w-4 text-primary' }),
    });
  };
};
