import React from 'react';
import { Button } from '@doevents/shared';

interface CreateEventLandingProps {
  onStart: () => void;
}

export const CreateEventLanding: React.FC<CreateEventLandingProps> = ({ onStart }) => (
  <div className="de-wizard-landing">
    <header className="de-wizard-landing__header">
      <span className="de-wizard-landing__logo">Do<span>•</span>events</span>
      <button type="button" className="de-wizard-landing__cta-small" onClick={onStart}>
        Crear evento
      </button>
    </header>
    <main className="de-wizard-landing__hero">
      <span className="de-wizard-landing__badge">Nuevo flujo de creación</span>
      <h1>Diseña el plano de tu evento como un arquitecto.</h1>
      <p>
        Olvídate de los formularios eternos. Dibuja zonas, asigna precios y publica tu silletería en 3 pasos.
      </p>
      <Button label="Empezar ahora" tone="lovable" onClick={onStart} />
    </main>
  </div>
);

export default CreateEventLanding;
