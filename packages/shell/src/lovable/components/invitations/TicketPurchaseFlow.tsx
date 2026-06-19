import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Home as HomeIcon,
  MapPin,
  Grid3x3,
  Maximize2,
  X,
  Minus,
  Plus,
  Trash2,
  Info,
  Armchair,
  Pencil,
  CreditCard,
  Loader2,
  
  ShieldCheck,
  Smile,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { toast } from 'sonner';
import { InvitationEvent } from '@lovable/data/invitationsData';
import { addTickets, Ticket } from '@lovable/data/ticketsData';
import { useNotifyPurchase } from '@lovable/lib/useNotifyPurchase';

interface Props {
  event: InvitationEvent;
  onBack: () => void;
  onSuccess?: () => void;
  onPurchaseEnd?: () => void;
}

interface SeatCategory {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  color: string; // bg class for available
  rows: number;
  cols: number;
}

const CATEGORIES: SeatCategory[] = [
  { id: 'platea',     name: 'Platea',      subtitle: 'Sillas Platea principal',  price: 250000, color: 'bg-sky-300',     rows: 8,  cols: 16 },
  { id: 'palco',      name: 'Palco VIP',   subtitle: 'Sillas Palco VIP',          price: 350000, color: 'bg-indigo-300',  rows: 4,  cols: 12 },
  { id: 'gradas-n',   name: 'Gradas Norte','subtitle': 'Sillas graderías Norte',  price: 120000, color: 'bg-emerald-200', rows: 10, cols: 14 } as any,
  { id: 'gradas-s',   name: 'Gradas Sur',  subtitle: 'Sillas graderías Sur',      price: 150000, color: 'bg-emerald-200', rows: 10, cols: 14 },
];

// Pre-mark some seats as taken so the map looks real
const takenSet = new Set<string>([
  'platea-2-5', 'platea-2-6', 'platea-3-7', 'palco-1-3',
  'gradas-s-4-2', 'gradas-s-4-3', 'gradas-n-9-12',
]);

const fmt = (n: number) => `$ ${n.toLocaleString('es-CO')}`;

type SelectedSeat = { categoryId: string; row: number; col: number; label: string; price: number };

type Step = 'seatmap' | 'fullmap' | 'confirm' | 'auth' | 'payment' | 'processing' | 'success';
type AuthOption = 'knows' | 'unknown';

const seatLabel = (row: number, col: number) =>
  `${String.fromCharCode(64 + row)}${col}`;

