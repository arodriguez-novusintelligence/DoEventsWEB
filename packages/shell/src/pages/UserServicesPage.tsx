import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { useSelector } from 'react-redux';

import {

  deleteServiceProvider,

  fetchServicesByUserId,

  fetchUserById,

  invalidateServicesCache,

  Loader,

  NearbyServiceProvider,

  resolveImageUrl,

  RootState,

  SERVICES_CACHE_INVALIDATED_EVENT,

  useToast,

} from '@doevents/shared';

import MyServicesView from '@lovable/components/services/MyServicesView';

import UserServicesGrid from '@lovable/components/services/UserServicesGrid';

import { nearbyServiceToFormData } from '../lovable-bridge/servicesAdapter';

import type { ServiceFormData } from '@lovable/data/servicesData';

import { StoryAvatar } from '../components/StoryAvatar';



export const UserServicesPage: React.FC = () => {

  const { userId } = useParams<{ userId: string }>();

  const navigate = useNavigate();

  const { showToast } = useToast();

  const currentUserId = useSelector((s: RootState) => s.auth.idUser);

  const isOwner = Boolean(userId && currentUserId && userId === currentUserId);

  const [loading, setLoading] = useState(true);

  const [profileName, setProfileName] = useState('Perfil');

  const [profileAvatar, setProfileAvatar] = useState<string | undefined>();

  const [services, setServices] = useState<ServiceFormData[]>([]);

  const [serviceItems, setServiceItems] = useState<NearbyServiceProvider[]>([]);



  const load = useCallback(async (forceNetwork = false) => {

    if (!userId) return;

    setLoading(true);

    try {

      const [user, items] = await Promise.all([

        fetchUserById(userId).catch(() => null),

        fetchServicesByUserId(userId, { forceNetwork, includeInactive: isOwner }).catch(() => []),

      ]);

      const name = [user?.nombre, user?.apellido].filter(Boolean).join(' ')

        || user?.username

        || 'Perfil';

      setProfileName(name);

      setProfileAvatar(resolveImageUrl(user?.imagen) || undefined);

      setServiceItems(items);

      setServices(items.map(nearbyServiceToFormData));

    } finally {

      setLoading(false);

    }

  }, [userId]);



  useEffect(() => {

    void load();

    const handler = () => { void load(true); };

    window.addEventListener(SERVICES_CACHE_INVALIDATED_EVENT, handler);

    return () => window.removeEventListener(SERVICES_CACHE_INVALIDATED_EVENT, handler);

  }, [load]);



  const defaultProfileImageUrl = useMemo(

    () => profileAvatar || services[0]?.coverImageUrl,

    [profileAvatar, services],

  );



  if (loading) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center bg-background">

        <Loader />

      </div>

    );

  }



  if (isOwner) {

    return (

      <div className="min-h-screen bg-secondary">

        <MyServicesView

          onBack={() => navigate('/profile')}

          publishedServices={services}

          defaultProfileImageUrl={defaultProfileImageUrl}

          onPublish={() => navigate('/services/create')}

          onEditService={(service) => {

            if (service.serviceId) navigate(`/services/${service.serviceId}/edit`);

          }}

          onDeleteService={async (service) => {

            if (!service.serviceId || !currentUserId) return;

            await deleteServiceProvider(service.serviceId, currentUserId);

            invalidateServicesCache();

            setServices((prev) => prev.filter((s) => s.serviceId !== service.serviceId));

            setServiceItems((prev) => prev.filter((s) => s.serviceId !== service.serviceId));

            showToast('Servicio eliminado', 'success');

          }}

          onDuplicateService={(service) => {

            navigate('/services/create', { state: { duplicateFrom: service } });

          }}

          onOpenService={(service) => {
            if (service.serviceId) navigate(`/services/${service.serviceId}`);
          }}

        />

      </div>

    );

  }



  return (

    <UserServicesGrid

      profileName={profileName}

      profileAvatar={profileAvatar}

      services={serviceItems}
      viewerUserId={currentUserId || undefined}
      onBack={() => navigate(-1)}

      onOpenService={(serviceId) => navigate(`/services/${serviceId}`)}

    />

  );

};



export default UserServicesPage;

