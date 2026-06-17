import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Loader,
  PLAN_TERMS,
  PRO_PLAN_FEATURES,
  PlanPricingBanner,
  RootState,
  createProSubscriptionPayment,
  useToast,
} from '@doevents/shared';

export const PlanProPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { showToast } = useToast();
  const [openId, setOpenId] = useState<string | null>(PRO_PLAN_FEATURES[0]?.id || null);
  const [busy, setBusy] = useState(false);

  const handleAcquire = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const checkout = await createProSubscriptionPayment(userId);
      if (checkout.urlPaymentLink) {
        window.location.href = checkout.urlPaymentLink;
        return;
      }
      if (checkout.freeCheckout) {
        showToast('¡Plan PRO activado!', 'success');
        navigate('/profile/plan/detail');
        return;
      }
      throw new Error('No se recibió enlace de pago');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo adquirir el plan', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="de-plan-page">
      <button type="button" className="de-profile-pill-btn de-profile-pill-btn--outline" onClick={() => navigate('/profile/plans')}>
        ← Volver
      </button>

      <article className="de-plan-hero" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Plan recomendado</p>
        <h1 style={{ margin: '8px 0 4px' }}>Plan PRO</h1>
        <p style={{ color: '#6B7280', fontSize: 14 }}>
          Herramientas profesionales para creadores de eventos exigentes.
        </p>
      </article>

      <PlanPricingBanner />

      {PRO_PLAN_FEATURES.map((feature) => {
        const expanded = openId === feature.id;
        return (
          <div key={feature.id} className="de-plan-feature">
            <button
              type="button"
              className="de-plan-feature__head"
              onClick={() => setOpenId(expanded ? null : feature.id)}
            >
              <span className="de-plan-feature__icon">✓</span>
              <strong style={{ flex: 1 }}>{feature.title}</strong>
              <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
            </button>
            {expanded && <p className="de-plan-feature__body">{feature.detail}</p>}
          </div>
        );
      })}

      <div className="de-plan-actions">
        <button type="button" className="de-plan-btn de-plan-btn--pro" disabled={busy} onClick={handleAcquire}>
          {busy ? 'Procesando…' : 'Adquirir plan PRO'}
        </button>
        <button type="button" className="de-plan-btn de-plan-btn--outline" onClick={() => navigate('/profile/plan/detail')}>
          Más detalle del plan
        </button>
      </div>

      <section className="de-plan-terms">
        <h4>Términos y condiciones</h4>
        <ul>
          {PLAN_TERMS.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default PlanProPage;
