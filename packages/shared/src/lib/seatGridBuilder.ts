import type { WizardSeat } from '../types/venueWizard';

export function newWizardId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function rowLabelFromIndex(index: number): string {
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

export function buildSeatGrid(rows: number, seatsPerRow: number): WizardSeat[] {
  const seats: WizardSeat[] = [];
  for (let r = 0; r < rows; r += 1) {
    const rowLabel = rowLabelFromIndex(r);
    for (let c = 1; c <= seatsPerRow; c += 1) {
      seats.push({
        seatId: newWizardId(),
        rowLabel,
        colNumber: c,
        seatCode: `${rowLabel}${c}`,
        seatType: 'standard',
        status: 'available',
        isAccessible: false,
      });
    }
  }
  return seats;
}
