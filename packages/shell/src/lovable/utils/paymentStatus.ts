/** Returns true if 3+ business days have passed since purchaseDate */
export const isPaymentCompleted = (purchaseDate: string): boolean => {
  const purchase = new Date(purchaseDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let businessDays = 0;
  const current = new Date(purchase);
  current.setDate(current.getDate() + 1);

  while (current <= today) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) businessDays++;
    if (businessDays >= 3) return true;
    current.setDate(current.getDate() + 1);
  }

  return false;
};

export const getPaymentStatusLabel = (authorization: 'before' | 'after', purchaseDate?: string): string => {
  if (authorization === 'after') return 'Post-evento (pendiente)';
  if (!purchaseDate) return 'Pre-evento';
  return isPaymentCompleted(purchaseDate) ? 'Pre-evento (pagado)' : 'Pre-evento (pendiente)';
};
