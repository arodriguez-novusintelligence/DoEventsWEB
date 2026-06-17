import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  canEditEntity,
  deleteServiceProvider,
  fetchServiceById,
  fetchServiceLikedByUser,
  fetchUserById,
  invalidateServicesCache,
  isEntityOwner,
  Loader,
  NearbyServiceProvider,
  rateServiceProvider,
  RootState,
  useToast,
} from '@doevents/shared';
import { DeleteOwnItemButton } from '../components/DeleteOwnItemButton';
import { CoAdminSection } from '../components/CoAdminSection';
import ServiceDetailView from '@lovable/components/services/ServiceDetailView';
import type { ServiceFormData } from '@lovable/data/servicesData';
import { apiServiceToForm, serviceCoverUrl, serviceDisplayName } from '../lovable-bridge/serviceFormMapper';
import {
  buildDetailChatHandler,
  buildDetailRepostHandler,
  buildDetailShareHandler,
  buildServiceLikeHandler,
} from '../lovable-bridge/entityDetailSocial';

export const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
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
    if (!serviceId) return;
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!service || !meta) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Servicio no encontrado.
        <button type="button" className="block mx-auto mt-4 text-primary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  const isOwner = isEntityOwner(userId, meta.userId);
  const canEdit = canEditEntity(userId, meta.userId, meta.coAdminIds);

  return (
    <div className="mx-auto max-w-lg pb-52">
      <ServiceDetailView
        service={service}
        onBack={() => navigate(-1)}
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
          userId && !isOwner
            ? {
                serviceId: meta.serviceId,
                userId,
                buyer: buyerProfile,
                providerUserId: meta.userId,
              }
            : undefined
        }
        canReserve={!isOwner}
        onRequireLogin={() => {
          showToast('Debes iniciar sesión para reservar', 'error');
          navigate('/auth/login', { state: { from: `/services/${meta.serviceId}` } });
        }}
        onRate={userId && !isOwner ? async (rating, comment) => {
          await rateServiceProvider({ serviceId: meta.serviceId, userId, rating, comment });
          showToast('Gracias por tu calificación', 'success');
        } : undefined}
      />
      {(canEdit || isOwner) && (
        <div className="px-4 pb-8 space-y-4">
          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`/services/${meta.serviceId}/edit`)}
              className="w-full rounded-full border border-primary py-3 text-sm font-semibold text-primary"
            >
              Editar servicio
            </button>
          )}
          {isOwner && userId && (
            <CoAdminSection
              entityType="SERVICE"
              entityId={meta.serviceId}
              ownerUserId={meta.userId}
              currentUserId={userId}
              coAdminIds={meta.coAdminIds}
              entityName={meta.name}
            />
          )}
          {isOwner && userId && (
          <DeleteOwnItemButton
            label="este servicio"
            onDelete={async () => {
              await deleteServiceProvider(meta.serviceId, userId);
              invalidateServicesCache();
              showToast('Servicio eliminado', 'success');
              navigate('/profile');
            }}
          />
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceDetailPage;
