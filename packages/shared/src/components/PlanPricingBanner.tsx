import React from 'react';
import { PLATFORM_PRICING } from '../data/planFeatures';

export const PlanPricingBanner: React.FC = () => (
  <section className="de-plan-pricing" aria-label="Costos de la plataforma">
    <p className="de-plan-pricing__fee">{PLATFORM_PRICING.feeLabel}</p>
    <p>{PLATFORM_PRICING.summary}</p>
    <p>{PLATFORM_PRICING.ivaNote}</p>
    <p>Esta comisión incluye:</p>
    <ul>
      {PLATFORM_PRICING.includes.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
    <a href={PLATFORM_PRICING.detailUrl} target="_blank" rel="noreferrer">
      {PLATFORM_PRICING.detailLinkLabel}
    </a>
  </section>
);

export default PlanPricingBanner;
