import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfileVisibility, useToast } from '@doevents/shared';

export interface ProfileSettingsPanelProps {
  userId: string;
  plan?: string;
  isPublicProfile?: boolean;
  onVisibilityChange?: (isPublic: boolean) => void;
  onOpenBankData: () => void;
}

export const ProfileSettingsPanel: React.FC<ProfileSettingsPanelProps> = ({
  userId,
  plan = 'free',
  isPublicProfile = true,
  onVisibilityChange,
  onOpenBankData,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(isPublicProfile);
  const [busy, setBusy] = useState(false);

  const planLabel = plan.toLowerCase() === 'pro' ? 'PRO' : 'Free';

  const toggleVisibility = async () => {
    setBusy(true);
    try {
      const next = !isPublic;
      await updateProfileVisibility(userId, next);
      setIsPublic(next);
      onVisibilityChange?.(next);
      showToast(
        next
          ? 'Tu perfil es público: todos pueden ver tu contenido'
          : 'Perfil privado: solo tus seguidores verán tu contenido',
        'success',
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="de-profile-settings">
      <button
        type="button"
        className="de-profile-settings__subscription"
        onClick={() => setSubscriptionOpen((v) => !v)}
      >
        <span className="de-profile-settings__icon de-profile-settings__icon--gold">💳</span>
        <span className="de-profile-settings__text">
          <small>Mi suscripción</small>
          <strong>Plan {planLabel}</strong>
        </span>
        <span className="de-profile-settings__badges">
          <em className="de-profile-settings__badge de-profile-settings__badge--plan">{planLabel}</em>
          <em className="de-profile-settings__badge de-profile-settings__badge--active">Activo</em>
        </span>
        <span aria-hidden="true">{subscriptionOpen ? '⌃' : '⌄'}</span>
      </button>

      {subscriptionOpen && (
        <div className="de-profile-settings__subscription-body">
          <p>Tu plan actual es <strong>{planLabel}</strong>. Consulta beneficios y tarifas en el detalle del plan.</p>
          <div className="de-profile-settings__subscription-actions">
            <button type="button" className="de-profile-pill-btn de-profile-pill-btn--outline" onClick={() => navigate('/profile/plan/detail')}>
              Ver detalle del plan
            </button>
            <button type="button" className="de-profile-pill-btn" onClick={() => navigate('/profile/plans')}>
              Ver todos los planes
            </button>
          </div>
        </div>
      )}

      <div className="de-profile-settings__notice">
        <span aria-hidden="true">ℹ️</span>
        <p>
          Actualmente los límites de publicación de eventos no están activos. Próximamente se habilitará el Plan PRO con funcionalidades adicionales de pago.
        </p>
      </div>

      <div className="de-profile-settings__item">
        <span className="de-profile-settings__icon">🔒</span>
        <div className="de-profile-settings__item-text">
          <strong>Perfil privado</strong>
          <span>
            {isPublic
              ? 'Tu perfil y publicaciones son visibles para todos'
              : 'Solo tus seguidores pueden ver tu perfil, eventos, lugares y servicios'}
          </span>
        </div>
        <button
          type="button"
          className={`de-profile-toggle${!isPublic ? ' de-profile-toggle--on' : ''}`}
          aria-pressed={!isPublic}
          disabled={busy}
          onClick={toggleVisibility}
        >
          <span />
        </button>
      </div>

      <button type="button" className="de-profile-settings__link" onClick={() => navigate('/auth/forgot-password')}>
        <span className="de-profile-settings__icon">🔑</span>
        <span>Cambiar contraseña</span>
        <span aria-hidden="true">›</span>
      </button>

      <button type="button" className="de-profile-settings__link" onClick={() => navigate('/auth/gustos')}>
        <span className="de-profile-settings__icon">😊</span>
        <span>Editar gustos</span>
        <span aria-hidden="true">›</span>
      </button>

      <button type="button" className="de-profile-settings__link" onClick={onOpenBankData}>
        <span className="de-profile-settings__icon">🏦</span>
        <span>Editar / Agregar datos bancarios</span>
        <span aria-hidden="true">›</span>
      </button>
    </article>
  );
};

export default ProfileSettingsPanel;
