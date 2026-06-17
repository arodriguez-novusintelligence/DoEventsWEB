import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserById, isPlatformAdmin, Loader, useToast } from '@doevents/shared';

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
        const profile = await fetchUserById(userId);
        const admin = isPlatformAdmin(profile?.platformRole);
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
