/** Estimated empty sack weight (kg) per piece for apple-to-apple weight comparison. */
export const SACK_ESTIMATED_WEIGHT_KG = 0.1;

export function estimateSackWeightKg(pieces: number) {
  return Math.round(pieces * SACK_ESTIMATED_WEIGHT_KG * 100) / 100;
}

export function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
