/**
 * Fórmula alineada con aws-lambda-checkouts (8% + 1.500 COP + IVA 19% sobre servicio+fijo).
 * Aplicada por boleta/silla.
 */
export const PLATFORM_FEE_LABEL = '8% + 1.500 COP + IVA';

export function computeTicketServiceFee(unitPriceCop: number): number {
  const price = Math.max(0, Number(unitPriceCop) || 0);
  if (price <= 0) return 0;
  const taxService = price * 0.08;
  const taxIva = (taxService + 1500) * 0.19;
  return Math.round(taxService + 1500 + taxIva);
}

export function computeOrderFeeBreakdown(unitPrices: number[]): {
  subtotal: number;
  serviceFee: number;
  total: number;
  ticketCount: number;
} {
  const subtotal = unitPrices.reduce((sum, price) => sum + Math.max(0, Number(price) || 0), 0);
  const serviceFee = unitPrices.reduce((sum, price) => sum + computeTicketServiceFee(price), 0);
  return {
    subtotal,
    serviceFee,
    total: subtotal + serviceFee,
    ticketCount: unitPrices.length,
  };
}

/**
 * Desglose de reembolso: solo se devuelve el valor facial de la boleta.
 * Las comisiones de plataforma (8% + $1.500 + IVA) no son reembolsables.
 */
export function computeRefundBreakdown(
  unitPrices: number[],
  explicitFees?: number[],
): {
  subtotal: number;
  platformFee: number;
  refundTotal: number;
  ticketCount: number;
  avgValue: number;
} {
  const prices = unitPrices.map((p) => Math.max(0, Number(p) || 0));
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  const platformFee = prices.reduce((sum, price, index) => {
    const explicit = explicitFees?.[index];
    if (explicit != null && Number.isFinite(Number(explicit)) && Number(explicit) >= 0) {
      return sum + Number(explicit);
    }
    return sum + computeTicketServiceFee(price);
  }, 0);
  const ticketCount = prices.length;
  return {
    subtotal,
    platformFee,
    refundTotal: subtotal,
    ticketCount,
    avgValue: ticketCount ? Math.round(subtotal / ticketCount) : 0,
  };
}