/** @deprecated Usar `/events/:id/checkout` (LovableTicketCheckout). Solo fallback sin event.id. */
const TicketPurchaseFlow = ({ event, onBack, onSuccess, onPurchaseEnd }: Props) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (event.id) {
      navigate(`/events/${event.id}/checkout`, { replace: true });
    }
  }, [event.id, navigate]);

  if (event.id) {
    return null;
  }
  const notifyPurchase = useNotifyPurchase();
  const [step, setStep] = useState<Step>('seatmap');
  const [activeCat, setActiveCat] = useState<string>(CATEGORIES[0].id);
  const [selected, setSelected] = useState<SelectedSeat[]>([]);
  const [zoom, setZoom] = useState(100);
  const [promo, setPromo] = useState('');
  const [showVenueImgs, setShowVenueImgs] = useState(true);

  // Auth modal state
  const [authChoice, setAuthChoice] = useState<AuthOption>('unknown');
  const [infoModal, setInfoModal] = useState<AuthOption | null>(null);
  const [feeInfo, setFeeInfo] = useState<'with' | 'without' | null>(null);
  const [confirmKnows, setConfirmKnows] = useState(false);

  // Payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Countdown
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  // Wompi-style buyer info + transaction metadata
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerDoc, setBuyerDoc] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [acceptedData, setAcceptedData] = useState(true);
  const [paymentSubStep, setPaymentSubStep] = useState<'buyer' | 'card'>('buyer');
  const [txnRef] = useState(() => 'test_' + Math.random().toString(36).slice(2, 8));
  const [txnId] = useState(() => `${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(1000000000 + Math.random() * 9000000000)}-${Math.floor(10000 + Math.random() * 90000)}`);
  const orderNumber = txnRef;
  const todayStr = useMemo(() => {
    const d = new Date();
    const p = (n: number) => n.toString().padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  }, []);
  const nowTimeStr = useMemo(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  // Push generated tickets into the global store the first time we reach success
  const [pushed, setPushed] = useState(false);
  useEffect(() => {
    if (step === 'success' && !pushed && selected.length > 0) {
      const generated: Ticket[] = selected.map((s, idx) => {
        const cat = CATEGORIES.find((c) => c.id === s.categoryId)!;
        return {
          id: `${txnRef}-${idx}`,
          orderNumber,
          orderDate: todayStr,
          eventTitle: event.title,
          eventImage: event.image,
          eventDate: event.startDate,
          startTime: event.startTime,
          category: cat.name,
          seat: `Silla - ${s.label}`,
          entrance: 'Entrando Lateral Derecha',
          qrCode: `${Date.now()}${idx.toString().padStart(4, '0')}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
          status: 'aprobada',
        };
      });
      addTickets(generated);
      setPushed(true);
      const sub = selected.reduce((a, s) => a + s.price, 0);
      const tot = sub + Math.round(sub * 0.10);
      notifyPurchase({
        kind: 'ticket',
        itemName: event.title,
        sellerName: 'Organizador',
        amount: `$ ${tot.toLocaleString('es-CO')}`,
      });
    }
  }, [step, pushed, selected, event, orderNumber, todayStr, txnRef, notifyPurchase]);

  useEffect(() => {
    if (step === 'confirm' || step === 'auth' || step === 'payment') {
      const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
      return () => clearInterval(t);
    }
  }, [step]);
  const timeStr = useMemo(() => {
    const h = Math.floor(secondsLeft / 3600).toString().padStart(2, '0');
    const m = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    return { h, m, s };
  }, [secondsLeft]);

  const subtotal = selected.reduce((acc, s) => acc + s.price, 0);
  const serviceFee = Math.round(subtotal * 0.10); // 10% display
  const total = subtotal + serviceFee;

  const toggleSeat = (cat: SeatCategory, row: number, col: number) => {
    const key = `${cat.id}-${row}-${col}`;
    if (takenSet.has(key)) return;
    setSelected((prev) => {
      const exists = prev.find((s) => s.categoryId === cat.id && s.row === row && s.col === col);
      if (exists) return prev.filter((s) => s !== exists);
      return [...prev, { categoryId: cat.id, row, col, label: seatLabel(row, col), price: cat.price }];
    });
  };

  const removeSeat = (s: SelectedSeat) => setSelected((prev) => prev.filter((x) => x !== s));

  const selectedByCat = useMemo(() => {
    const m = new Map<string, SelectedSeat[]>();
    selected.forEach((s) => {
      const arr = m.get(s.categoryId) || [];
      arr.push(s);
      m.set(s.categoryId, arr);
    });
    return m;
  }, [selected]);

  // ─────────────────────────────────────────────
  // STEP: SEAT MAP PREVIEW
  // ─────────────────────────────────────────────
  const renderSeatGrid = (cat: SeatCategory, opts: { interactive?: boolean; small?: boolean } = {}) => {
    const { interactive = false, small = false } = opts;
    const seatSize = small ? 'h-3 w-3' : 'h-5 w-5 sm:h-6 sm:w-6';
    return (
      <div className="flex flex-col items-center gap-1">
        {Array.from({ length: cat.rows }).map((_, ri) => {
          const row = ri + 1;
          return (
            <div key={row} className="flex gap-[2px]">
              {Array.from({ length: cat.cols }).map((_, ci) => {
                const col = ci + 1;
                const key = `${cat.id}-${row}-${col}`;
                const isTaken = takenSet.has(key);
                const isSel = selected.some((s) => s.categoryId === cat.id && s.row === row && s.col === col);
                const base = isTaken
                  ? 'bg-foreground/70'
                  : isSel
                  ? 'bg-primary ring-1 ring-primary-foreground'
                  : cat.color;
                return interactive ? (
                  <button
                    key={col}
                    onClick={() => toggleSeat(cat, row, col)}
                    disabled={isTaken}
                    className={`${seatSize} rounded-[2px] ${base} flex items-center justify-center text-[6px] sm:text-[8px] font-bold text-foreground/70 disabled:cursor-not-allowed`}
                    title={`${cat.name} · ${seatLabel(row, col)}`}
                  >
                    <span className="leading-none">{small ? '' : seatLabel(row, col)}</span>
                  </button>
                ) : (
                  <span key={col} className={`${seatSize} rounded-[2px] ${base}`} />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ─────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="mx-auto max-w-lg pb-32 min-h-screen bg-[#EEF0FB]">
        <div className="px-5 pt-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-emerald-500">
            <Smile className="h-12 w-12 text-emerald-500" strokeWidth={2.2} />
          </div>
          <h1 className="mt-3 text-3xl font-extrabold text-emerald-500">¡Estupendo!</h1>
          <p className="mt-3 text-sm text-foreground">Tu pago ha sido aprobado exitosamente</p>
          <p className="text-sm text-foreground">Ya tienes tu boleta para el siguiente evento</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Recuerda, para acceder al chat del evento debes registrarte en<br />nuestra app.
          </p>
        </div>

        <h2 className="mt-6 px-5 text-2xl font-extrabold text-primary leading-tight">{event.title}</h2>

        {/* Fecha + Hora */}
        <div className="mt-4 px-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary">📅</span>
              <p className="font-bold text-sm">Fecha</p>
            </div>
            <p className="text-[11px] text-muted-foreground">Inicio</p>
            <p className="text-sm font-bold">{event.startDate}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Finalización</p>
            <p className="text-sm font-bold">{event.endDate}</p>
          </div>
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary">🕐</span>
              <p className="font-bold text-sm">Hora</p>
            </div>
            <p className="text-[11px] text-muted-foreground">Inicio</p>
            <p className="text-sm font-bold">{event.startTime}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Finalización</p>
            <p className="text-sm font-bold">{event.endTime}</p>
          </div>
        </div>

        {/* Venue */}
        <div className="mt-3 px-5">
          <div className="rounded-2xl bg-card p-4 shadow-sm flex gap-3">
            <HomeIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-sm leading-snug">{event.venue.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lugar con capacidad para {event.capacity} personas
              </p>
            </div>
          </div>
        </div>

        {/* Orden de compra */}
        <div className="mt-4 px-5">
          <div className="rounded-3xl bg-primary/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-extrabold text-foreground">Orden de compra</p>
              <p className="text-sm text-muted-foreground">N° {orderNumber}</p>
            </div>

            <div className="space-y-4">
              {selected.map((s, idx) => {
                const cat = CATEGORIES.find((c) => c.id === s.categoryId)!;
                const qrData = `${event.title}|${orderNumber}|${cat.name}|${s.label}`;
                const qrCode = `${Date.now().toString().slice(-10)}${idx.toString().padStart(4, '0')}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(qrData)}`;
                return (
                  <div key={`${s.categoryId}-${s.row}-${s.col}`} className="rounded-2xl bg-card p-3 shadow-sm">
                    <img src={event.image} alt={event.title} className="w-full h-32 rounded-xl object-cover" />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Categoría</p>
                        <span className="inline-block rounded-full bg-amber-200/70 px-3 py-1 text-[11px] font-semibold text-amber-900 mt-1">
                          {cat.name}
                        </span>
                        <p className="text-sm font-bold mt-2">Silla - {s.label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">Puerta de ingreso</p>
                        <p className="text-sm font-bold leading-snug">Entrando Lateral Derecha</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Fecha</p>
                        <p className="text-sm font-bold">📅 {event.startDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">Hora inicio</p>
                        <p className="text-sm font-bold">🕐 {event.startTime}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center mt-3">
                      <img src={qrUrl} alt="QR" className="w-44 h-44" />
                      <p className="mt-2 text-sm font-mono tracking-wider">{qrCode}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky button */}
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-[#EEF0FB] border-t border-border">
          <div className="mx-auto max-w-lg">
            <Button
              variant="outline"
              className="w-full rounded-full border-2 border-primary text-primary font-semibold py-6"
              onClick={() => {
                onSuccess?.();
                onPurchaseEnd?.();
                onBack();
              }}
            >
              Finalizar compra
            </Button>
          </div>
        </div>
      </div>
    );
  }


  // ── PROCESSING ──
  if (step === 'processing') {
    return (
      <div className="mx-auto max-w-lg min-h-screen bg-background flex flex-col items-center justify-center px-6 space-y-5">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
        <p className="text-base font-bold text-foreground">Procesando pago...</p>
        <p className="text-sm text-muted-foreground">No cierres esta pantalla</p>
        <div className="w-full rounded-xl bg-card border border-border p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total a debitar</span>
            <span className="font-bold text-foreground">{fmt(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Método</span>
            <span className="font-medium">•••• {cardNumber.replace(/\s/g, '').slice(-4)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── FULL MAP ── (separate overlay)
  if (step === 'fullmap') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            onClick={() => setStep('seatmap')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Preview</p>
            <h2 className="text-lg font-extrabold">Vista completa del mapa</h2>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-muted/20">
          <div
            className="origin-top-left p-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', width: `${10000 / zoom}%` }}
          >
            <div className="space-y-6">
              {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-bold text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(cat.price)}</p>
                  </div>
                  {renderSeatGrid(cat, { interactive: true, small: false })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selection bar */}
        {selected.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{selected.length} silla(s) seleccionada(s)</p>
              <p className="text-base font-bold text-primary">{fmt(subtotal)}</p>
            </div>
            <Button
              className="w-full rounded-full py-5 text-sm font-semibold"
              onClick={() => setStep('confirm')}
            >
              Confirmar selección
            </Button>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-24 right-4 flex items-center gap-2 rounded-full bg-foreground text-background px-2 py-2 shadow-lg">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background/10"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold tabular-nums px-1">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(300, z + 25))}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-background/10"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── AUTH STEP ──
  if (step === 'auth') {
    return (
      <div className="mx-auto max-w-lg pb-32 min-h-screen bg-background">
        {/* Timer */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between rounded-2xl border-2 border-primary bg-card px-4 py-3">
            <span className="text-sm font-bold text-primary">Tiempo restante</span>
            <div className="text-right">
              <p className="text-xl font-extrabold text-foreground tabular-nums">
                {timeStr.h}:{timeStr.m}:{timeStr.s}
              </p>
              <div className="flex gap-3 justify-end text-[10px] text-muted-foreground">
                <span>Hr</span><span>Min</span><span>Seg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-6">
          <button
            onClick={() => setStep('confirm')}
            className="flex items-center gap-1 text-sm font-medium text-foreground mb-4"
          >
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <h1 className="text-2xl font-extrabold text-primary leading-tight">
            Autorización del pago de mi boleta al organizador del evento
          </h1>
          <p className="mt-3 text-sm text-foreground">
            Selecciona una de las opciones para continuar con el pago de tus entradas y garantizar una compra
            transparente.
          </p>

          <div className="mt-6 space-y-4">
            {([
              { id: 'knows' as AuthOption,   text: 'Conozco al creador del evento, autorizo la transferencia del pago inmediato de mi boleta.' },
              { id: 'unknown' as AuthOption, text: 'No conozco al creador del evento, autorizo la transferencia del pago de mi boleta, después de finalizado el evento.' },
            ]).map((opt) => (
              <div key={opt.id} className="flex items-start gap-3">
                <button
                  onClick={() => setAuthChoice(opt.id)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    authChoice === opt.id ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {authChoice === opt.id && <span className="h-3 w-3 rounded-full bg-primary" />}
                </button>
                <p className="flex-1 text-sm text-foreground">{opt.text}</p>
                <button
                  onClick={() => setInfoModal(opt.id)}
                  className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-primary"
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-background border-t border-border">
          <div className="mx-auto max-w-lg">
            <Button
              className="w-full rounded-full py-6 text-base font-semibold"
              onClick={() => {
                if (authChoice === 'knows') {
                  setConfirmKnows(true);
                } else {
                  setStep('payment');
                }
              }}
            >
              Continuar
            </Button>
          </div>
        </div>

        {/* Info modal */}
        {infoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-6">
            <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary mb-3">
                <Info className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-foreground">
                {infoModal === 'unknown' ? (
                  <>Al seleccionar esta opción, evitas el riesgo de fraude, ya que la plataforma garantiza la devolución del dinero en caso de que el evento no se realice.</>
                ) : (
                  <>Al seleccionar esta opción, tu pago se transferirá <strong>directamente al organizador antes del evento</strong>. Esto permite que reciba los fondos de manera anticipada para los preparativos.</>
                )}
              </p>
              <Button
                variant="outline"
                className="mt-5 w-full rounded-full border-2 border-primary text-primary font-semibold"
                onClick={() => setInfoModal(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Confirm "knows" modal */}
        {confirmKnows && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-6">
            <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-3">
                <Smile className="h-9 w-9 text-emerald-600" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground">¡Perfecto! conoces al organizador</h3>
              <p className="mt-3 text-sm text-foreground">
                Al seleccionar esta opción, tu pago se transferirá{' '}
                <strong>directamente al organizador antes de evento</strong>. Esto permite que reciba los
                fondos de manera anticipada para los preparativos.
              </p>
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-3 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-bold text-primary">Tu seguridad es importante</p>
                </div>
                <p className="text-xs text-foreground">
                  Te recomendamos esta opción solo si confías en el organizador. En caso de cancelación, el
                  reembolso dependerá directamente del organizador del evento.
                </p>
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">
                ¿Estás seguro de continuar con esta modalidad de pago?
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  className="w-full rounded-full py-5 text-sm font-semibold"
                  onClick={() => { setConfirmKnows(false); setStep('payment'); }}
                >
                  Si, Continuar
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-2 border-primary text-primary font-semibold py-5"
                  onClick={() => setConfirmKnows(false)}
                >
                  No, Revisar opciones
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── PAYMENT STEP (Wompi-style) ──
  if (step === 'payment') {
    const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    const formatExp = (v: string) => {
      const d = v.replace(/\D/g, '').slice(0, 4);
      return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    };
    const cardValid = cardNumber.replace(/\s/g, '').length >= 13 && cardName.trim().length > 2 && cardExpiry.length === 5 && cardCvv.length >= 3 && buyerDoc.length >= 5 && acceptedTerms && acceptedData;
    const buyerValid = buyerName.trim().length > 2 && /.+@.+\..+/.test(buyerEmail) && buyerPhone.length >= 7;
    const timerLow = secondsLeft < 6 * 60;

    return (
      <div className="mx-auto max-w-lg pb-32 min-h-screen bg-[#EEF0FB]">
        {/* Timer header */}
        <div className="px-4 pt-4">
          <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${timerLow ? 'bg-rose-100 border-2 border-rose-400' : 'bg-card border-2 border-primary'}`}>
            <span className={`text-sm font-bold ${timerLow ? 'text-rose-600' : 'text-primary'}`}>Tiempo restante</span>
            <div className="text-right">
              <p className={`text-xl font-extrabold tabular-nums ${timerLow ? 'text-rose-600' : 'text-foreground'}`}>
                {timeStr.h}:{timeStr.m}:{timeStr.s}
              </p>
              <div className="flex gap-3 justify-end text-[10px] text-muted-foreground">
                <span>Hr</span><span>Min</span><span>Seg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total bar */}
        <div className="mt-4 bg-[#6366E5] text-white px-5 py-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] opacity-80">{txnRef}</p>
            <p className="text-sm font-medium">Total a pagar</p>
          </div>
          <p className="text-xl font-extrabold">COP {fmt(total).replace('$ ', '$')}</p>
        </div>

        {/* MODO DE PRUEBAS */}
        <div className="bg-rose-100 py-2 flex justify-center" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(244,63,94,0.08) 0 8px, transparent 8px 16px)' }}>
          <span className="rounded bg-rose-600 px-3 py-1 text-[11px] font-bold text-white tracking-wider">MODO DE PRUEBAS</span>
        </div>

        {/* Merchant block (only on buyer sub-step) */}
        {paymentSubStep === 'buyer' && (
          <div className="bg-emerald-50/40 px-5 py-6 text-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background font-extrabold mb-2">W</span>
            <p className="text-sm text-muted-foreground">Pago a</p>
            <p className="text-xl font-extrabold text-foreground">Do.Events Software SAS</p>
            <button className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> Información del comercio
              <span className="text-xs">▾</span>
            </button>
            <p className="mt-3 text-xs font-semibold underline">Ver más</p>
          </div>
        )}

        {/* Payment method strip */}
        <div className="px-4 mt-5">
          <p className="text-sm font-bold mb-2">{paymentSubStep === 'buyer' ? 'Estás pagando con:' : 'Cambiar método de pago'}</p>
          <div className="flex items-center justify-between rounded-2xl border-2 border-primary/40 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
                <CreditCard className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">Tarjeta débito o crédito</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <span className="rounded bg-white px-1.5 py-0.5 text-blue-700 border">VISA</span>
              <span className="rounded bg-white px-1.5 py-0.5 text-red-600 border">MC</span>
              <span className="rounded bg-blue-700 px-1.5 py-0.5 text-white">AMEX</span>
            </div>
          </div>
          <p className="mt-2 text-center text-sm font-medium underline">Cambiar método de pago</p>
        </div>

        {/* BUYER SUB-STEP */}
        {paymentSubStep === 'buyer' && (
          <div className="px-4 mt-5 space-y-4">
            <p className="font-bold">Ingresa datos del comprador</p>
            <div>
              <label className="text-xs">Nombres y Apellidos</label>
              <Input className="mt-1" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">Correo electrónico</label>
              <Input className="mt-1" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">Número de celular</label>
              <div className="mt-1 grid grid-cols-[80px_1fr] gap-2">
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-2 text-sm">+57 ▾</div>
                <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" />
              </div>
            </div>

            <Button
              disabled={!buyerValid}
              className="w-full rounded-full bg-foreground text-background py-6 text-base font-semibold gap-2 hover:bg-foreground/90"
              onClick={() => setPaymentSubStep('card')}
            >
              <ShieldCheck className="h-4 w-4 text-yellow-300" />
              <span className="text-yellow-300">Continuar con tu pago</span>
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> PAGOS SEGUROS POR <span className="font-extrabold text-foreground">W Wompi</span>
            </div>
          </div>
        )}

        {/* CARD SUB-STEP */}
        {paymentSubStep === 'card' && (
          <div className="px-4 mt-5 space-y-4">
            <p className="font-bold">Ingresa los datos de la tarjeta</p>
            <div>
              <label className="text-xs">Número de la tarjeta</label>
              <Input className="mt-1" placeholder="•••• •••• •••• 4242" value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} inputMode="numeric" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs">Fecha de expiración</label>
                <Input className="mt-1" placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(formatExp(e.target.value))} inputMode="numeric" maxLength={5} />
              </div>
              <div>
                <label className="text-xs">Código de seguridad</label>
                <Input className="mt-1" placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" type="password" maxLength={4} />
              </div>
            </div>
            <div>
              <label className="text-xs">Nombre del titular</label>
              <Input className="mt-1" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="text-xs">Documento del titular</label>
              <div className="mt-1 grid grid-cols-[90px_1fr] gap-2">
                <div className="flex items-center justify-between rounded-md border border-border bg-background px-2 text-sm">CC ▾</div>
                <Input value={buyerDoc} onChange={(e) => setBuyerDoc(e.target.value.replace(/\D/g, '').slice(0, 12))} inputMode="numeric" />
              </div>
            </div>
            <div>
              <label className="text-xs">¿En cuántas cuotas deseas pagar?</label>
              <div className="mt-1 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                <span>Total {fmt(total)}</span>
                <span>▾</span>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-500" />
              <span>Acepto haber leído <span className="underline font-semibold">el reglamento</span>.</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={acceptedData} onChange={(e) => setAcceptedData(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-500" />
              <span>Acepto la <span className="underline font-semibold">autorización para la administración de datos personales</span> y conozco la <span className="underline font-semibold">política para el tratamiento de datos personales</span>.</span>
            </label>

            <Button
              disabled={!cardValid}
              className="w-full rounded-full bg-foreground text-background py-6 text-base font-semibold gap-2 hover:bg-foreground/90"
              onClick={() => {
                setStep('processing');
                setTimeout(() => setStep('success'), 2500);
              }}
            >
              <ShieldCheck className="h-4 w-4 text-yellow-300" />
              <span className="text-yellow-300">Continuar con tu pago</span>
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full border border-border py-5 text-sm font-medium"
              onClick={() => setPaymentSubStep('buyer')}
            >
              ← Volver
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="h-3.5 w-3.5" /> PAGOS SEGUROS POR <span className="font-extrabold text-foreground">W Wompi</span>
            </div>
            <p className="text-center text-xs text-muted-foreground">⊜ Grupo <span className="font-bold">Cibest</span></p>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-[#6366E5] text-white text-center">
          <button onClick={() => setStep('auth')} className="text-sm font-semibold w-full">
            No deseo continuar
          </button>
        </div>
      </div>
    );
  }

  // ── SUCCESS-LIKE WOMPI APPROVED SCREEN is handled inside success step ──
  // (txnId is exposed for future use)
  void txnId;



  // ── CONFIRM STEP ──
  if (step === 'confirm') {
    return (
      <div className="mx-auto max-w-lg pb-32 min-h-screen bg-background">
        <div className="px-4 pt-4">
          <button onClick={() => setStep('seatmap')} className="flex items-center gap-1 text-sm font-medium text-foreground mb-3">
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
          <p className="text-base font-bold text-primary">Confirmación de boletería</p>
          <h1 className="text-2xl font-extrabold text-foreground leading-tight">{event.title}</h1>

          {selected.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-card p-8 text-center text-muted-foreground">
              No has seleccionado boletas.
            </div>
          ) : (
            Array.from(selectedByCat.entries()).map(([catId, seats]) => {
              const cat = CATEGORIES.find((c) => c.id === catId)!;
              return (
                <div key={catId} className="mt-5 rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-lg font-extrabold text-primary">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
                      </div>
                    </div>
                    <button onClick={() => setStep('fullmap')} className="text-foreground">
                      <Pencil className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Sillas seleccionadas</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Armchair className="h-4 w-4 text-primary" />
                        <span className="text-base font-bold text-foreground">{seats.length}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Precio</p>
                      <p className="text-base font-bold text-foreground">{fmt(cat.price)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-bold">Sillas ({seats.length})</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {seats.map((s) => (
                      <button
                        key={`${s.row}-${s.col}`}
                        onClick={() => removeSeat(s)}
                        className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 p-2 text-foreground"
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                        <span className="text-xs font-medium">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <Button
            variant="outline"
            className="mt-5 w-full rounded-full border-2 border-primary text-primary font-semibold py-6"
            onClick={() => setStep('fullmap')}
          >
            Agregar otra boleta
          </Button>

          <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-sm font-bold">Código promocional</p>
            <Input
              className="mt-2 border-0 border-b rounded-none focus-visible:ring-0 px-0"
              placeholder="Ingresa el código promocional"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
            />
          </div>

          <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm space-y-2">
            <div className="grid grid-cols-3 text-sm font-bold pb-1">
              <span>Categoría</span>
              <span className="text-center"># Boletas</span>
              <span className="text-right">Valor</span>
            </div>
            {Array.from(selectedByCat.entries()).map(([catId, seats]) => {
              const cat = CATEGORIES.find((c) => c.id === catId)!;
              return (
                <div key={catId} className="grid grid-cols-3 text-sm border-t border-dashed border-border py-2">
                  <div>
                    <p>{cat.name}</p>
                    <p className="text-xs text-primary">{cat.subtitle}</p>
                  </div>
                  <span className="text-center text-muted-foreground">x{seats.length}</span>
                  <span className="text-right font-medium">{fmt(seats.length * cat.price)}</span>
                </div>
              );
            })}
            <div className="flex justify-between text-sm border-t border-dashed border-border pt-2">
              <span>Boletas</span>
              <span>{selected.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => setFeeInfo('with')} className="flex items-center gap-1 text-left">
                Cargo por servicio (~10%) <Info className="h-4 w-4 text-primary" />
              </button>
              <span>{fmt(serviceFee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => setFeeInfo('without')} className="flex items-center gap-1 text-left">
                Sub total <Info className="h-4 w-4 text-primary" />
              </button>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-dashed border-border pt-2">
              <span>Total</span>
              <span className="text-primary text-xl">{fmt(total)}</span>
            </div>
          </div>

          {/* Timer */}
          <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-primary bg-card px-4 py-3">
            <span className="text-sm font-bold text-primary">Tiempo restante</span>
            <div className="text-right">
              <p className="text-xl font-extrabold tabular-nums">
                {timeStr.h}:{timeStr.m}:{timeStr.s}
              </p>
              <div className="flex gap-3 justify-end text-[10px] text-muted-foreground">
                <span>Hr</span><span>Min</span><span>Seg</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-card p-4 shadow-sm text-center">
            <p className="text-base font-bold">Tus boletas te esperan... pero solo por 15 minutos más</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Asegúrate de revisar todos los detalles antes de finalizar. Una vez que confirmes tu compra,
              recibirás un correo electrónico con todos los detalles. ¡No te lo pierdas!
            </p>
            <p className="mt-3 text-sm font-bold">¡No te lo pierdas!</p>
            <p className="text-xs text-muted-foreground">Si necesitas ayuda, no dudes en contactarnos.</p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-background border-t border-border">
          <div className="mx-auto max-w-lg">
            <Button
              disabled={selected.length === 0}
              className="w-full rounded-full py-6 text-base font-semibold"
              onClick={() => setStep('auth')}
            >
              Continuar
            </Button>
          </div>
        </div>

        {feeInfo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
            onClick={() => setFeeInfo(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary">
                <Info className="h-8 w-8 text-primary" />
              </div>
              {feeInfo === 'with' ? (
                <>
                  <p className="text-lg font-bold text-primary">Boletas más comisión</p>
                  <p className="mt-2 text-sm text-foreground">Cargo por servicio por boleto comprado:</p>
                  <p className="mt-2 text-base font-bold text-primary">8% + $1.500 + IVA</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Fórmula aproximada: (valor boleta × 8%) + $1.500 + IVA (19%) ≈ 10% del valor de la boleta.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-primary">Boletas sin comisión</p>
                  <p className="mt-2 text-sm text-foreground">
                    Aquí se representa el valor total de la boleta sin la comisión.
                  </p>
                </>
              )}
              <Button
                variant="outline"
                className="mt-5 w-full rounded-full border-2 border-primary text-primary font-semibold"
                onClick={() => setFeeInfo(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── SEAT MAP PREVIEW (default) ──
  const activeCategory = CATEGORIES.find((c) => c.id === activeCat)!;
  return (
    <div className="mx-auto max-w-lg pb-32 min-h-screen bg-background">
      <div className="px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-foreground mb-3">
          <ChevronLeft className="h-5 w-5" /> Volver
        </button>
        <p className="text-base font-bold text-primary">Compra de boletería</p>
        <h1 className="text-2xl font-extrabold text-foreground leading-tight">{event.title}</h1>
      </div>

      {/* Venue card */}
      <div className="px-4 mt-4">
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <HomeIcon className="h-6 w-6 text-primary mt-1" />
            <div className="flex-1">
              <p className="font-bold text-foreground">{event.venue.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lugar con capacidad para {event.capacity}
              </p>
              <p className="text-xs text-muted-foreground">{event.venue.address}</p>
            </div>
          </div>
          {event.venue.images.length > 0 && (
            <>
              <button
                onClick={() => setShowVenueImgs((v) => !v)}
                className="mt-3 text-sm font-semibold text-primary"
              >
                {showVenueImgs ? '∧ Ocultar' : '∨ Ver'} imágenes del lugar
              </button>
              {showVenueImgs && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {event.venue.images.slice(0, 3).map((img, i) => (
                    <img key={i} src={img} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  ))}
                </div>
              )}
            </>
          )}
          <button
            onClick={() => toast.info('Abriendo mapa...')}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <MapPin className="h-4 w-4" /> Ver ubicación en el mapa
          </button>
        </div>
      </div>

      {/* Seat map */}
      <div className="px-4 mt-5">
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-primary" />
            <p className="font-bold">Mapa de silletería</p>
            <span className="text-xs text-muted-foreground">Categorías ({CATEGORIES.length})</span>
          </div>

          {/* Category tabs */}
          <div className="mt-3 flex gap-4 border-b border-border overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`pb-2 text-sm font-semibold whitespace-nowrap ${
                  activeCat === cat.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Preview map (non-interactive small) */}
          <div className="mt-6 flex justify-center overflow-hidden">
            <div className="scale-75 sm:scale-90">
              {renderSeatGrid(activeCategory, { interactive: false, small: true })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className={`h-3 w-3 rounded ${activeCategory.color}`} /> Disponible</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-foreground/70" /> Ocupada</span>
            </div>
            <span className="font-bold text-primary">{fmt(activeCategory.price)}</span>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setStep('fullmap')}
              className="flex items-center gap-2 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold shadow-md"
            >
              <Maximize2 className="h-4 w-4" /> Ver completo
            </button>
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-background border-t border-border">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{selected.length} silla(s) seleccionada(s)</p>
              <p className="text-base font-bold text-primary">{fmt(total)}</p>
            </div>
            <Button className="w-full rounded-full py-6 text-base font-semibold" onClick={() => setStep('confirm')}>
              Continuar a confirmación
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketPurchaseFlow;
