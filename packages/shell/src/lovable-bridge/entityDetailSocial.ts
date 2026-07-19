import {
  getCurrentEnv,
  likeService,
  likeVenue,
  repostPublication,
} from '@doevents/shared';

type ToastFn = (message: string, type?: 'success' | 'error') => void;

export function buildDetailShareHandler(
  path: string,
  title: string,
  showToast: ToastFn,
) {
  return async () => {
    const url = `${getCurrentEnv().webBaseUrl}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Enlace copiado al portapapeles', 'success');
      }
    } catch {
      // usuario canceló share nativo
    }
  };
}

export function buildDetailRepostHandler(
  sourceId: string,
  options: {
    userId?: string | null;
    showToast: ToastFn;
    navigate: (path: string) => void;
    entityLabel?: string;
  },
) {
  const label = options.entityLabel || 'contenido';
  return async () => {
    if (!options.userId) {
      options.showToast('Inicia sesión para repostear en el Feed', 'error');
      return;
    }
    try {
      await repostPublication(sourceId, {
        title: '',
        opinion: '',
        visibility: 'PUBLIC',
      });
      options.showToast(`${label} reposteado en tu Feed`, 'success');
      options.navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo repostear en el Feed';
      if (/reposteaste|already reposted|FEED_ALREADY_REPOSTED/i.test(message)) {
        options.showToast(`Ya reposteaste este ${label.toLowerCase()}`, 'error');
        return;
      }
      if (/FEED_REPOST_LIMIT|límite de republicaciones|republicar este contenido hasta/i.test(message)) {
        options.showToast('Alcanzaste el límite de republicaciones para este contenido', 'error');
        return;
      }
      if (/FEED_REPOST_COOLDOWN|esperar.*día/i.test(message)) {
        options.showToast(message, 'error');
        return;
      }
      options.showToast(message, 'error');
    }
  };
}

export function buildVenueLikeHandler(
  venueId: string,
  userId: string | null | undefined,
  showToast: ToastFn,
  onLiked?: (liked: boolean, likeCount?: number) => void,
  currentlyLiked = false,
) {
  return async () => {
    if (!userId) {
      showToast('Inicia sesión para guardar favoritos', 'error');
      return;
    }
    const like = !currentlyLiked;
    try {
      const result = await likeVenue(venueId, userId, like);
      onLiked?.(result.liked, result.likeCount);
      showToast(
        result.liked ? 'Lugar agregado a favoritos' : 'Lugar quitado de favoritos',
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al marcar favorito', 'error');
    }
  };
}

export function buildServiceLikeHandler(
  serviceId: string,
  userId: string | null | undefined,
  showToast: ToastFn,
  onLiked?: (liked: boolean, likeCount?: number) => void,
  currentlyLiked = false,
) {
  return async () => {
    if (!userId) {
      showToast('Inicia sesión para guardar favoritos', 'error');
      return;
    }
    const like = !currentlyLiked;
    try {
      const result = await likeService(serviceId, userId, like);
      onLiked?.(result.liked, result.likeCount);
      showToast(
        result.liked ? 'Servicio agregado a favoritos' : 'Servicio quitado de favoritos',
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al marcar favorito', 'error');
    }
  };
}

export function buildDetailChatHandler(
  userId: string | null | undefined,
  showToast: ToastFn,
  targetUserId?: string,
  navigate?: (path: string) => void,
) {
  return () => {
    if (!userId) {
      showToast('Inicia sesión para enviar mensajes', 'error');
      return;
    }
    if (targetUserId && navigate) {
      navigate(`/chat?userId=${encodeURIComponent(targetUserId)}`);
      return;
    }
    showToast('Abre el chat desde el perfil del proveedor', 'error');
  };
}
