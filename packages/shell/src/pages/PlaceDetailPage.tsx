import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  deleteVenue,
  fetchPublishedServicesForVenue,
  fetchUserById,
  fetchVenueCalifications,
  fetchVenueLikedByUser,
  getVenueById,
  invalidateVenuesCache,
  isEntityOwner,
  Loader,
  mapNearbyServicesToVenueAddons,
  RootState,
  useToast,
  type VenueDetail,
} from '@doevents/shared';
import VenueDetailReservation from '@lovable/components/venues/VenueDetailReservation';
import { CoAdminSection } from '../components/CoAdminSection';
import { DeleteOwnItemButton } from '../components/DeleteOwnItemButton';
import {
  buildVenuePaymentNavigation,
  buildVenueReservationContext,
} from '../lovable-bridge/venueReservationBridge';
import { parseVenueAmenities } from '../lovable-bridge/venuesAdapter';
import {
  buildDetailChatHandler,
  buildDetailRepostHandler,
  buildDetailShareHandler,
  buildVenueLikeHandler,
} from '../lovable-bridge/entityDetailSocial';

export const PlaceDetailPage: React.FC = () => {
  const { venueId = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [buyerProfile, setBuyerProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [hostProfile, setHostProfile] = useState<{ name?: string; email?: string }>();
  const [liked, setLiked] = useState(false);
  const [nearbyAddons, setNearbyAddons] = useState<import('@doevents/shared').VenueAddonService[]>([]);

  const loadVenue = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const [data, califications] = await Promise.all([
        getVenueById(venueId),
        fetchVenueCalifications(venueId).catch(() => []),
      ]);
      setVenue(data);
      setRating(Number(data.rating || 0));
      setReviewCount(Number(data.reviewCount || califications.length));

      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      const published = await fetchPublishedServicesForVenue(
        Number.isFinite(lat) ? lat : undefined,
        Number.isFinite(lng) ? lng : undefined,
        { limit: 50 },
      ).catch(() => []);
      setNearbyAddons(mapNearbyServicesToVenueAddons(published));

      const ownerId = data.ownerUserId;
      if (ownerId) {
        const owner = await fetchUserById(ownerId).catch(() => null);
        if (owner) {
          setHostProfile({
            name: [owner.nombre, owner.apellido].filter(Boolean).join(' ').trim() || owner.username,
            email: owner.email,
          });
        }
      }

      if (userId) {
        const profile = await fetchUserById(userId).catch(() => null);
        if (profile) {
          setBuyerProfile({
            firstName: profile.nombre || '',
            lastName: profile.apellido || '',
            email: profile.email || '',
          });
        }
        const venueLiked = await fetchVenueLikedByUser(venueId, userId).catch(() => false);
        setLiked(venueLiked);
      } else {
        setLiked(false);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo cargar el lugar', 'error');
    } finally {
      setLoading(false);
    }
  }, [venueId, userId, showToast]);

  useEffect(() => {
    void loadVenue();
  }, [loadVenue]);

  const reservationContext = useMemo(() => {
    if (!venue || !venueId) return null;
    const isOwner = Boolean(userId && isEntityOwner(userId, venue.ownerUserId));
    const meta = parseVenueAmenities(String(venue.amenities || ''));
    const ctx = buildVenueReservationContext(venue, venueId, {
      userId: userId || '',
      buyerProfile,
      hostProfile,
      rating,
      reviewCount,
      readOnly: isOwner,
      addonServices: nearbyAddons,
    });
    return ctx ? { ...ctx, amenitiesMeta: meta } : null;
  }, [venue, venueId, userId, buyerProfile, hostProfile, rating, reviewCount, nearbyAddons]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Lugar no encontrado</p>
        <button type="button" className="mt-4 text-primary font-semibold" onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  const coAdminIds = venue.coAdminIds || [];
  const isOwner = Boolean(userId && isEntityOwner(userId, venue.ownerUserId));
  const canEdit = canEditEntity(userId, venue.ownerUserId, coAdminIds);

  if (reservationContext) {
    const ownerPanel = (isOwner || canEdit) && venue.venueId ? (
      <div className="mx-auto max-w-lg space-y-3 px-4 pb-8">
        {isOwner && (
          <p className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-primary">
            Este es tu lugar publicado. Los visitantes verán este mismo detalle para reservar.
          </p>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => navigate(`/places/${venue.venueId}/edit`)}
            className="w-full rounded-full border border-primary py-3 text-sm font-semibold text-primary"
          >
            Editar lugar
          </button>
        )}
        {isOwner && userId && venue.venueId && (
          <>
            <CoAdminSection
              entityType="VENUE"
              entityId={venue.venueId}
              ownerUserId={String(venue.ownerUserId)}
              currentUserId={userId}
              coAdminIds={coAdminIds}
              entityName={String(venue.name || 'Lugar')}
            />
            <DeleteOwnItemButton
              label={String(venue.name || 'este lugar')}
              onDelete={async () => {
                await deleteVenue(venue.venueId!, userId);
                invalidateVenuesCache();
                showToast('Lugar eliminado', 'success');
                navigate('/profile/venues');
              }}
            />
          </>
        )}
      </div>
    ) : null;

    return (
      <>
        <VenueDetailReservation
          venue={reservationContext.draft}
          venueDetail={venue}
          venueAmenities={reservationContext.amenitiesMeta}
          hostProfile={reservationContext.hostProfile}
          venueRating={reservationContext.rating}
          venueReviewCount={reservationContext.reviewCount}
          onBack={() => navigate(-1)}
          onFinish={() => navigate('/events')}
          addonServices={reservationContext.addonServices}
          venueMeta={{
            rating: reservationContext.rating,
            reviewCount: reservationContext.reviewCount,
            hostName: reservationContext.hostProfile?.name,
            hostEmail: reservationContext.hostProfile?.email,
          }}
          readOnly={reservationContext.readOnly}
          ownerActions={ownerPanel}
          liked={liked}
          onLike={venue.venueId ? buildVenueLikeHandler(venue.venueId, userId, showToast, setLiked, liked) : undefined}
          onChat={buildDetailChatHandler(userId, showToast, venue.ownerUserId, navigate)}
          onReply={venue.venueId ? buildDetailRepostHandler(venue.venueId, {
            userId,
            showToast,
            navigate,
            entityLabel: 'Lugar',
          }) : undefined}
          onShare={venue.venueId ? buildDetailShareHandler(
            `/places/${venue.venueId}`,
            String(venue.name || 'Lugar'),
            showToast,
          ) : undefined}
          onRequireLogin={() => {
            showToast('Debes iniciar sesión para reservar', 'error');
            navigate('/auth/login', { state: { from: `/places/${venueId}` } });
          }}
          liveBooking={{
            venueId: reservationContext.venueId,
            userId: reservationContext.userId,
            pricePerDay: reservationContext.pricePerDay,
            checkIn: reservationContext.checkIn,
            checkOut: reservationContext.checkOut,
            buyerProfile: reservationContext.buyerProfile,
            venueName: String(venue.name || 'Lugar'),
            previewOnly: !userId,
            onPaymentReady: (payload) => {
              buildVenuePaymentNavigation(navigate, {
                ...payload,
                venueId: reservationContext.venueId,
                venueName: String(venue.name || 'Lugar'),
              });
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="de-page-content pb-24">
      <div className="de-safe-top" />
      <header className="de-page-topbar">
        <button type="button" className="de-search-page__back" onClick={() => navigate(-1)}>← Atrás</button>
        <h1>{String(venue.name || 'Lugar')}</h1>
      </header>
      <div className="space-y-4 p-4 text-center">
        <p className="text-muted-foreground">
          Este lugar aún no tiene precio de alquiler configurado para reservas en línea.
        </p>
        {!userId && (
          <button
            type="button"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            onClick={() => navigate('/auth/login', { state: { from: `/places/${venueId}` } })}
          >
            Iniciar sesión
          </button>
        )}
        {canEdit && venue.venueId && (
          <button
            type="button"
            onClick={() => navigate(`/places/${venue.venueId}/edit`)}
            className="w-full rounded-full border border-primary py-3 text-sm font-semibold text-primary"
          >
            Configurar precios y disponibilidad
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaceDetailPage;
