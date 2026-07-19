import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ticket, Copy, CheckCircle2, Circle, ChevronDown, ChevronUp,
  ShoppingBag, User as UserIcon, CalendarDays, Clock, Plus, X, Share2, Search,
  Mail, MessageCircle, Bell, Send, Check, History, Ban, AlertTriangle, Loader2,
} from 'lucide-react';
import StatsSectionBanner from './StatsSectionBanner';
import { Avatar, AvatarFallback, AvatarImage } from '@lovable/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@lovable/components/ui/dialog';
import { Input } from '@lovable/components/ui/input';
import { Label } from '@lovable/components/ui/label';
import { Button } from '@lovable/components/ui/button';
import { Textarea } from '@lovable/components/ui/textarea';
import { toast } from 'sonner';
import type { EventChatRoom } from '@lovable/data/chatData';
import type { PromoCodeBatch, PromoCurrency } from '@lovable/data/eventFormData';
import type { User } from '@lovable/data/';
import {
  cancelEventPromoCode,
  createEventPromoCodeBatch,
  fetchEventPromoCodes,
  searchUsers,
  shareEventPromoCode,
  emitNotificationsUpdated,
  getPersistedUserDisplayName,
  cancelServicePromoCode,
  createServicePromoCodeBatch,
  fetchServicePromoCodes,
  shareServicePromoCode,
  fetchVenuePromoCodes,
  shareVenuePromoCode,
  cancelVenuePromoCode,
  createVenuePromoCodeBatch,
  type PromoCodeCancellationRecord,
  type PromoCodeRedemptionRecord,
  type PromoCodeShareRecord,
} from '@doevents/shared';
import type { ServiceStatsItem } from './StatsServiceListView';

interface SearchableUser {
  id: string;
  name: string;
  username: string;
  email: string;
  initials: string;
  avatar?: string;
  phone?: string;
}

type ShareChannel = 'mail' | 'whatsapp' | 'campana';

interface PromoCodesStatsViewProps {
  event?: EventChatRoom;
  service?: ServiceStatsItem;
  venue?: { venueId: string; name: string; imageUrl?: string };
  embedded?: boolean;
  onBack: () => void;
  onViewProfile?: (user: User | { name: string; initials: string; id?: string }) => void;
}

const formatMoney = (v: number, currency: string) => {
  if (currency === 'COP' || currency === 'MXN' || currency === 'DOP') {
    return `${currency} $ ${v.toLocaleString('es-CO')}`;
  }
  return `${currency} ${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const formatShareDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRedeemedAtDisplay = (iso: string) => {
  if (!iso) return '— · —';
  if (iso.includes('·')) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const datePart = d
    .toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase();
  const timePart = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${datePart} · ${timePart}`;
};

const toInitials = (name: string) =>
  name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const resolveEventId = (event: EventChatRoom) => event.eventId || event.id;

