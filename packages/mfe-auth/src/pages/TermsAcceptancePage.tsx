import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, useToast } from '@doevents/shared';

const TERMS_ACCEPTED_KEY = 'doevents_terms_accepted';

export function persistTermsAccepted(): void {
  sessionStorage.setItem(TERMS_ACCEPTED_KEY, '1');
}

export function hasAcceptedTerms(): boolean {
  return sessionStorage.getItem(TERMS_ACCEPTED_KEY) === '1';
}

export function clearTermsAccepted(): void {
  sessionStorage.removeItem(TERMS_ACCEPTED_KEY);
}

export const TermsAcceptancePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    if (!accepted) {
      showToast('Debes aceptar los términos y condiciones', 'error');
      return;
    }
    persistTermsAccepted();
    navigate('/auth/gustos', { replace: true });
  };

  return (
    <div className="de-page de-page--login de-page--auth-shell">
      <div className="de-auth-shell">
        <aside className="de-auth-shell__hero">
          <p className="de-auth-shell__badge">Paso 1 de 2</p>
          <h1>Do<span>•</span>events</h1>
          <p>Antes de personalizar tu experiencia, confirma que aceptas nuestras condiciones de uso.</p>
        </aside>
        <div className="de-card de-card--lovable de-login-card de-auth-shell__card">
          <h2>Términos y condiciones</h2>
          <p className="de-login-subtitle" style={{ textAlign: 'left' }}>
            DoEvents te permite descubrir, crear y compartir eventos cerca de ti. Al continuar aceptas el tratamiento de tus datos,
            las reglas de la comunidad y las políticas de publicación de contenido.
          </p>
          <label className="de-terms-check">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>Acepto los términos y condiciones y la política de privacidad de DoEvents</span>
          </label>
          <Button label="Continuar a mis gustos" tone="lovable" disabled={!accepted} onClick={handleContinue} />
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptancePage;
