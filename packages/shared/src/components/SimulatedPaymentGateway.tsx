import React from 'react';
import { Button } from './UI';
import { PaymentGatewayNotice } from './IntegrationNotice';

export interface SimulatedPaymentGatewayProps {
  orderId: string;
  totalAmount: number;
  paying: boolean;
  onSimulatePayment: () => void;
}

export const SimulatedPaymentGateway: React.FC<SimulatedPaymentGatewayProps> = ({
  orderId,
  totalAmount,
  paying,
  onSimulatePayment,
}) => (
  <section className="de-card de-card--lovable de-card--compact de-simulated-gateway">
    <PaymentGatewayNotice />

    <div className="de-simulated-gateway__panel">
      <header className="de-simulated-gateway__header">
        <span className="de-simulated-gateway__brand">DoEvents Pay</span>
        <span className="de-simulated-gateway__badge">Simulación QA</span>
      </header>

      <div className="de-simulated-gateway__body">
        <p>Referencia: <strong>{orderId}</strong></p>
        <p className="de-simulated-gateway__amount">
          ${totalAmount.toLocaleString('es-CO')} <span>COP</span>
        </p>
        <p className="de-wall-intro">
          En producción serás redirigido a la pasarela real. Aquí confirmamos el pago de forma simulada.
        </p>
      </div>

      <Button
        label={paying ? 'Procesando pago simulado...' : 'Simular pago aprobado (QA)'}
        tone="lovable"
        disabled={paying}
        onClick={onSimulatePayment}
      />
    </div>
  </section>
);