const PromoCodesStatsView = ({ event, service, venue, embedded = false, onBack, onViewProfile }: PromoCodesStatsViewProps) => {
  const isVenue = Boolean(venue);
  const isService = Boolean(service) && !isVenue;
  const entityId = venue?.venueId ?? service?.serviceId ?? resolveEventId(event!);
  const entityName = venue?.name ?? service?.name ?? event!.eventName;
  const entityImage = venue?.imageUrl ?? service?.imageUrl ?? event?.eventImage;
  const codePrefixHint = isVenue ? 'DOV-XXXXXX' : isService ? 'DOS-XXXXXX' : 'DOE-XXXXXX';
  const organizerName = getPersistedUserDisplayName() || (isService ? 'Proveedor' : 'Organizador');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [batches, setBatches] = useState<PromoCodeBatch[]>([]);
  const [shares, setShares] = useState<PromoCodeShareRecord[]>([]);
  const [cancellations, setCancellations] = useState<PromoCodeCancellationRecord[]>([]);
  const [redemptions, setRedemptions] = useState<Record<string, PromoCodeRedemptionRecord>>({});

  const [createOpen, setCreateOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCurrency, setNewCurrency] = useState<PromoCurrency>('COP');
  const [newQuantity, setNewQuantity] = useState('');
  const [creating, setCreating] = useState(false);

  const [openBatchId, setOpenBatchId] = useState<string | null>(null);
  const [expandedRedemption, setExpandedRedemption] = useState<string | null>(null);
  const [expandedShares, setExpandedShares] = useState<string | null>(null);
  const [expandedCanceled, setExpandedCanceled] = useState<string | null>(null);

  const [cancelCode, setCancelCode] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);

  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareQuery, setShareQuery] = useState('');
  const [shareUser, setShareUser] = useState<SearchableUser | null>(null);
  const [shareChannels, setShareChannels] = useState<ShareChannel[]>(['mail', 'whatsapp', 'campana']);
  const [shareMessage, setShareMessage] = useState('');
  const [shareSent, setShareSent] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const loadPromoData = useCallback(async () => {
    if (!entityId) {
      setLoadError(isVenue ? 'Lugar no válido' : isService ? 'Servicio no válido' : 'Evento no válido');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = isVenue
        ? await fetchVenuePromoCodes(entityId)
        : isService
          ? await fetchServicePromoCodes(entityId)
          : await fetchEventPromoCodes(entityId);
      setBatches(data.batches);
      setShares(data.shares);
      setCancellations(data.cancellations);
      setRedemptions(data.redemptions);
      setOpenBatchId((prev) => prev ?? data.batches[0]?.id ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los códigos');
      setBatches([]);
      setShares([]);
      setCancellations([]);
      setRedemptions({});
    } finally {
      setLoading(false);
    }
  }, [entityId, isService, isVenue]);

  useEffect(() => {
    void loadPromoData();
  }, [loadPromoData]);

  useEffect(() => {
    const q = shareQuery.trim().replace(/^@/, '');
    if (!q || shareUser) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const users = await searchUsers(q);
        if (cancelled) return;
        setSearchResults(
          users
            .filter((u) => u.id)
            .slice(0, 6)
            .map((u) => {
              const digits = String(u.phone || u.phoneNumber || '').replace(/\D/g, '');
              const indicative = String(u.indicativo || '').replace(/\D/g, '');
              const phone =
                digits.length >= 10
                  ? (indicative && !digits.startsWith(indicative) ? `${indicative}${digits}` : digits)
                  : '';
              return {
                id: u.id!,
                name: u.name || u.email || 'Usuario',
                username: (u.username || u.email?.split('@')[0] || 'usuario').replace(/^@/, ''),
                email: u.email || '',
                initials: toInitials(u.name || u.email || 'U'),
                avatar: u.imagen,
                phone: phone || undefined,
              };
            }),
        );
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchingUsers(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [shareQuery, shareUser]);

  const sharesByCode = useMemo(() => {
    const map: Record<string, PromoCodeShareRecord[]> = {};
    shares.forEach((s) => {
      (map[s.promo_code] ||= []).push(s);
    });
    return map;
  }, [shares]);

  const cancellationByCode = useMemo(() => {
    const map: Record<string, PromoCodeCancellationRecord> = {};
    cancellations.forEach((c) => { map[c.promo_code] = c; });
    return map;
  }, [cancellations]);

  const cancelBatch = useMemo(
    () => batches.find((b) => b.codes.includes(cancelCode ?? '')) ?? null,
    [batches, cancelCode],
  );

  const shareBatch = useMemo(
    () => batches.find((b) => b.codes.includes(shareCode ?? '')) ?? null,
    [batches, shareCode],
  );

  type CodeStatus = 'USADO' | 'CANCELADO' | 'COMPARTIDO' | 'DISPONIBLE';
  const getStatus = (code: string): CodeStatus => {
    if (cancellationByCode[code]) return 'CANCELADO';
    if (redemptions[code]) return 'USADO';
    if ((sharesByCode[code] ?? []).length > 0) return 'COMPARTIDO';
    return 'DISPONIBLE';
  };

  const totalCodes = batches.reduce((sum, b) => sum + b.codes.length, 0);
  const totalUsed = Object.keys(redemptions).length;
  const totalAvailable = batches
    .flatMap((batch) => batch.codes)
    .filter((code) => getStatus(code) === 'DISPONIBLE').length;
  const totalDiscount = Object.values(redemptions).reduce((s, r) => s + r.discount, 0);

  const statusStyle: Record<CodeStatus, { badge: string; row: string; icon: string }> = {
    USADO: { badge: 'bg-emerald-100 text-emerald-700', row: 'border-emerald-200 bg-emerald-50/40', icon: 'text-emerald-600' },
    COMPARTIDO: { badge: 'bg-indigo-100 text-indigo-700', row: 'border-indigo-200 bg-indigo-50/40', icon: 'text-indigo-600' },
    CANCELADO: { badge: 'bg-rose-100 text-rose-700', row: 'border-rose-200 bg-rose-50/40 opacity-80', icon: 'text-rose-600' },
    DISPONIBLE: { badge: 'bg-muted text-muted-foreground', row: 'border-border bg-background', icon: 'text-muted-foreground' },
  };

  const channelLabel = (c: string) => (c === 'mail' ? 'Mail' : c === 'whatsapp' ? 'WhatsApp' : c === 'campana' ? 'Campana' : c);
  const channelIcon = (c: string) => (c === 'mail' ? Mail : c === 'whatsapp' ? MessageCircle : Bell);

  const resetForm = () => {
    setNewDescription('');
    setNewValue('');
    setNewCurrency('COP');
    setNewQuantity('');
  };

  const handleCreateBatch = async () => {
    const value = Number(newValue);
    const quantity = Number(newQuantity);
    const description = newDescription.trim();
    if (!description) return toast.error('Ingresa una etiqueta (ej: VIP, GENERAL)');
    if (!value || value <= 0) return toast.error('Ingresa un valor válido');
    if (!quantity || quantity <= 0 || quantity > 500) return toast.error('Cantidad entre 1 y 500');

    setCreating(true);
    try {
      const batch = isVenue
        ? await createVenuePromoCodeBatch(entityId, {
            description: description.toUpperCase(),
            value,
            quantity,
            currency: newCurrency,
          })
        : isService
        ? await createServicePromoCodeBatch(entityId, {
            description: description.toUpperCase(),
            value,
            quantity,
            currency: newCurrency,
          })
        : await createEventPromoCodeBatch(entityId, {
            description: description.toUpperCase(),
            value,
            quantity,
            currency: newCurrency,
          });
      setBatches((prev) => [...prev, batch]);
      setOpenBatchId(batch.id);
      setCreateOpen(false);
      resetForm();
      toast.success(`${quantity} códigos generados para ${description.toUpperCase()}`);
      void loadPromoData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el lote');
    } finally {
      setCreating(false);
    }
  };

  const openShare = (code: string) => {
    setShareCode(code);
    setShareUser(null);
    setShareQuery('');
    setShareChannels(['mail', 'whatsapp', 'campana']);
    setShareMessage('');
    setShareSent(false);
    setSearchResults([]);
  };

  const toggleChannel = (c: ShareChannel) => {
    setShareChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const handleSendShare = async () => {
    if (!shareUser) return toast.error('Selecciona un usuario');
    if (shareChannels.length === 0) return toast.error('Selecciona al menos un canal');
    if (!shareCode) return;

    const defaultMessage = isVenue
      ? `Hola, ${organizerName} te ha compartido un código promocional para el lugar ${entityName}. Ingresa, reserva y redime tu bono promocional.`
      : isService
      ? `Hola, ${organizerName} te ha compartido un código promocional para el servicio ${entityName}. Ingresa, reserva y redime tu bono promocional.`
      : `Hola, el organizador ${organizerName} te ha compartido un código promocional para el evento ${entityName}. Ingresa, adquiere tus entradas y redime tu bono promocional.`;
    const finalMessage = shareMessage.trim() || defaultMessage;

    setSharing(true);
    try {
      const sharePayload = {
        promo_code: shareCode,
        recipient_id: shareUser.id,
        recipient_name: shareUser.name,
        recipient_username: shareUser.username,
        recipient_email: shareUser.email,
        recipient_phone: shareUser.phone || null,
        channels: shareChannels,
        message: finalMessage,
        organizer_name: organizerName,
      };
      const share = isVenue
        ? await shareVenuePromoCode(entityId, sharePayload)
        : isService
        ? await shareServicePromoCode(entityId, sharePayload)
        : await shareEventPromoCode(entityId, sharePayload);
      setShares((prev) => [share, ...prev]);
      setShareSent(true);
      if (shareChannels.includes('campana')) emitNotificationsUpdated();
      const labels = shareChannels.map(channelLabel).join(', ');
      const warnings = Array.isArray((share as { warnings?: string[] }).warnings)
        ? (share as { warnings?: string[] }).warnings!
        : [];
      if (warnings.length) {
        toast.success(`Código enviado a @${shareUser.username} vía ${labels}`);
        warnings.forEach((w) => toast.error(w));
      } else {
        toast.success(`Código enviado a @${shareUser.username} vía ${labels}`);
      }
      setTimeout(() => setShareCode(null), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar el envío');
    } finally {
      setSharing(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelCode) return;
    setCanceling(true);
    try {
      const cancellation = isVenue
        ? await cancelVenuePromoCode(entityId, cancelCode, cancelReason.trim() || null)
        : isService
        ? await cancelServicePromoCode(entityId, cancelCode, cancelReason.trim() || null)
        : await cancelEventPromoCode(entityId, cancelCode, cancelReason.trim() || null);
      setCancellations((prev) => [cancellation, ...prev]);
      const recipients = sharesByCode[cancelCode] ?? [];
      if (recipients.length > 0) {
        emitNotificationsUpdated();
        toast.success(`Código ${cancelCode} cancelado · Notificación enviada a ${recipients.length} destinatario${recipients.length > 1 ? 's' : ''} (mail + campana)`);
      } else {
        toast.success(`Código ${cancelCode} cancelado`);
      }
      setCancelCode(null);
      setCancelReason('');
      void loadPromoData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cancelar el código');
    } finally {
      setCanceling(false);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  if (loading) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando códigos promocionales…</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 pb-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando códigos promocionales…</p>
      </div>
    );
  }

  if (loadError) {
    if (embedded) {
      return (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-destructive">{loadError}</p>
          <Button className="mt-3" size="sm" onClick={() => void loadPromoData()}>Reintentar</Button>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <StatsSectionBanner
          title="Códigos promocionales"
          subtitle={entityName}
          icon={Ticket}
          onBack={onBack}
        />
        <div className="mx-auto max-w-lg px-4 pt-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-sm font-semibold text-destructive">{loadError}</p>
          <Button className="mt-4" onClick={() => void loadPromoData()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-4' : 'min-h-screen bg-slate-50 pb-12'}>
      {embedded ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-foreground">Códigos promocionales</h3>
              <p className="text-xs text-muted-foreground truncate">{entityName}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-card px-2 py-2">
              <div className="text-lg font-bold text-foreground">{totalCodes}</div>
              <div className="text-[10px] text-muted-foreground">Generados</div>
            </div>
            <div className="rounded-xl bg-card px-2 py-2">
              <div className="text-lg font-bold text-foreground">{totalUsed}</div>
              <div className="text-[10px] text-muted-foreground">Redimidos</div>
            </div>
            <div className="rounded-xl bg-card px-2 py-2">
              <div className="text-lg font-bold text-foreground">{totalAvailable}</div>
              <div className="text-[10px] text-muted-foreground">Disponibles</div>
            </div>
          </div>
        </div>
      ) : (
        <StatsSectionBanner
          title="Códigos promocionales"
          subtitle={entityName}
          icon={Ticket}
          onBack={onBack}
          stats={[
            { value: totalCodes, label: 'Generados' },
            { value: totalUsed, label: 'Redimidos' },
            { value: totalAvailable, label: 'Disponibles' },
          ]}
          summary={
            <>
              Descuento aplicado:{' '}
              <span className="font-bold">{formatMoney(totalDiscount, batches[0]?.currency ?? 'COP')}</span>
            </>
          }
        />
      )}

      <div className={embedded ? 'space-y-4' : 'mx-auto max-w-lg space-y-4 px-4 pt-5'}>
        {!embedded && (
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold py-3 shadow-sm hover:bg-primary/90 transition"
        >
          <Plus className="h-5 w-5" />
          Crear códigos promocionales
        </button>
        )}

        {batches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-primary/25 bg-card p-8 text-center">
            <Ticket className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Sin códigos promocionales</p>
            <p className="mt-1 text-xs text-muted-foreground">Crea un lote para generar códigos {codePrefixHint}.</p>
          </div>
        )}

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
                    const redeemedAtDisplay = r ? formatRedeemedAtDisplay(r.redeemedAt) : '';
                    return (
                      <div key={code} className={`rounded-xl border ${style.row} overflow-hidden`}>
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
                              const recipientInitials = toInitials(s.recipient_name);
                              return (
                                <div key={s.id} className="rounded-lg bg-card border border-indigo-100 p-2.5 space-y-1.5">
                                  <button
                                    onClick={() => onViewProfile?.({ id: s.recipient_id, name: s.recipient_name, initials: recipientInitials })}
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
                                <span>{redeemedAtDisplay.split(' · ')[0]}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{redeemedAtDisplay.split(' · ')[1]}</span>
                              </div>
                            </div>

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

                            <button
                              onClick={() => onViewProfile?.({ id: r.user.id, name: r.user.name, initials: r.user.initials })}
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
              Se asociarán automáticamente {isService ? 'al servicio' : 'al evento'}{' '}
              <span className="font-semibold text-foreground">{entityName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="promo-desc">Etiqueta del lote</Label>
              <Input id="promo-desc" placeholder="Ej: VIP, GENERAL, EARLY" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} maxLength={20} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="promo-value">Valor del descuento</Label>
                <Input id="promo-value" type="number" inputMode="numeric" placeholder="50000" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-currency">Moneda</Label>
                <select id="promo-currency" value={newCurrency} onChange={(e) => setNewCurrency(e.target.value as PromoCurrency)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
              <Input id="promo-qty" type="number" inputMode="numeric" placeholder="10" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} min={1} max={500} />
              <p className="text-[11px] text-muted-foreground">Máximo 500 códigos por lote. Formato: {codePrefixHint}.</p>
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
              <Button className="flex-1" onClick={() => void handleCreateBatch()} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Generar códigos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
                {entityImage && (
                  <img src={entityImage} alt="" className="h-14 w-14 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-primary">{isService ? 'Servicio' : 'Evento'}</div>
                  <div className="font-bold text-foreground truncate">{entityName}</div>
                  {!isService && event && (
                    <div className="text-xs text-muted-foreground">{event.eventDate}{event.eventTime ? ` · ${event.eventTime}` : ''}</div>
                  )}
                </div>
              </div>

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
                    {searchingUsers && (
                      <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando…
                      </div>
                    )}
                    {!searchingUsers && searchResults.length === 0 && shareQuery.trim() && (
                      <div className="p-3 text-center text-xs text-muted-foreground">Sin resultados</div>
                    )}
                    {!searchingUsers && !shareQuery.trim() && (
                      <div className="p-3 text-center text-xs text-muted-foreground">Escribe @usuario o correo</div>
                    )}
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setShareUser(u); setShareQuery(`@${u.username}`); }}
                        className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-muted/50 transition"
                      >
                        <Avatar className="h-9 w-9">
                          {u.avatar && <AvatarImage src={u.avatar} />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{u.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">@{u.username}{u.email ? ` · ${u.email}` : ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {shareUser && (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                    <Avatar className="h-9 w-9">
                      {shareUser.avatar && <AvatarImage src={shareUser.avatar} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{shareUser.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground truncate">{shareUser.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">@{shareUser.username}{shareUser.email ? ` · ${shareUser.email}` : ''}</div>
                    </div>
                    <button onClick={() => { setShareUser(null); setShareQuery(''); }} className="text-xs text-primary font-semibold">
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Canales de envío</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Por defecto se envía por Mail, WhatsApp y Campana. Desmarca solo si no quieres algún canal.
                </p>
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
                          active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mensaje</Label>
                  <span className="text-[11px] text-muted-foreground">{shareMessage.length}/200</span>
                </div>
                <Textarea
                  placeholder={isService
                    ? `Hola, ${organizerName} te ha compartido un código promocional para el servicio ${entityName}. Ingresa, reserva y redime tu bono promocional.`
                    : `Hola, el organizador ${organizerName} te ha compartido un código promocional para el evento ${entityName}. Ingresa, adquiere tus entradas y redime tu bono promocional.`}
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value.slice(0, 200))}
                  rows={4}
                />
                <div className="rounded-lg bg-muted/40 p-3 text-[12px] text-muted-foreground">
                  <div className="font-semibold text-foreground mb-1">Vista previa</div>
                  Hola, {isService ? '' : 'el organizador '}
                  <span className="font-semibold text-foreground">{organizerName}</span> te ha compartido un código promocional para {isService ? 'el servicio' : 'el evento'}{' '}
                  <span className="font-semibold text-foreground">{entityName}</span>.
                  {isService ? ' Ingresa, reserva y redime tu bono promocional.' : ' Ingresa, adquiere tus entradas y redime tu bono promocional.'}
                  <div className="mt-2 rounded-md bg-background border border-border px-2 py-1 font-mono text-foreground inline-block">{shareCode}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShareCode(null)}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button className="flex-1" onClick={() => void handleSendShare()} disabled={!shareUser || shareChannels.length === 0 || sharing}>
                  {sharing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                Una vez cancelado el código <span className="font-bold">no podrá ser redimido</span> ni compartido nuevamente. Esta acción queda registrada en el historial {isService ? 'del servicio' : 'del evento'}.
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
              <Textarea id="cancel-reason" placeholder="Ej: Compartido por error, código duplicado, etc." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setCancelCode(null); setCancelReason(''); }}>
                Volver
              </Button>
              <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-primary-foreground" onClick={() => void handleConfirmCancel()} disabled={canceling}>
                {canceling ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />}
                Cancelar código
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesStatsView;
