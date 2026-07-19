import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  fetchServiceById,
  fetchServiceLikedByUser,
  fetchUserById,
  isEntityOwner,
  Loader,
  NearbyServiceProvider,
  rateServiceProvider,
  RootState,
  useToast,
} from '@doevents/shared';
import ServiceDetailView from '@lovable/components/services/ServiceDetailView';
import type { ServiceFormData } from '@lovable/data/servicesData';
import { apiServiceToForm, serviceCoverUrl, serviceDisplayName } from '../lovable-bridge/serviceFormMapper';
import {
  buildDetailChatHandler,
  buildDetailRepostHandler,
  buildDetailShareHandler,
  buildServiceLikeHandler,
} from '../lovable-bridge/entityDetailSocial';

interface DiscoverServiceDetailOverlayProps {
  serviceId: string;
  onBack: () => void;
  openBookingOnMount?: boolean;
}

export const DiscoverServiceDetailOverlay: React.FC<DiscoverServiceDetailOverlayProps> = ({
  serviceId,
  onBack,
  openBookingOnMount = false,
}) => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { showToast } = useToast();
  const [service, setService] = useState<ServiceFormData | null>(null);
  const [meta, setMeta] = useState<NearbyServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [buyerProfile, setBuyerProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchServiceById(serviceId)
      .then(async (data) => {
        if (cancelled || !data) return;
        setMeta(data);
        setService(apiServiceToForm(data));
        if (userId) {
          const serviceLiked = await fetchServiceLikedByUser(serviceId, userId).catch(() => false);
          if (!cancelled) setLiked(serviceLiked);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [serviceId, userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUserById(userId)
      .then((profile) => {
        if (!profile) return;
        setBuyerProfile({
          firstName: profile.nombre || '',
          lastName: profile.apellido || '',
          email: profile.email || '',
        });
      })
      .catch(() => undefined);
  }, [userId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  if (!service || !meta) {
    return (
      <div className="fixed inset-0 z-50 min-h-screen bg-background p-8 text-center text-sm text-muted-foreground">
        Servicio no encontrado.
        <button type="button" className="mx-auto mt-4 block text-primary" onClick={onBack}>
          Volver
        </button>
      </div>
    );
  }

  const isOwner = isEntityOwner(userId, meta.userId);
  const canEdit = canEditEntity(userId, meta.userId, meta.coAdminIds);

  return (
    <div className="fixed inset-0 z-50 min-h-screen overflow-y-auto bg-background pb-24">
      <ServiceDetailView
        service={service}
        onBack={onBack}
        coverImageUrl={serviceCoverUrl(meta)}
        galleryUrls={meta.gallery}
        description={meta.description}
        locationLabel={service.locationLabel}
        providerUserId={meta.userId}
        onOpenProvider={() => navigate(`/users/${meta.userId}/services`)}
        rating={meta.rating}
        reviewCount={meta.reviewCount}
        providerName={serviceDisplayName(meta)}
        onLike={buildServiceLikeHandler(meta.serviceId, userId, showToast, setLiked, liked)}
        liked={liked}
        onChat={buildDetailChatHandler(userId, showToast, meta.userId, navigate)}
        onReply={buildDetailRepostHandler(meta.serviceId, {
          userId,
          showToast,
          navigate,
          entityLabel: 'Servicio',
        })}
        onShare={buildDetailShareHandler(
          `/services/${meta.serviceId}`,
          serviceDisplayName(meta) || 'Servicio',
          showToast,
        )}
        liveBooking={
          userId
            ? {
                serviceId: meta.serviceId,
                userId,
                buyer: buyerProfile,
                providerUserId: meta.userId,
              }
            : undefined
        }
        canReserve
        initialOpenBooking={openBookingOnMount}
        onEditService={canEdit ? () => navigate(`/services/${meta.serviceId}/edit`) : undefined}
        onRequireLogin={() => {
          showToast('Debes iniciar sesión para reservar', 'error');
          navigate('/auth/login', { state: { from: `/events` } });
        }}
        onRate={userId && !isOwner ? async (rating, comment) => {
          await rateServiceProvider({ serviceId: meta.serviceId, userId, rating, comment });
          showToast('Gracias por tu calificación', 'success');
        } : undefined}
      />
    </div>
  );
};

export default DiscoverServiceDetailOverlay;
