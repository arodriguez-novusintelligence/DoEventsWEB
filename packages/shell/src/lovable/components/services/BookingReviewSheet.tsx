import { useMemo, useState } from 'react';
import { ChevronLeft, CalendarDays, MapPin } from 'lucide-react';
import { Sheet, SheetContent } from '@lovable/components/ui/sheet';
import { Button } from '@lovable/components/ui/button';
import { Input } from '@lovable/components/ui/input';
import { BookingData } from './BookingSheet';

interface BookingReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingData | null;
  address?: string;
  onBack: () => void;
  onConfirm: (buyer: BuyerData) => void;
}

export interface BuyerData {
  firstName: string;
  lastName: string;
  email: string;
}

function formatCurrency(amount: number, currency = 'COP') {
  return `${currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$'} ${amount.toLocaleString('es-CO')}`;
}

const BookingReviewSheet = ({
  open,
  onOpenChange,
  booking,
  address = 'Vía Llanogrande Km 4',
  onBack,
  onConfirm,
}: BookingReviewSheetProps) => {
  const [firstName, setFirstName] = useState('Tatiana');
  const [lastName, setLastName] = useState('Muñoz');
  const [email, setEmail] = useState('tmunoz@mail.com');

  const additionalTotal = useMemo(() => {
    if (!booking) return 0;
    return booking.additionalServices.reduce(
      (sum, s) => sum + s.pricePerDay * s.quantity * booking.days,
      0,
    );
  }, [booking]);

  if (!booking) return null;

  const baseTotal = booking.basePrice * booking.days;
  const emailValid = /^\S+@\S+\.\S+$/.test(email);
  const canConfirm = firstName.trim().length > 1 && lastName.trim().length > 1 && emailValid;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] sm:h-[95vh] overflow-y-auto rounded-t-3xl p-0 bg-muted/40"
      >
        {/* Sticky back header */}
        <div className="sticky top-0 z-10 px-4 pt-4 pb-2 bg-muted/40 backdrop-blur">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-2xl bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm border border-border/60 hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        </div>

        <div className="px-4 pb-32 space-y-4">
          {/* Date / location card */}
          <div className="rounded-2xl bg-card p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>Fecha de inicio</span>
                </div>
                <p className="mt-1 text-base font-bold text-foreground">
                  {booking.startDate.split('-').reverse().join('/')}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>Fecha de fin</span>
                </div>
                <p className="mt-1 text-base font-bold text-foreground">
                  {booking.endDate.split('-').reverse().join('/')}
                </p>
              </div>
            </div>
            <div className="border-t border-dashed border-border pt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Número de días</span>
                <span className="font-bold text-foreground">{booking.days}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Dirección
                </span>
                <span className="font-semibold text-foreground text-right">{address}</span>
              </div>
            </div>
          </div>

          {/* Payment summary card */}
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-3">Resumen de pago</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Reserva ({booking.days} día{booking.days !== 1 ? 's' : ''})
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(baseTotal, booking.currency)}
                </span>
              </div>

              {booking.additionalServices.length > 0 && (
                <>
                  <p className="pt-1 text-[13px] font-semibold text-foreground">
                    Servicios adicionales
                  </p>
                  {booking.additionalServices.map((s) => (
                    <div key={s.name} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {s.name}
                        {s.quantity > 1 ? ` × ${s.quantity}` : ''}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(s.pricePerDay * s.quantity * booking.days, booking.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-dashed border-border pt-2">
                    <span className="text-muted-foreground">Subtotal servicios</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(additionalTotal, booking.currency)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between border-t border-border pt-2 mt-1">
                <span className="text-muted-foreground">Subtotal reserva</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(booking.subtotal, booking.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comisión del servicio (12%)</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(booking.commission, booking.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA sobre comisión (19%)</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(booking.commissionIva, booking.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
                <span className="text-base font-bold text-foreground">Valor total</span>
                <span className="text-lg font-extrabold text-primary">
                  {formatCurrency(booking.total, booking.currency)}
                </span>
              </div>
              <p className="text-right text-[11px] text-muted-foreground">IVA incluido</p>
            </div>
          </div>

          {/* Buyer data card */}
          <div className="rounded-2xl bg-card p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-foreground">Datos del comprador</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nombre</label>
                <Input
                  className="mt-1"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Apellido</label>
                <Input
                  className="mt-1"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Apellido"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Correo electrónico</label>
              <Input
                className="mt-1"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@dominio.com"
              />
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur px-4 py-3">
          <Button
            className="w-full rounded-full py-6 text-base font-semibold"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Reservar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingReviewSheet;