import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, Crown, Gift, Check, Loader2 } from 'lucide-react';
import {
  Loader,
  PLAN_LIMITS,
  RootState,
  cancelProSubscription,
  createProSubscriptionPayment,
  fetchSubscriptionStatus,
  fetchUserById,
  normalizePlan,
  useToast,
} from '@doevents/shared';
import type { PlanId } from '@lovable/components/legal/PlanDetailView';

const planHighlights: Record<PlanId, string[]> = {
  free: [
    `${PLAN_LIMITS.free.eventsPerYear} eventos al año`,
    `${PLAN_LIMITS.free.ticketsPerEvent} boletas por evento`,
    `${PLAN_LIMITS.free.servicesPerYear} servicios al año`,
    `${PLAN_LIMITS.free.placesPerYear} lugares al año`,
    'Mapa de eventos, lugares y servicios',
    'Perfil y feed social',
  ],
  pro: [
    'Eventos ilimitados al año',
    'Boletas ilimitadas por evento',
    'Servicios y lugares ilimitados',
    'Control de accesos con QR',
    'Códigos promocionales y CRM de invitados',
    'Marketing digital y notificaciones',
  ],
};

export const PlansCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId>('free');

  const loadPlan = useCallback(async () => {
    if (!userId) return;
    try {
      const status = await fetchSubscriptionStatus(userId).catch(() => null);
      if (status?.plan) {
        setCurrentPlan(normalizePlan(status.plan));
      } else {
        const user = await fetchUserById(userId);
        setCurrentPlan(normalizePlan(user?.plan));
      }
    } catch {
      showToast('No se pudo cargar tu plan', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const handleAcquirePro = async () => {
    if (!userId || currentPlan === 'pro') return;
    setBusy(true);
    try {
      const checkout = await createProSubscriptionPayment(userId);
      if (checkout.urlPaymentLink) {
        window.location.href = checkout.urlPaymentLink;
        return;
      }
      setCurrentPlan('pro');
      showToast('¡Plan PRO activado!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo iniciar el pago', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const plans: Array<{ id: PlanId; highlighted?: boolean }> = [
    { id: 'free' },
    { id: 'pro', highlighted: true },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-10">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="mb-4 flex items-center gap-1 font-medium text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
          Volver al perfil
        </button>

        <h1 className="text-2xl font-extrabold text-primary">Planes disponibles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compara beneficios y elige el plan que mejor se adapte a ti.
        </p>

        <div className="mt-6 space-y-4">
          {plans.map(({ id, highlighted }) => {
            const meta = PLAN_LIMITS[id];
            const isCurrent = currentPlan === id;
            const isPro = id === 'pro';
            const Icon = isPro ? Crown : Gift;

            return (
              <article
                key={id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  highlighted
                    ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-card'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        isPro ? 'bg-amber-100' : 'bg-primary/10'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isPro ? 'text-amber-500' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{meta.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {isPro ? `$${meta.priceUsdAnnual} USD / año` : 'Gratis para siempre'}
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Tu plan actual
                    </span>
                  )}
                </div>

                <ul className="mt-4 space-y-2">
                  {planHighlights[id].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs text-muted-foreground">
                  Comisión plataforma: {meta.platformFeeLabel} por boleto vendido
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate('/profile/plan/detail')}
                    className="flex-1 rounded-full border border-primary py-2.5 text-sm font-semibold text-primary"
                  >
                    Ver detalle
                  </button>
                  {isPro ? (
                    <button
                      type="button"
                      disabled={isCurrent || busy}
                      onClick={() => void handleAcquirePro()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isCurrent ? 'Plan activo' : 'Contratar PRO'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => navigate('/profile/plan/detail')}
                      className="flex-1 rounded-full bg-muted py-2.5 text-sm font-semibold text-foreground disabled:opacity-50"
                    >
                      {isCurrent ? 'Plan activo' : 'Plan incluido'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlansCatalogPage;
