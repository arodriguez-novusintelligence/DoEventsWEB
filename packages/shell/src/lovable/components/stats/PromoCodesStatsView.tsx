import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Ticket, Copy, CheckCircle2, Circle, ChevronDown, ChevronUp, ShoppingBag, User as UserIcon, CalendarDays, Clock, Plus, X, Share2, Search, Mail, MessageCircle, Bell, Send, Check, History, Ban, AlertTriangle } from 'lucide-react';
import { supabase } from '@lovable/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@lovable/components/ui/dialog';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';
import { Button } from '@lovable/components/ui/button';
import { Textarea } from '@lovable/components/ui/textarea';
import { toast } from 'sonner';
import type { EventChatRoom } from '@lovable/data/chatData';
import type { PromoCodeBatch, PromoCurrency } from '@lovable/data/eventFormData';
import { getEventPromoCodes, generateUniquePromoCodes, addEventPromoCodeBatch } from '@lovable/data/promoCodesData';
import type { User } from '@lovable/data/';
import { useNotifications } from '@lovable/contexts/NotificationsContext';

interface SearchableUser {
  id: string;
  name: string;
  username: string;
  email: string;
  initials: string;
  avatar?: string;
}

const SEARCHABLE_USERS: SearchableUser[] = [
  { id: 'su-1', name: 'Ana María Torres', username: 'ana.torres', email: 'ana.torres@mail.com', initials: 'AT' },
  { id: 'su-2', name: 'Carlos López', username: 'carlos.lopez', email: 'carlos.lopez@mail.com', initials: 'CL' },
  { id: 'su-3', name: 'Juliana Pérez', username: 'juliana.p', email: 'juliana.perez@mail.com', initials: 'JP' },
  { id: 'su-4', name: 'Ricardo Mejía', username: 'ricardo.m', email: 'ricardo.mejia@mail.com', initials: 'RM' },
  { id: 'su-5', name: 'Sofía Restrepo', username: 'sofi.r', email: 'sofia.restrepo@mail.com', initials: 'SR' },
  { id: 'su-6', name: 'Daniel Gómez', username: 'dani.gomez', email: 'daniel.gomez@mail.com', initials: 'DG' },
  { id: 'su-7', name: 'Mariana Cárdenas', username: 'mariana.c', email: 'mariana.c@mail.com', initials: 'MC' },
];

type ShareChannel = 'mail' | 'whatsapp' | 'campana';

interface PromoCodesStatsViewProps {
  event: EventChatRoom;
  onBack: () => void;
  onViewProfile?: (user: User | { name: string; initials: string }) => void;
}

interface Redemption {
  code: string;
  orderId: string;
  redeemedAt: string;
  user: { id: string; name: string; initials: string; avatar?: string; username: string };
  ticketType: string;
  ticketQty: number;
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  currency: string;
}

