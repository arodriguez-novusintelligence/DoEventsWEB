/**
 * Fórmula alineada con aws-lambda-checkouts (8% + 1.500 COP + IVA 19% sobre servicio+fijo).
 * Aplicada por boleta/silla.
 */
export const PLATFORM_FEE_LABEL = '8% + 1.500 COP + IVA';

export function computeTicketServiceFee(unitPriceCop: number): number {
  const price = Math.max(0, Number(unitPriceCop) || 0);
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
