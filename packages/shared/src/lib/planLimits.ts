/** Límites y beneficios por plan — alineado con Lovable SubscriptionPlanSheet. */

export type UserPlanId = 'free' | 'pro';
export type PlatformRole = 'user' | 'admin';

export const PLAN_LIMITS = {
  free: {
    eventsPerYear: 8,
    ticketsPerEvent: 100,
    servicesPerYear: 2,
    placesPerYear: 2,
    publicationsPerMonth: 30,
    label: 'Gratuito',
    priceUsdAnnual: 0,
    platformFeeLabel: '8% + $1.500 COP + IVA',
  },
  pro: {
    eventsPerYear: Infinity,
    ticketsPerEvent: Infinity,
    servicesPerYear: Infinity,
    placesPerYear: Infinity,
    publicationsPerMonth: Infinity,
    label: 'PRO',
    priceUsdAnnual: 70,
    platformFeeLabel: '8% + $1.500 COP + IVA',
  },
} as const;

export function normalizePlan(plan?: string | null): UserPlanId {
  return String(plan || 'free').toLowerCase() === 'pro' ? 'pro' : 'free';
}

export function normalizePlatformRole(role?: string | null): PlatformRole {
  return String(role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';
}

export function isPlatformAdmin(role?: string | null): boolean {
  return normalizePlatformRole(role) === 'admin';
}

/** Los administradores no tienen límites de plan. */
export function effectivePlan(plan?: string | null, platformRole?: string | null): UserPlanId {
  if (isPlatformAdmin(platformRole)) return 'pro';
  return normalizePlan(plan);
}

export function getPlanLimits(plan?: string | null, platformRole?: string | null) {
  return PLAN_LIMITS[effectivePlan(plan, platformRole)];
}

export interface PlanUsageSnapshot {
  eventsThisYear: number;
  servicesThisYear: number;
  placesThisYear: number;
  publicationsThisMonth: number;
}

export interface PlanLimitCheck {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  plan: UserPlanId;
}

export function checkCanPublishEvent(
  plan?: string | null,
  platformRole?: string | null,
  usage?: Partial<PlanUsageSnapshot>,
): PlanLimitCheck {
  const p = effectivePlan(plan, platformRole);
  const limits = PLAN_LIMITS[p];
  const current = usage?.eventsThisYear ?? 0;
  if (current >= limits.eventsPerYear) {
    return {
      allowed: false,
      plan: p,
      limit: limits.eventsPerYear,
      current,
      reason: p === 'free'
        ? `Has alcanzado el límite de ${limits.eventsPerYear} eventos al año en el plan gratuito.`
        : 'Límite de eventos alcanzado.',
    };
  }
  return { allowed: true, plan: p, limit: limits.eventsPerYear, current };
}

export function checkCanPublishService(
  plan?: string | null,
  platformRole?: string | null,
  usage?: Partial<PlanUsageSnapshot>,
): PlanLimitCheck {
  const p = effectivePlan(plan, platformRole);
  const limits = PLAN_LIMITS[p];
  const current = usage?.servicesThisYear ?? 0;
  if (current >= limits.servicesPerYear) {
    return {
      allowed: false,
      plan: p,
      limit: limits.servicesPerYear,
      current,
      reason: `Has alcanzado el límite de ${limits.servicesPerYear} servicios al año en tu plan.`,
    };
  }
  return { allowed: true, plan: p, limit: limits.servicesPerYear, current };
}

export function checkCanPublishPlace(
  plan?: string | null,
  platformRole?: string | null,
  usage?: Partial<PlanUsageSnapshot>,
): PlanLimitCheck {
  const p = effectivePlan(plan, platformRole);
  const limits = PLAN_LIMITS[p];
  const current = usage?.placesThisYear ?? 0;
  if (current >= limits.placesPerYear) {
    return {
      allowed: false,
      plan: p,
      limit: limits.placesPerYear,
      current,
      reason: `Has alcanzado el límite de ${limits.placesPerYear} lugares al año en tu plan.`,
    };
  }
  return { allowed: true, plan: p, limit: limits.placesPerYear, current };
}

export function checkTicketCapacity(
  plan?: string | null,
  platformRole?: string | null,
  ticketCount?: number,
): PlanLimitCheck {
  const p = effectivePlan(plan, platformRole);
  const limit = PLAN_LIMITS[p].ticketsPerEvent;
  const current = ticketCount ?? 0;
  if (current > limit) {
    return {
      allowed: false,
      plan: p,
      limit,
      current,
      reason: p === 'free'
        ? `El plan gratuito permite hasta ${limit} boletas por evento. Actualiza a PRO para ilimitadas.`
        : 'Capacidad de boletas excedida.',
    };
  }
  return { allowed: true, plan: p, limit, current };
}
