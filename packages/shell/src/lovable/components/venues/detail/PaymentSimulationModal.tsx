import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@lovable/components/ui/dialog";
import { Button } from "@lovable/components/ui/button";
import { Input } from "@lovable/components/ui/input";
import { Label } from "@lovable/components/ui/label";
import { Separator } from "@lovable/components/ui/separator";
import { 
  CreditCard, 
  Lock, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  Calendar,
  User
} from "lucide-react";
import { cn } from "@lovable/lib/utils";

interface ServiceSelection {
  service: { name: string; price: number };
  quantity: number;
}

interface PaymentSimulationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueName: string;
  startDate: Date;
  endDate: Date | null;
  numberOfDays: number;
  basePrice: number;
  selectedServices: ServiceSelection[];
  subtotal: number;
  serviceCharge: number;
  totalAmount: number;
  onPaymentComplete: () => void;
}

type PaymentStep = "details" | "processing" | "success";

const PaymentSimulationModal = ({
  open,
  onOpenChange,
  venueName,
  startDate,
  endDate,
  numberOfDays,
  basePrice,
  selectedServices,
  subtotal,
  serviceCharge,
  totalAmount,
  onPaymentComplete,
}: PaymentSimulationModalProps) => {
  const [step, setStep] = useState<PaymentStep>("details");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleSubmit = () => {
    setStep("processing");
    // Simulate payment processing
    setTimeout(() => {
      setStep("success");
    }, 2500);
  };

  const handleClose = () => {
    if (step === "success") {
      onPaymentComplete();
    }
    setStep("details");
    setCardNumber("");
    setCardName("");
    setExpiry("");
    setCvv("");
    onOpenChange(false);
  };

  const isFormValid = 
    cardNumber.replace(/\s/g, "").length === 16 &&
    cardName.length >= 3 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Pasarela de Pago
              </DialogTitle>
            </DialogHeader>

            {/* Order Summary */}
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Resumen del pedido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{venueName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(startDate)}
                  {endDate && ` - ${formatDate(endDate)}`}
                  <span className="ml-auto">({numberOfDays} {numberOfDays === 1 ? "día" : "días"})</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alquiler del lugar</span>
                  <span>{formatCurrency(basePrice * numberOfDays)}</span>
                </div>
                {selectedServices.map((s) => (
                  <div key={s.service.name} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {s.service.name} (x{s.quantity})
                    </span>
                    <span>{formatCurrency(s.service.price * s.quantity * numberOfDays)}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cargos por servicio (10%)</span>
                  <span>{formatCurrency(serviceCharge)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total a pagar</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Card Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="pl-10"
                  />
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                <div className="relative">
                  <Input
                    id="cardName"
                    placeholder="Juan Pérez"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Fecha de expiración</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
              <Lock className="w-4 h-4" />
              <span>Pago seguro con encriptación SSL de 256 bits</span>
              <ShieldCheck className="w-4 h-4 text-green-500" />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!isFormValid}
              onClick={handleSubmit}
            >
              Pagar {formatCurrency(totalAmount)}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Esta es una simulación. No se realizará ningún cargo real.
            </p>
          </>
        )}

        {step === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Procesando pago...</h3>
              <p className="text-sm text-muted-foreground">
                Por favor espera mientras verificamos tu información
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">¡Pago exitoso!</h3>
              <p className="text-sm text-muted-foreground">
                Tu reserva ha sido confirmada
              </p>
            </div>
            
            <div className="w-full bg-secondary/30 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lugar</span>
                <span className="font-medium">{venueName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">
                  {formatDate(startDate)}
                  {endDate && ` - ${formatDate(endDate)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total pagado</span>
                <span className="font-medium text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Número de confirmación</span>
                <span className="font-mono">RES-{Date.now().toString().slice(-8)}</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSimulationModal;
