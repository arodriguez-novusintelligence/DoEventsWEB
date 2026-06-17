import React from 'react';

export type IntegrationNoticeVariant = 'warning' | 'info';

export interface IntegrationNoticeProps {
  title: string;
  message: string;
  variant?: IntegrationNoticeVariant;
}

export const IntegrationNotice: React.FC<IntegrationNoticeProps> = ({
  title,
  message,
  variant = 'warning',
}) => (
  <aside className={`de-integration-notice de-integration-notice--${variant}`} role="status">
    <span className="de-integration-notice__icon" aria-hidden="true">⚠</span>
    <div>
      <p className="de-integration-notice__title">{title}</p>
      <p className="de-integration-notice__message">{message}</p>
    </div>
  </aside>
);

export const PaymentGatewayNotice: React.FC = () => (
  <IntegrationNotice
    title="Pasarela de pago pendiente"
    message="El flujo actual simula el pago en QA. Falta integrar la app de la pasarela (Wompi/PSE) antes de producción."
    variant="warning"
  />
);

export const ChatIntegrationNotice: React.FC = () => (
  <IntegrationNotice
    title="App de chat en integración"
    message="Puedes ver salas y mensajes recientes vía API. Falta conectar la app WebSocket en tiempo real para enviar mensajes."
    variant="info"
  />
);
