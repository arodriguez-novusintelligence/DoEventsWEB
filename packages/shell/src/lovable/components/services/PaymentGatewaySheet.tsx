import { useState } from 'react';
import { X, CreditCard, Building2, CheckCircle2, Lock, ChevronDown, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { cn } from '@lovable/lib/utils';
import { BookingData } from './BookingSheet';
import { useNotifyPurchase } from '@lovable/lib/useNotifyPurchase';
import { confirmTicketPayment } from '@doevents/shared';
import { toast } from 'sonner';

interface PaymentGatewaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingData | null;
  onSuccess: () => void;
  sellerName?: string;
}

type PaymentMethod = 'card' | 'pse';
type Step = 'method' | 'form' | 'processing' | 'success';

function formatCurrency(amount: number, currency = 'COP') {
  return `${currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$'} ${amount.toLocaleString('es-CO')}`;
}

const BANKS = [
  'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia',
  'Banco Popular', 'Banco Caja Social', 'Nequi', 'Daviplata',
];

const PaymentGatewaySheet = ({ open, onOpenChange, booking, onSuccess, sellerName }: PaymentGatewaySheetProps) => {
  const notifyPurchase = useNotifyPurchase();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [paying, setPaying] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // PSE fields
  const [bank, setBank] = useState('');
  const [docType, setDocType] = useState('CC');
  const [docNumber, setDocNumber] = useState('');

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const isCardValid = cardNumber.replace(/\s/g, '').length === 16 && cardName.trim().length > 2 && cardExpiry.length === 5 && cardCvv.length >= 3;
  const isPseValid = bank.length > 0 && docNumber.trim().length >= 6;

  const canPay = (method === 'card' ? isCardValid : isPseValid) && Boolean(booking?.orderId);

  const handlePay = () => {
    if (!booking) return;

    const completeSuccess = () => {
      setStep('success');
      notifyPurchase({
        kind: 'service',
        itemName: booking.serviceName,
        sellerName: sellerName || 'Proveedor del servicio',
        amount: formatCurrency(booking.total, booking.currency),
      });
    };

    if (!booking.orderId) {
      // BACKEND_REQUIRED: orden de pago real — no simular éxito sin orderId
      toast.error('No hay orden de pago asociada. Intenta reservar de nuevo.');
      return;
    }

    setPaying(true);
    setStep('processing');
    confirmTicketPayment(booking.orderId)
      .then(() => completeSuccess())
      .catch((err) => {
        setStep('form');
        toast.error(err instanceof Error ? err.message : 'No se pudo procesar el pago');
      })
      .finally(() => setPaying(false));
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    }
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setStep('method');
      setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
      setBank(''); setDocNumber('');
    }, 400);
  };

  if (!booking) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto rounded-t-3xl px-0 pb-0">
        <SheetHeader className="border-b border-border px-5 pb-4">
          <div className="flex items-center gap-3">
            {step !== 'processing' && step !== 'success' && (
              <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <CreditCard className="h-5 w-5 text-primary" />
              </span>
              {step === 'success' ? '¡Reserva confirmada!' : booking.orderId ? 'Confirmar orden' : 'Pago seguro'}
            </SheetTitle>
            {step !== 'success' && booking.orderId && (
              <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                <span>Orden {booking.orderId.slice(-8)}</span>
              </div>
            )}
            {step !== 'success' && !booking.orderId && (
              <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>SSL seguro</span>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="px-5 py-4">
          {!booking.orderId && step !== 'success' && (
            <div className="mb-4 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">Orden de pago no disponible</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Completa la reserva nuevamente para generar una orden válida antes de pagar.
                </p>
              </div>
            </div>
          )}
          {booking.orderId && step !== 'success' && step !== 'processing' && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold text-primary">Confirmación de orden</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                El cobro con tarjeta/PSE se activará cuando el PSP esté integrado. Por ahora solo se confirma la orden existente.
              </p>
            </div>
          )}
          {(step === 'method' || step === 'form' || step === 'processing') && (
            <div className="mb-5 flex items-center gap-2">
              {(['method', 'form', 'processing'] as const).map((s, i) => {
                const labels = ['Método', 'Datos', 'Pago'];
                const active = step === s;
                const done = (step === 'form' && i === 0) || (step === 'processing' && i < 2);
                return (
                  <div key={s} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`h-1.5 w-full rounded-full transition-all ${active || done ? 'bg-primary' : 'bg-muted'}`} />
                    <span className={`text-[10px] font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                      {labels[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">¡Pago exitoso!</h2>
                <p className="mt-1 text-sm text-muted-foreground">Tu reserva ha sido confirmada</p>
              </div>
              <div className="w-full rounded-2xl bg-card p-4 shadow-sm space-y-2 text-left">
                <p className="text-xs font-bold text-primary uppercase">{booking.serviceName}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fechas</span>
                  <span className="font-semibold">{booking.startDate.split('-').reverse().join('/')} → {booking.endDate.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duración</span>
                  <span className="font-semibold">{booking.days} día{booking.days !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Horario</span>
                  <span className="font-semibold">{booking.startTime} — {booking.endTime}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-dashed border-border pt-2">
                  <span className="text-muted-foreground">Subtotal reserva</span>
                  <span className="font-medium">{formatCurrency(booking.subtotal, booking.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comisión (12%)</span>
                  <span className="font-medium">{formatCurrency(booking.commission, booking.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA comisión (19%)</span>
                  <span className="font-medium">{formatCurrency(booking.commissionIva, booking.currency)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="font-bold">Total pagado</span>
                  <span className="font-bold text-primary text-base">{formatCurrency(booking.total, booking.currency)}</span>
                </div>
              </div>
              <div className="w-full rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2 text-left">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Recibirás un correo de confirmación con los detalles de tu reserva. El prestador del servicio ha sido notificado.
                </p>
              </div>
              <Button className="w-full rounded-full py-5 text-sm font-semibold" onClick={handleClose}>
                Ver mis reservas
              </Button>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-5">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-foreground">Procesando pago...</p>
                <p className="mt-1 text-sm text-muted-foreground">No cierres esta pantalla</p>
              </div>
              <div className="w-full rounded-xl bg-card border border-border p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total a debitar</span>
                  <span className="font-bold text-foreground">{formatCurrency(booking.total, booking.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método</span>
                  <span className="font-medium">{method === 'card' ? `•••• ${cardNumber.slice(-4)}` : bank}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── METHOD SELECTION ── */}
          {(step === 'method' || step === 'form') && (
            <div className="space-y-5">
              {/* Booking summary pill */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{booking.serviceName}</p>
                  <p className="text-xs text-muted-foreground">{booking.startDate.split('-').reverse().join('/')} → {booking.endDate.split('-').reverse().join('/')} · {booking.days}d</p>
                </div>
                <p className="text-base font-bold text-primary">{formatCurrency(booking.total, booking.currency)}</p>
              </div>

              {/* Method tabs */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'card', label: 'Tarjeta', icon: CreditCard },
                  { id: 'pse', label: 'PSE', icon: Building2 },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setMethod(id); setStep('form'); }}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors',
                      method === id && step === 'form'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Card form */}
              {step === 'form' && method === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Número de tarjeta</label>
                    <div className="relative mt-1">
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="pr-10"
                        inputMode="numeric"
                      />
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Nombre en la tarjeta</label>
                    <Input
                      className="mt-1"
                      placeholder="NOMBRE APELLIDO"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Vencimiento</label>
                      <Input
                        className="mt-1"
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        inputMode="numeric"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">CVV</label>
                      <Input
                        className="mt-1"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                        type="password"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PSE form */}
              {step === 'form' && method === 'pse' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Banco</label>
                    <div className="relative mt-1">
                      <select
                        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                      >
                        <option value="">Selecciona tu banco</option>
                        {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Tipo de documento</label>
                      <div className="relative mt-1">
                        <select
                          className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                        >
                          {['CC', 'CE', 'NIT', 'Pasaporte'].map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Número de documento</label>
                      <Input
                        className="mt-1"
                        placeholder="1234567890"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ''))}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-card border border-border p-3">
                    <p className="text-xs text-muted-foreground">
                      Serás redirigido al portal de tu banco para completar el pago de forma segura.
                    </p>
                  </div>
                </div>
              )}

              {/* Security badges */}
              {step === 'form' && (
                <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1"><Lock className="h-3 w-3" /><span>Encriptado 256-bit</span></div>
                  <div className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /><span>Pago seguro</span></div>
                </div>
              )}

              {/* Pay button */}
              {step === 'form' && (
                <Button
                  className="w-full rounded-full py-6 text-base font-semibold gap-2"
                  disabled={!canPay || paying}
                  onClick={handlePay}
                >
                  <Lock className="h-4 w-4" />
                  Pagar {formatCurrency(booking.total, booking.currency)}
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PaymentGatewaySheet;
