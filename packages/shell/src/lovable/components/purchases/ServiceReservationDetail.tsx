import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Briefcase, Calendar, ChevronLeft, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import {
  fetchUserServiceBookings,
  RootState,
  type UserServiceBooking,
} from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { serviceBookingToDetail } from '../../../lovable-bridge/purchasesAdapter';

export interface ServiceReservationDetailData {
  serviceName: string;
  reservationNumber: string;
  startDate: string;
  endDate: string;
  days: number;
  address: string;
  basePrice: number;
  additionalServices: { name: string; price: number }[];
  commissionRate?: number;
  ivaRate?: number;
  currency?: string;
}

interface ServiceReservationDetailViewProps {
  data: ServiceReservationDetailData;
  onBack: () => void;
  onViewServiceDetail?: () => void;
}

const fmt = (n: number, currency = '$') =>
  `${currency} ${n.toLocaleString('es-CO')}`;

export const ServiceReservationDetailView = ({
  data,
  onBack,
  onViewServiceDetail,
}: ServiceReservationDetailViewProps) => {
  const currency = data.currency ?? '$';
  const commissionRate = data.commissionRate ?? 0.12;
  const ivaRate = data.ivaRate ?? 0.19;

  const reservaTotal = data.basePrice * data.days;
  const subtotalReserva =
    reservaTotal + data.additionalServices.reduce((a, s) => a + s.price, 0);
  const comision = Math.round(subtotalReserva * commissionRate);
  const iva = Math.round(comision * ivaRate);
  const total = subtotalReserva + comision + iva;

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-foreground">
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">Tu reserva está lista</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">No de reserva</span>
            <span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
              {data.reservationNumber}
            </span>
          </div>
          <h1 className="pt-1 text-lg font-extrabold text-primary">{data.serviceName}</h1>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Desde el...</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{data.startDate}</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Hasta el...</p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{data.endDate}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número de días</span>
              <span className="font-semibold text-foreground">{data.days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dirección</span>
              <span className="max-w-[55%] text-right font-semibold text-foreground">{data.address}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor de la reserva ({data.days} día{data.days !== 1 ? 's' : ''}):</span>
              <span className="font-semibold text-foreground">{fmt(reservaTotal, currency)}</span>
            </div>
            {data.additionalServices.map((s, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{s.name}:</span>
                <span className="font-semibold text-foreground">{fmt(s.price, currency)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-dashed border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal reserva</span>
              <span className="font-semibold text-foreground">{fmt(subtotalReserva, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comisión del servicio ({Math.round(commissionRate * 100)}%):</span>
              <span className="font-semibold text-foreground">{fmt(comision, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA sobre comisión ({Math.round(ivaRate * 100)}%):</span>
              <span className="font-semibold text-foreground">{fmt(iva, currency)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-extrabold text-foreground">Valor total pagado:</span>
            <span className="text-lg font-extrabold text-primary">{fmt(total, currency)}</span>
          </div>
        </div>

        {onViewServiceDetail && (
          <button
            type="button"
            onClick={onViewServiceDetail}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.99]"
          >
            <Briefcase className="h-4 w-4" /> Ver detalle del servicio
          </button>
        )}
      </div>
    </div>
  );
};

interface ServiceReservationDetailProps {
  booking?: UserServiceBooking | null;
  onBack?: () => void;
  onViewServiceDetail?: () => void;
}

export const ServiceReservationDetail = ({
  booking: bookingProp,
  onBack,
  onViewServiceDetail,
}: ServiceReservationDetailProps = {}) => {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(!bookingProp && Boolean(bookingId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [booking, setBooking] = useState<UserServiceBooking | null>(bookingProp ?? null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (bookingProp) {
      setBooking(bookingProp);
      setLoading(false);
      return;
    }
    if (!userId || !bookingId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchUserServiceBookings(userId)
      .then((rows) => {
        if (!cancelled) setBooking(rows.find((b) => b.bookingId === bookingId) || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setBooking(null);
          setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la reserva');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, bookingId, reloadKey, bookingProp]);

  const handleBack = onBack || (() => navigate('/purchases/services'));

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center bg-secondary px-4 pb-24">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-8 py-12 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando reserva…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 pb-24 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-3 text-sm font-medium text-foreground">Error al cargar</p>
        <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={() => setReloadKey((k) => k + 1)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 pb-24 text-center">
        <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-semibold text-foreground">Reserva no encontrada</p>
        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={handleBack}>
          Volver
        </Button>
      </div>
    );
  }

  const viewService = onViewServiceDetail || (() => navigate(`/services/${booking.serviceId}`));

  return (
    <ServiceReservationDetailView
      data={serviceBookingToDetail(booking)}
      onBack={handleBack}
      onViewServiceDetail={viewService}
    />
  );
};

export default ServiceReservationDetail;
