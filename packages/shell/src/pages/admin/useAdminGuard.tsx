import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserById, fetchSubscriptionStatus, canAccessAdminPanel, Loader, useToast } from '@doevents/shared';

export function useAdminGuard(userId?: string | null) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate('/auth/login', { replace: true });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [profile, subscription] = await Promise.all([
          fetchUserById(userId).catch(() => null),
          fetchSubscriptionStatus(userId).catch(() => null),
        ]);
        const admin = canAccessAdminPanel(profile?.platformRole)
          || canAccessAdminPanel(subscription?.platformRole);
        if (!admin) {
          showToast('No tienes permisos de administrador', 'error');
          navigate('/profile', { replace: true });
          return;
        }
        if (!cancelled) {
          setIsAdmin(true);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          showToast('Error al verificar permisos', 'error');
          navigate('/profile', { replace: true });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [userId, navigate, showToast]);

  return { ready, isAdmin };
}

export function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader />
    </div>
  );
}
