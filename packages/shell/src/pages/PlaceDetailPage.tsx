import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  deleteVenue,
  extractVenueImageUrls,
  fetchUserById,
  fetchVenueCalifications,
  fetchVenueLikedByUser,
  getPersistedPlatformRole,
  getVenueById,
  invalidateVenuesCache,
  isEntityOwner,
  Loader,
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
import PublicationPromoCodesPanel, { canViewPublicationPromoCodes } from '../components/PublicationPromoCodesPanel';

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
    const meta = parseVenueAmenities(String(venue.amenities || ''));
    const ctx = buildVenueReservationContext(venue, venueId, {
      userId: userId || '',
      buyerProfile,
      hostProfile,
      rating,
      reviewCount,
      readOnly: false,
      addonServices: (meta.addonServices || []).filter((service) => service.distanceKm == null),
    });
    return { ...ctx, amenitiesMeta: meta };
  }, [venue, venueId, userId, buyerProfile, hostProfile, rating, reviewCount]);

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
  const platformRole = getPersistedPlatformRole();
  const canViewPromoCodes = canViewPublicationPromoCodes(userId, venue.ownerUserId, platformRole);

  if (!reservationContext) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Lugar no encontrado</p>
        <button type="button" className="mt-4 text-primary font-semibold" onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  const displayContext = reservationContext;

  const ownerPanel = (isOwner || canEdit) && venue.venueId ? (
    <div className="mx-auto max-w-lg space-y-3 px-4 pb-8">
      {isOwner && (
        <p className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-primary">
          Este es tu lugar. Puedes reservarlo como cualquier visitante o editarlo cuando quieras.
        </p>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => navigate(`/places/${venue.venueId}/edit`)}
          className="w-full rounded-full border border-primary py-3 text-sm font-semibold text-primary"
        >
          {displayContext.bookingEnabled ? 'Editar lugar' : 'Configurar precios y disponibilidad'}
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
        {canViewPromoCodes && venue.venueId && (
          <PublicationPromoCodesPanel
            entityType="venue"
            entityId={venue.venueId}
            entityName={String(venue.name || 'Lugar')}
            ownerUserId={venue.ownerUserId}
            userId={userId}
            platformRole={platformRole}
            imageUrl={extractVenueImageUrls(venue as Record<string, unknown>)[0] || venue.mainImage || undefined}
          />
        )}
      </div>
    ) : null;

  return (
    <>
      <VenueDetailReservation
        venue={displayContext.draft}
        venueDetail={venue}
        venueAmenities={displayContext.amenitiesMeta ?? parseVenueAmenities(String(venue.amenities || ''))}
        hostProfile={displayContext.hostProfile}
        venueRating={displayContext.rating}
        venueReviewCount={displayContext.reviewCount}
        onBack={() => navigate(-1)}
        onFinish={() => navigate('/events')}
        addonServices={displayContext.addonServices}
        venueMeta={{
          rating: displayContext.rating,
          reviewCount: displayContext.reviewCount,
          hostName: displayContext.hostProfile?.name,
          hostEmail: displayContext.hostProfile?.email,
        }}
        readOnly={displayContext.readOnly}
        onEdit={canEdit && venue.venueId ? () => navigate(`/places/${venue.venueId}/edit`) : undefined}
        ownerActions={ownerPanel}
        bookingEnabled={displayContext.bookingEnabled}
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
        liveBooking={displayContext.bookingEnabled ? {
          venueId: displayContext.venueId,
          userId: displayContext.userId,
          rentalUnit: displayContext.rentalUnit,
          pricePerDay: displayContext.pricePerDay,
          pricePerMonth: displayContext.pricePerMonth,
          checkIn: displayContext.checkIn,
          checkOut: displayContext.checkOut,
          buyerProfile: displayContext.buyerProfile,
          venueName: String(venue.name || 'Lugar'),
          previewOnly: !userId,
          onPaymentReady: (payload) => {
            buildVenuePaymentNavigation(navigate, {
              ...payload,
              venueId: displayContext.venueId,
              venueName: String(venue.name || 'Lugar'),
              services: payload.services,
            });
          },
        } : undefined}
      />
    </>
  );
};

export default PlaceDetailPage;