const formatMoney = (v: number, currency: string) => {
  if (currency === 'COP' || currency === 'MXN' || currency === 'DOP') {
    return `${currency} $ ${v.toLocaleString('es-CO')}`;
  }
  return `${currency} ${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

// Mock fallback: si el registry no tiene códigos para este evento, generamos
// dos lotes de demostración (VIP y GENERAL) para visualizar el módulo.
const buildMockBatches = (eventId: string): PromoCodeBatch[] => {
  const seed = new Set<string>();
  return [
    {
      id: `${eventId}-vip`,
      currency: 'COP',
      value: 50000,
      quantity: 10,
      description: 'VIP',
      codes: generateUniquePromoCodes(10, seed),
    },
    {
      id: `${eventId}-gen`,
      currency: 'COP',
      value: 20000,
      quantity: 10,
      description: 'GENERAL',
      codes: generateUniquePromoCodes(10, seed),
    },
  ];
};


const PromoCodesStatsView = ({ event, onBack, onViewProfile }: PromoCodesStatsViewProps) => {
  const [localBatches, setLocalBatches] = useState<PromoCodeBatch[]>([]);

  const batches = useMemo<PromoCodeBatch[]>(() => {
    const real = getEventPromoCodes(event.id);
    const base = real.length > 0 ? real : buildMockBatches(event.id);
    return [...base, ...localBatches.filter((lb) => !base.some((b) => b.id === lb.id))];
  }, [event.id, localBatches]);

  // Form state for new batch
  const [createOpen, setCreateOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCurrency, setNewCurrency] = useState<PromoCurrency>('COP');
  const [newQuantity, setNewQuantity] = useState('');

  const resetForm = () => {
    setNewDescription('');
    setNewValue('');
    setNewCurrency('COP');
    setNewQuantity('');
  };

  const handleCreateBatch = () => {
    const value = Number(newValue);
    const quantity = Number(newQuantity);
    const description = newDescription.trim();
    if (!description) return toast.error('Ingresa una etiqueta (ej: VIP, GENERAL)');
    if (!value || value <= 0) return toast.error('Ingresa un valor válido');
    if (!quantity || quantity <= 0 || quantity > 500) return toast.error('Cantidad entre 1 y 500');

    const existing = new Set<string>(batches.flatMap((b) => b.codes));
    const codes = generateUniquePromoCodes(quantity, existing);
    const batch: PromoCodeBatch = {
      id: `${event.id}-${Date.now()}`,
      currency: newCurrency,
      value,
      quantity,
      description: description.toUpperCase(),
      codes,
    };
    addEventPromoCodeBatch(event.id, batch);
    setLocalBatches((prev) => [...prev, batch]);
    setOpenBatchId(batch.id);
    setCreateOpen(false);
    resetForm();
    toast.success(`${quantity} códigos generados para ${description.toUpperCase()}`);
  };

  // Determinar de manera determinista qué códigos están "usados" (mock).
  // Tomamos ~40% de cada lote como redimidos.
  const redemptions = useMemo<Record<string, Redemption>>(() => {
    const map: Record<string, Redemption> = {};
    batches.forEach((batch, bIdx) => {
      const usedCount = Math.max(1, Math.floor(batch.codes.length * 0.4));
      batch.codes.slice(0, usedCount).forEach((code, idx) => {
        const user = USERS[(bIdx * 3 + idx) % USERS.length];
        const subtotal = batch.description === 'VIP' ? 180000 : 90000;
        const serviceFee = Math.round(subtotal * 0.08);
        const total = Math.max(0, subtotal + serviceFee - batch.value);
        const day = 10 + idx;
        map[code] = {
          code,
          orderId: `DOE-${batch.description.slice(0, 2).toUpperCase()}${1000 + bIdx * 100 + idx}`,
          redeemedAt: `${String(day).padStart(2, '0')} MAR 2026 · ${String(9 + (idx % 12)).padStart(2, '0')}:${String((idx * 7) % 60).padStart(2, '0')}`,
          user,
          ticketType: batch.description,
          ticketQty: 1 + (idx % 3),
          subtotal,
          serviceFee,
          discount: batch.value,
          total,
          currency: batch.currency,
        };
      });
    });
    return map;
  }, [batches]);

  const totalCodes = batches.reduce((sum, b) => sum + b.codes.length, 0);
  const totalUsed = Object.keys(redemptions).length;
  const totalDiscount = Object.values(redemptions).reduce((s, r) => s + r.discount, 0);

  const [openBatchId, setOpenBatchId] = useState<string | null>(batches[0]?.id ?? null);
  const [expandedRedemption, setExpandedRedemption] = useState<string | null>(null);
  const [expandedShares, setExpandedShares] = useState<string | null>(null);
  const [expandedCanceled, setExpandedCanceled] = useState<string | null>(null);

  // Share history loaded from DB
  interface ShareRecord {
    id: string;
    promo_code: string;
    recipient_id: string;
    recipient_name: string;
    recipient_username: string;
    recipient_email: string | null;
    channels: string[];
    message: string | null;
    organizer_name: string | null;
    created_at: string;
  }
  const [shares, setShares] = useState<ShareRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('promo_code_shares')
        .select('id, promo_code, recipient_id, recipient_name, recipient_username, recipient_email, channels, message, organizer_name, created_at')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (!error && data) setShares(data as ShareRecord[]);
    })();
    return () => { mounted = false; };
  }, [event.id]);

  // Mock de códigos COMPARTIDOS: tomamos el siguiente ~30% de cada lote (después de los usados)

  const sharesByCode = useMemo(() => {
    const map: Record<string, ShareRecord[]> = {};
    [...shares, ...mockShares].forEach((s) => {
      (map[s.promo_code] ||= []).push(s);
    });
    return map;
  }, [shares, mockShares]);

  // Cancellations loaded from DB
  interface CancellationRecord {
    id: string;
    promo_code: string;
    reason: string | null;
    created_at: string;
  }
  const [cancellations, setCancellations] = useState<CancellationRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('promo_code_cancellations')
        .select('id, promo_code, reason, created_at')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (!error && data) setCancellations(data as CancellationRecord[]);
    })();
    return () => { mounted = false; };
  }, [event.id]);

  // Mock cancellations: 1 código cancelado por lote, evitando códigos ya usados/compartidos

  const cancellationByCode = useMemo(() => {
    const map: Record<string, CancellationRecord> = {};
    [...cancellations, ...mockCancellations].forEach((c) => { map[c.promo_code] = c; });
    return map;
  }, [cancellations, mockCancellations]);

  type CodeStatus = 'USADO' | 'CANCELADO' | 'COMPARTIDO' | 'DISPONIBLE';
  const getStatus = (code: string): CodeStatus => {
    if (cancellationByCode[code]) return 'CANCELADO';
    if (redemptions[code]) return 'USADO';
    if ((sharesByCode[code] ?? []).length > 0) return 'COMPARTIDO';
    return 'DISPONIBLE';
  };

  const statusStyle: Record<CodeStatus, { badge: string; row: string; icon: string }> = {
    USADO: { badge: 'bg-emerald-100 text-emerald-700', row: 'border-emerald-200 bg-emerald-50/40', icon: 'text-emerald-600' },
    COMPARTIDO: { badge: 'bg-indigo-100 text-indigo-700', row: 'border-indigo-200 bg-indigo-50/40', icon: 'text-indigo-600' },
    CANCELADO: { badge: 'bg-rose-100 text-rose-700', row: 'border-rose-200 bg-rose-50/40 opacity-80', icon: 'text-rose-600' },
    DISPONIBLE: { badge: 'bg-muted text-muted-foreground', row: 'border-border bg-background', icon: 'text-muted-foreground' },
  };

  const formatShareDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const channelLabel = (c: string) => (c === 'mail' ? 'Mail' : c === 'whatsapp' ? 'WhatsApp' : c === 'campana' ? 'Campana' : c);
  const channelIcon = (c: string) => (c === 'mail' ? Mail : c === 'whatsapp' ? MessageCircle : Bell);

  // Cancel dialog state
  const [cancelCode, setCancelCode] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const cancelBatch = useMemo(
    () => batches.find((b) => b.codes.includes(cancelCode ?? '')) ?? null,
    [batches, cancelCode]
  );

  const { addNotification } = useNotifications();

  const handleConfirmCancel = async () => {
    if (!cancelCode) return;
    const batchId = batches.find((b) => b.codes.includes(cancelCode))?.id ?? null;
    const { data, error } = await supabase
      .from('promo_code_cancellations')
      .insert({
        event_id: event.id,
        batch_id: batchId,
        promo_code: cancelCode,
        reason: cancelReason.trim() || null,
      })
      .select('id, promo_code, reason, created_at')
      .single();
    if (error) { toast.error('No se pudo cancelar el código'); return; }
    setCancellations((prev) => [data as CancellationRecord, ...prev]);

    // Si el código estaba COMPARTIDO, notificar a cada destinatario (campana + simulación mail)
    const recipients = sharesByCode[cancelCode] ?? [];
    if (recipients.length > 0) {
      const valueLabel = cancelBatch ? `${formatMoney(cancelBatch.value, cancelBatch.currency)} ${cancelBatch.description}` : '';
      recipients.forEach((r) => {
        const initials = r.recipient_name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
        addNotification({
          type: 'promo_code_canceled',
          fromUser: { id: r.recipient_id, name: r.recipient_name, initials },
          eventName: event.eventName,
          message: `Tu código promocional ${cancelCode}${valueLabel ? ` (${valueLabel})` : ''} fue cancelado por el organizador y ya no podrá ser redimido`,
        });
      });
      toast.success(`Código ${cancelCode} cancelado · Notificación enviada a ${recipients.length} destinatario${recipients.length > 1 ? 's' : ''} (mail + campana)`);
    } else {
      toast.success(`Código ${cancelCode} cancelado`);
    }
    setCancelCode(null);
    setCancelReason('');
  };


  // Share dialog state
  const ORGANIZER_NAME = 'Andrés López';
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareQuery, setShareQuery] = useState('');
  const [shareUser, setShareUser] = useState<SearchableUser | null>(null);
  const [shareChannels, setShareChannels] = useState<ShareChannel[]>(['campana']);
  const [shareMessage, setShareMessage] = useState('');
  const [shareSent, setShareSent] = useState(false);

  const shareBatch = useMemo(
    () => batches.find((b) => b.codes.includes(shareCode ?? '')) ?? null,
    [batches, shareCode]
  );

  const filteredUsers = useMemo(() => {
    const q = shareQuery.trim().toLowerCase().replace(/^@/, '');
    if (!q) return SEARCHABLE_USERS.slice(0, 5);
    return SEARCHABLE_USERS.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [shareQuery]);

  const openShare = (code: string) => {
    setShareCode(code);
    setShareUser(null);
    setShareQuery('');
    setShareChannels(['campana']);
    setShareMessage('');
    setShareSent(false);
  };

  const toggleChannel = (c: ShareChannel) => {
    setShareChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleSendShare = async () => {
    if (!shareUser) return toast.error('Selecciona un usuario');
    if (shareChannels.length === 0) return toast.error('Selecciona al menos un canal');
    if (!shareCode) return;

    const defaultMessage = `Hola, el organizador ${ORGANIZER_NAME} te ha compartido un código promocional para el evento ${event.eventName}. Ingresa, adquiere tus entradas y redime tu bono promocional.`;
    const finalMessage = shareMessage.trim() || defaultMessage;

    const batchId = batches.find((b) => b.codes.includes(shareCode))?.id ?? null;

    const { data, error } = await supabase
      .from('promo_code_shares')
      .insert({
        event_id: event.id,
        batch_id: batchId,
        promo_code: shareCode,
        recipient_id: shareUser.id,
        recipient_name: shareUser.name,
        recipient_username: shareUser.username,
        recipient_email: shareUser.email,
        recipient_avatar: shareUser.avatar ?? null,
        channels: shareChannels,
        message: finalMessage,
        organizer_name: ORGANIZER_NAME,
      })
      .select('id, promo_code, recipient_id, recipient_name, recipient_username, recipient_email, channels, message, organizer_name, created_at')
      .single();

    if (error) {
      toast.error('No se pudo registrar el envío');
      return;
    }

    setShares((prev) => [data as ShareRecord, ...prev]);
    setShareSent(true);
    const labels = shareChannels.map(channelLabel).join(', ');
    toast.success(`Código enviado a @${shareUser.username} vía ${labels}`);
    setTimeout(() => setShareCode(null), 1500);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pt-16 pb-8 rounded-b-3xl">
        <div className="mx-auto max-w-lg">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-primary-foreground hover:bg-primary-foreground/10 rounded-lg px-2 py-1 -ml-2 transition mb-3">
            <ChevronLeft className="h-4 w-4" /> Atrás
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
              <Ticket className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-primary-foreground leading-tight">Códigos promocionales</h1>
              <p className="text-xs text-primary-foreground/80 truncate">{event.eventName}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-primary-foreground/15 backdrop-blur p-3 text-center">
              <div className="text-lg font-extrabold text-primary-foreground">{totalCodes}</div>
              <div className="text-[10px] uppercase tracking-wide text-primary-foreground/80">Generados</div>
            </div>
            <div className="rounded-xl bg-primary-foreground/15 backdrop-blur p-3 text-center">
              <div className="text-lg font-extrabold text-primary-foreground">{totalUsed}</div>
              <div className="text-[10px] uppercase tracking-wide text-primary-foreground/80">Redimidos</div>
            </div>
            <div className="rounded-xl bg-primary-foreground/15 backdrop-blur p-3 text-center">
              <div className="text-lg font-extrabold text-primary-foreground">{totalCodes - totalUsed}</div>
              <div className="text-[10px] uppercase tracking-wide text-primary-foreground/80">Disponibles</div>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-primary-foreground/10 backdrop-blur px-3 py-2 text-[11px] text-primary-foreground/90 text-center">
            Descuento aplicado: <span className="font-bold">{formatMoney(totalDiscount, batches[0]?.currency ?? 'COP')}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-5 space-y-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold py-3 shadow-sm hover:bg-primary/90 transition"
        >
          <Plus className="h-5 w-5" />
          Crear códigos promocionales
        </button>

        {batches.map((batch) => {
          const isOpen = openBatchId === batch.id;
          const usedInBatch = batch.codes.filter((c) => redemptions[c]).length;

          return (
            <div key={batch.id} className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenBatchId(isOpen ? null : batch.id)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{batch.description}</div>
                    <div className="text-base font-bold text-foreground">{formatMoney(batch.value, batch.currency)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {usedInBatch} de {batch.codes.length} redimidos
                    </div>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-primary" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {batch.codes.map((code) => {
                    const r = redemptions[code];
                    const used = !!r;
                    const status = getStatus(code);
                    const style = statusStyle[status];
                    const expanded = expandedRedemption === code;
                    const codeShares = sharesByCode[code] ?? [];
                    const sharesOpen = expandedShares === code;
                    const canCancel = status === 'DISPONIBLE' || status === 'COMPARTIDO';
                    const canceled = status === 'CANCELADO';
                    const cancellation = cancellationByCode[code];
                    return (
                      <div
                        key={code}
                        className={`rounded-xl border ${style.row} overflow-hidden`}
                      >
                        <div className="flex items-center gap-2 p-3">
                          {status === 'USADO' ? (
                            <CheckCircle2 className={`h-4 w-4 ${style.icon} shrink-0`} />
                          ) : status === 'COMPARTIDO' ? (
                            <Share2 className={`h-4 w-4 ${style.icon} shrink-0`} />
                          ) : status === 'CANCELADO' ? (
                            <Ban className={`h-4 w-4 ${style.icon} shrink-0`} />
                          ) : (
                            <Circle className={`h-4 w-4 ${style.icon} shrink-0`} />
                          )}
                          <span className={`font-mono text-sm font-bold flex-1 truncate ${canceled ? 'text-rose-700 line-through' : 'text-foreground'}`}>{code}</span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 ${style.badge}`}>
                            {status}
                          </span>
                          {status === 'DISPONIBLE' && (
                            <button
                              onClick={() => copy(code, 'Código')}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="Copiar código"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {status === 'DISPONIBLE' && (
                            <button
                              onClick={() => openShare(code)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                              aria-label="Compartir código"
                              title="Compartir"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => { setCancelCode(code); setCancelReason(''); }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50"
                              aria-label="Cancelar código"
                              title="Cancelar código"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {codeShares.length > 0 && (
                            <button
                              onClick={() => setExpandedShares(expandedShares === code ? null : code)}
                              className="flex h-7 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                              aria-label="Ver historial"
                              title="Historial de envíos"
                            >
                              <History className="h-3.5 w-3.5" />
                              {codeShares.length}
                            </button>
                          )}
                          {used && (
                            <button
                              onClick={() => setExpandedRedemption(expanded ? null : code)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10"
                              aria-label="Ver detalle"
                            >
                              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                          {canceled && cancellation && (
                            <button
                              onClick={() => setExpandedCanceled(expandedCanceled === code ? null : code)}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50"
                              aria-label="Ver detalle de cancelación"
                            >
                              {expandedCanceled === code ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </div>

                        {canceled && cancellation && expandedCanceled === code && (
                          <div className="border-t border-rose-200/60 bg-rose-50/40 px-3 py-2 text-[11px] text-rose-700 flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold">Código cancelado · {formatShareDate(cancellation.created_at)}</div>
                              {cancellation.reason && <div className="text-rose-600/90">Motivo: {cancellation.reason}</div>}
                              <div className="text-rose-600/80">Inhabilitado para uso y nuevas comparticiones.</div>
                            </div>
                          </div>
                        )}


                        {sharesOpen && codeShares.length > 0 && (
                          <div className="border-t border-indigo-100 bg-indigo-50/30 p-3 space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                              <History className="h-3 w-3" /> Historial de envíos ({codeShares.length})
                            </div>
                            {codeShares.map((s) => {
                              const recipientInitials = s.recipient_name.split(' ').map((p) => p[0]).slice(0, 2).join('');
                              return (
                                <div key={s.id} className="rounded-lg bg-card border border-indigo-100 p-2.5 space-y-1.5">
                                  <button
                                    onClick={() => onViewProfile?.({ name: s.recipient_name, initials: recipientInitials })}
                                    className="w-full flex items-center gap-2 text-left"
                                  >
                                    <Avatar className="h-7 w-7">
                                      <AvatarFallback className="bg-indigo-600 text-primary-foreground text-[10px] font-bold">
                                        {recipientInitials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs font-bold text-foreground truncate">{s.recipient_name}</div>
                                      <div className="text-[10px] text-muted-foreground truncate">@{s.recipient_username}{s.recipient_email ? ` · ${s.recipient_email}` : ''}</div>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                                      <Clock className="h-3 w-3" /> {formatShareDate(s.created_at)}
                                    </div>
                                  </button>
                                  <div className="flex flex-wrap gap-1">
                                    {s.channels.map((c) => {
                                      const Icon = channelIcon(c);
                                      return (
                                        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-semibold">
                                          <Icon className="h-2.5 w-2.5" /> {channelLabel(c)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  {s.message && (
                                    <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-md px-2 py-1.5 leading-snug">
                                      {s.message}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {used && expanded && r && (
                          <div className="border-t border-emerald-200/60 bg-card p-3 space-y-3">
                            {/* Orden de compra */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <ShoppingBag className="h-3.5 w-3.5" />
                                <span>Orden de compra</span>
                              </div>
                              <button
                                onClick={() => copy(r.orderId, 'Orden')}
                                className="flex items-center gap-1 text-xs font-bold text-foreground"
                              >
                                {r.orderId}
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />
                                <span>{r.redeemedAt.split(' · ')[0]}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{r.redeemedAt.split(' · ')[1]}</span>
                              </div>
                            </div>

                            {/* Detalle de la compra */}
                            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-[12px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{r.ticketType} × {r.ticketQty}</span>
                                <span className="font-medium text-foreground">{formatMoney(r.subtotal, r.currency)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Servicio</span>
                                <span className="font-medium text-foreground">{formatMoney(r.serviceFee, r.currency)}</span>
                              </div>
                              <div className="flex justify-between text-emerald-700">
                                <span>Descuento ({code})</span>
                                <span className="font-semibold">- {formatMoney(r.discount, r.currency)}</span>
                              </div>
                              <div className="border-t border-border pt-1.5 flex justify-between">
                                <span className="font-semibold text-foreground">Total pagado</span>
                                <span className="font-bold text-foreground">{formatMoney(r.total, r.currency)}</span>
                              </div>
                            </div>

                            {/* Usuario que redimió */}
                            <button
                              onClick={() => onViewProfile?.({ name: r.user.name, initials: r.user.initials })}
                              className="w-full flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-left hover:bg-primary/10 transition"
                            >
                              <Avatar className="h-9 w-9">
                                {r.user.avatar && <AvatarImage src={r.user.avatar} />}
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                  {r.user.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase tracking-wide text-primary font-semibold flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" /> Redimido por
                                </div>
                                <div className="text-sm font-bold text-foreground truncate">{r.user.name}</div>
                                <div className="text-[11px] text-muted-foreground truncate">@{r.user.username}</div>
                              </div>
                              <span className="text-[11px] font-semibold text-primary">Ver perfil →</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Crear códigos promocionales
            </DialogTitle>
            <DialogDescription>
              Se asociarán automáticamente al evento <span className="font-semibold text-foreground">{event.eventName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="promo-desc">Etiqueta del lote</Label>
              <Input
                id="promo-desc"
                placeholder="Ej: VIP, GENERAL, EARLY"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                maxLength={20}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="promo-value">Valor del descuento</Label>
                <Input
                  id="promo-value"
                  type="number"
                  inputMode="numeric"
                  placeholder="50000"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-currency">Moneda</Label>
                <select
                  id="promo-currency"
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value as PromoCurrency)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="MXN">MXN</option>
                  <option value="DOP">DOP</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="promo-qty">Cantidad de códigos a generar</Label>
              <Input
                id="promo-qty"
                type="number"
                inputMode="numeric"
                placeholder="10"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                min={1}
                max={500}
              />
              <p className="text-[11px] text-muted-foreground">Máximo 500 códigos por lote. Formato: DOE-XXXXXX.</p>
            </div>

            {newValue && newQuantity && Number(newValue) > 0 && Number(newQuantity) > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Códigos a generar</span>
                  <span className="font-semibold text-foreground">{newQuantity}</span>
                </div>
                <div className="flex justify-between text-muted-foreground mt-1">
                  <span>Valor por código</span>
                  <span className="font-semibold text-foreground">{formatMoney(Number(newValue), newCurrency)}</span>
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t border-primary/20">
                  <span className="font-semibold text-foreground">Descuento máximo total</span>
                  <span className="font-bold text-primary">{formatMoney(Number(newValue) * Number(newQuantity), newCurrency)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setCreateOpen(false); resetForm(); }}>
                <X className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button className="flex-1" onClick={handleCreateBatch}>
                <Plus className="h-4 w-4 mr-1" /> Generar códigos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Promo Code Dialog */}
      <Dialog open={!!shareCode} onOpenChange={(o) => { if (!o) setShareCode(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Compartir código promocional
            </DialogTitle>
            <DialogDescription>
              Envía el código <span className="font-mono font-bold text-foreground">{shareCode}</span>
              {shareBatch && <> · <span className="text-foreground">{formatMoney(shareBatch.value, shareBatch.currency)} {shareBatch.description}</span></>}
            </DialogDescription>
          </DialogHeader>

          {shareSent ? (
            <div className="py-8 flex flex-col items-center text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-7 w-7" />
              </div>
              <div>
                <div className="font-bold text-foreground">¡Código enviado!</div>
                <div className="text-sm text-muted-foreground">Notificación enviada a @{shareUser?.username}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Event card */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
                {event.eventImage && (
                  <img src={event.eventImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-primary">Evento</div>
                  <div className="font-bold text-foreground truncate">{event.eventName}</div>
                  <div className="text-xs text-muted-foreground">{event.eventDate}{event.eventTime ? ` · ${event.eventTime}` : ''}</div>
                </div>
              </div>

              {/* User search */}
              <div className="space-y-2">
                <Label>Buscar usuario en DoEvents</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="@usuario o correo"
                    className="pl-9"
                    value={shareQuery}
                    onChange={(e) => { setShareQuery(e.target.value); setShareUser(null); }}
                  />
                </div>

                {!shareUser && (
                  <div className="rounded-xl border border-border divide-y divide-border max-h-56 overflow-y-auto">
                    {filteredUsers.length === 0 && (
                      <div className="p-3 text-center text-xs text-muted-foreground">Sin resultados</div>
                    )}
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setShareUser(u); setShareQuery(`@${u.username}`); }}
                        className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted/50 transition"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{u.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">@{u.username} · {u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {shareUser && (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{shareUser.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground truncate">{shareUser.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">@{shareUser.username} · {shareUser.email}</div>
                    </div>
                    <button
                      onClick={() => { setShareUser(null); setShareQuery(''); }}
                      className="text-xs text-primary font-semibold"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* Channels */}
              <div className="space-y-2">
                <Label>Canales de envío</Label>
                <p className="text-xs text-muted-foreground -mt-1">Selecciona uno o más medios.</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: 'mail' as ShareChannel, label: 'Mail', icon: Mail },
                    { id: 'whatsapp' as ShareChannel, label: 'WhatsApp', icon: MessageCircle },
                    { id: 'campana' as ShareChannel, label: 'Campana', icon: Bell },
                  ]).map(({ id, label, icon: Icon }) => {
                    const active = shareChannels.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleChannel(id)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${active ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                          <Icon className={`h-3.5 w-3.5 ${active ? 'text-primary-foreground' : 'text-primary'}`} />
                        </span>
                        {label}
                        {active && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mensaje</Label>
                  <span className="text-[11px] text-muted-foreground">{shareMessage.length}/200</span>
                </div>
                <Textarea
                  placeholder={`Hola, el organizador ${ORGANIZER_NAME} te ha compartido un código promocional para el evento ${event.eventName}. Ingresa, adquiere tus entradas y redime tu bono promocional.`}
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value.slice(0, 200))}
                  rows={4}
                />
                <div className="rounded-lg bg-muted/40 p-3 text-[12px] text-muted-foreground">
                  <div className="font-semibold text-foreground mb-1">Vista previa</div>
                  Hola, el organizador <span className="font-semibold text-foreground">{ORGANIZER_NAME}</span> te ha compartido un código promocional para el evento <span className="font-semibold text-foreground">{event.eventName}</span>. Ingresa, adquiere tus entradas y redime tu bono promocional.
                  <div className="mt-2 rounded-md bg-background border border-border px-2 py-1 font-mono text-foreground inline-block">{shareCode}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShareCode(null)}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSendShare} disabled={!shareUser || shareChannels.length === 0}>
                  <Send className="h-4 w-4 mr-1" /> Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Promo Code Dialog */}
      <Dialog open={!!cancelCode} onOpenChange={(o) => { if (!o) { setCancelCode(null); setCancelReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <Ban className="h-5 w-5" />
              Cancelar código promocional
            </DialogTitle>
            <DialogDescription>
              Estás a punto de inhabilitar el código <span className="font-mono font-bold text-foreground">{cancelCode}</span>
              {cancelBatch && <> · <span className="text-foreground">{formatMoney(cancelBatch.value, cancelBatch.currency)} {cancelBatch.description}</span></>}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-[12px] text-rose-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Una vez cancelado el código <span className="font-bold">no podrá ser redimido</span> ni compartido nuevamente. Esta acción queda registrada en el historial del evento.
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Ej: Compartido por error, código duplicado, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setCancelCode(null); setCancelReason(''); }}>
                Volver
              </Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-primary-foreground"
                onClick={handleConfirmCancel}
              >
                <Ban className="h-4 w-4 mr-1" /> Cancelar código
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesStatsView;