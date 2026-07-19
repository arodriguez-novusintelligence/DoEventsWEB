import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Building2, Calendar, ChevronLeft, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import {
  fetchUserVenueBookings,
  RootState,
  type UserVenueBooking,
} from '@doevents/shared';
import { Button } from '@lovable/components/ui/button';
import { venueBookingToDetail } from '../../../lovable-bridge/purchasesAdapter';

export interface VenueReservationDetailData {
  venueName: string;
  startDate: string;
  endDate: string;
  days: number;
  address: string;
  basePrice: number;
  reservationValue?: number;
  servicesTotal?: number;
  subtotalReserva?: number;
  commission?: number;
  commissionIva?: number;
  total?: number;
  additionalServices: { name: string; qty?: number; price: number }[];
  commissionRate?: number;
  ivaRate?: number;
  currency?: string;
}

interface VenueReservationDetailViewProps {
  data: VenueReservationDetailData;
  onBack: () => void;
  onViewVenueDetail?: () => void;
}

const fmt = (n: number, currency = '$') =>
  `${currency} ${n.toLocaleString('es-CO')}`;

export const VenueReservationDetailView = ({
  data,
  onBack,
  onViewVenueDetail,
}: VenueReservationDetailViewProps) => {
  const currency = data.currency ?? '$';
  const commissionRate = data.commissionRate ?? 0.12;
  const ivaRate = data.ivaRate ?? 0.19;

  const reservaTotal = data.reservationValue ?? data.basePrice * data.days;
  const subtotalServicios = data.servicesTotal ?? data.additionalServices.reduce(
    (acc, s) => acc + s.price * (s.qty ?? 1),
    0,
  );
  const subtotalReserva = data.subtotalReserva ?? reservaTotal + subtotalServicios;
  const comision = data.commission ?? Math.round(subtotalReserva * commissionRate);
  const iva = data.commissionIva ?? Math.round(comision * ivaRate);
  const total = data.total ?? subtotalReserva + comision + iva;

  return (
    <div className="min-h-screen bg-secondary pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-foreground">
            <ChevronLeft className="h-5 w-5" /> Volver
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-extrabold text-foreground">Confirmación de reserva</h1>
          <p className="text-sm font-semibold text-primary">{data.venueName}</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Fecha de inicio
              </div>
              <p className="text-base font-bold text-foreground">{data.startDate}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Fecha de fin
              </div>
              <p className="text-base font-bold text-foreground">{data.endDate}</p>
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
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground">Resumen de pago</h2>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reserva ({data.days} día{data.days !== 1 ? 's' : ''})</span>
            <span className="font-semibold text-foreground">{fmt(reservaTotal, currency)}</span>
          </div>

          {data.additionalServices.length > 0 && (
            <>
              <p className="pt-1 text-xs font-semibold text-muted-foreground">Servicios adicionales</p>
              {data.additionalServices.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {s.name}{s.qty && s.qty > 1 ? ` × ${s.qty}` : ''}
                  </span>
                  <span className="font-semibold text-foreground">{fmt(s.price * (s.qty ?? 1), currency)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-dashed border-border pt-2 text-sm">
                <span className="text-muted-foreground">Subtotal servicios</span>
                <span className="font-semibold text-foreground">{fmt(subtotalServicios, currency)}</span>
              </div>
            </>
          )}

          <div className="space-y-2 border-t border-border pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal reserva</span>
              <span className="font-semibold text-foreground">{fmt(subtotalReserva, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comisión del servicio ({Math.round(commissionRate * 100)}%)</span>
              <span className="font-semibold text-foreground">{fmt(comision, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA sobre comisión ({Math.round(ivaRate * 100)}%)</span>
              <span className="font-semibold text-foreground">{fmt(iva, currency)}</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm font-bold text-foreground">Valor total</span>
            <div className="text-right">
              <div className="text-lg font-extrabold text-primary">{fmt(total, currency)}</div>
              <p className="text-[10px] text-muted-foreground">IVA incluido</p>
            </div>
          </div>
        </div>

        {onViewVenueDetail && (
          <button
            type="button"
            onClick={onViewVenueDetail}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.99]"
          >
            <Building2 className="h-4 w-4" /> Ver detalle del lugar
          </button>
        )}
      </div>
    </div>
  );
};

interface VenueReservationDetailProps {
  booking?: UserVenueBooking | null;
  onBack?: () => void;
  onViewVenueDetail?: () => void;
}

export const VenueReservationDetail = ({
  booking: bookingProp,
  onBack,
  onViewVenueDetail,
}: VenueReservationDetailProps = {}) => {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(!bookingProp && Boolean(bookingId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [booking, setBooking] = useState<UserVenueBooking | null>(bookingProp ?? null);
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
    void fetchUserVenueBookings(userId)
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

  const handleBack = onBack || (() => navigate('/purchases/venues'));

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
        <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-semibold text-foreground">Reserva no encontrada</p>
        <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={handleBack}>
          Volver
        </Button>
      </div>
    );
  }

  const viewVenue = onViewVenueDetail || (() => navigate(`/places/${booking.venueId}`));

  return (
    <VenueReservationDetailView
      data={venueBookingToDetail(booking)}
      onBack={handleBack}
      onViewVenueDetail={viewVenue}
    />
  );
};

export default VenueReservationDetail;
