import { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Crown,
  CalendarDays,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { cn } from '@lovable/lib/utils';
import { useNotifyPurchase } from '@lovable/lib/useNotifyPurchase';

interface ProSubscriptionPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type PaymentMethod = 'card' | 'pse';
type Step = 'method' | 'form' | 'processing' | 'success';

const BANKS = [
  'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia',
  'Banco Popular', 'Banco Caja Social', 'Nequi', 'Daviplata',
];

const ProSubscriptionPaymentSheet = ({ open, onOpenChange, onSuccess }: ProSubscriptionPaymentSheetProps) => {
  const notifyPurchase = useNotifyPurchase();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PaymentMethod>('card');

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

  const canPay = method === 'card' ? isCardValid : isPseValid;

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      notifyPurchase({
        kind: 'subscription',
        itemName: 'Plan PRO (anual)',
        amount: `US$ 70`,
      });
    }, 2800);
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    }
    onOpenChange(false);
    setTimeout(() => {
      setStep('method');
      setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
      setBank(''); setDocNumber('');
    }, 400);
  };

  const planPrice = 70;
  const planCurrency = 'USD';
  const formattedPrice = `US$ ${planPrice.toLocaleString('es-CO')}`;

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
            <SheetTitle className="text-base font-bold text-foreground">
              {step === 'success' ? '¡Suscripción activada!' : 'Adquirir plan PRO'}
            </SheetTitle>
            {step !== 'success' && (
              <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>SSL seguro</span>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="px-5 py-4">
          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                <Crown className="h-10 w-10 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">¡Bienvenido a PRO!</h2>
                <p className="mt-1 text-sm text-muted-foreground">Tu suscripción ha sido activada exitosamente</p>
              </div>
              <div className="w-full rounded-2xl bg-card p-4 shadow-sm space-y-3 text-left">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Plan PRO</p>
                    <p className="text-xs text-muted-foreground">Suscripción anual</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio</span>
                  <span className="font-semibold">{formattedPrice} / año</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Método de pago</span>
                  <span className="font-semibold">{method === 'card' ? `Tarjeta •••• ${cardNumber.slice(-4)}` : `PSE - ${bank}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Renovación</span>
                  <span className="font-semibold">10 de junio de 2027</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="font-bold">Total pagado</span>
                  <span className="font-bold text-primary text-base">{formattedPrice}</span>
                </div>
              </div>
              <div className="w-full rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-left">
                <CalendarDays className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Tu plan se renovará automáticamente el próximo año. Puedes cancelar la renovación automática desde tu perfil en cualquier momento.
                </p>
              </div>
              <Button className="w-full rounded-full py-5 text-sm font-semibold" onClick={handleClose}>
                Comenzar a usar PRO
              </Button>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-5">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-foreground">Procesando pago...</p>
                <p className="mt-1 text-sm text-muted-foreground">No cierres esta pantalla</p>
              </div>
              <div className="w-full rounded-xl bg-card border border-border p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total a debitar</span>
                  <span className="font-bold text-foreground">{formattedPrice}</span>
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
              {/* Plan summary pill */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Plan PRO</p>
                    <p className="text-xs text-muted-foreground">Suscripción anual</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-amber-600">{formattedPrice}</p>
              </div>

              {/* Benefits preview */}
              <div className="rounded-xl bg-card border border-border p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Incluye:</p>
                <ul className="space-y-1.5">
                  {[
                    'Eventos ilimitados al año',
                    'Boletas ilimitadas por evento',
                    'Control de accesos con QR',
                    'Códigos promocionales',
                    'Gestión de invitados CRM',
                    'Marketing digital y notificaciones',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Method tabs */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'card' as const, label: 'Tarjeta', icon: CreditCard },
                  { id: 'pse' as const, label: 'PSE', icon: Building2 },
                ]).map(({ id, label, icon: Icon }) => (
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
                  disabled={!canPay}
                  onClick={handlePay}
                >
                  <Lock className="h-4 w-4" />
                  Pagar {formattedPrice}
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProSubscriptionPaymentSheet;
