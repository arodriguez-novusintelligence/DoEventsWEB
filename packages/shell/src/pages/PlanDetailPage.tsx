import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Loader,
  RootState,
  cancelProSubscription,
  createProSubscriptionPayment,
  fetchSubscriptionStatus,
  fetchUserById,
  normalizePlan,
  useToast,
} from '@doevents/shared';
import PlanDetailView, { type PlanId } from '@lovable/components/legal/PlanDetailView';

export const PlanDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanId>('free');
  const [busy, setBusy] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!userId) return;
    try {
      const status = await fetchSubscriptionStatus(userId).catch(() => null);
      if (status?.plan) {
        setPlan(normalizePlan(status.plan));
      } else {
        const user = await fetchUserById(userId);
        setPlan(normalizePlan(user?.plan));
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

  const handleUpgrade = async () => {
    if (!userId || plan === 'pro' || busy) return;
    setBusy(true);
    try {
      const checkout = await createProSubscriptionPayment(userId);
      if (checkout.urlPaymentLink) {
        window.location.href = checkout.urlPaymentLink;
        return;
      }
      setPlan('pro');
      showToast('¡Plan PRO activado!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo adquirir PRO', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!userId || plan !== 'pro' || busy) return;
    setBusy(true);
    try {
      await cancelProSubscription(userId);
      setPlan('free');
      showToast('Plan PRO cancelado', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al cancelar', 'error');
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

  return (
    <PlanDetailView
      planId={plan}
      onBack={() => navigate('/profile')}
      onViewAllPlans={() => navigate('/profile/plans')}
      onUpgrade={plan === 'pro' ? undefined : handleUpgrade}
      onCancelPlan={plan === 'pro' ? handleCancel : undefined}
    />
  );
};

export default PlanDetailPage;
