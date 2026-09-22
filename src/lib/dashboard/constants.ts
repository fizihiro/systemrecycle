/** Handover Economic & Circularity Constants */
export const INCENTIVE_PER_KG = 0.6; // RM 0.60 / kg
export const LOGISTICS_TRIP_COST_RM = 150.0; // RM 150 / trip
export const RPP_VALUE_PER_KG = 3.55; // RM 3.55 / kg rPP
export const DEFAULT_EMPTY_SACK_WEIGHT_G = 80.0; // 80g standard (P & ONN)
export const SACK_ESTIMATED_WEIGHT_KG = DEFAULT_EMPTY_SACK_WEIGHT_G / 1000; // 0.08 kg

/**
 * Convert sack pieces to kg dynamically:
 * (pieces * empty_sack_weight_g) / 1000
 */
export function piecesToKg(pieces: number, emptySackWeightG: number = DEFAULT_EMPTY_SACK_WEIGHT_G): number {
  return Math.round(((pieces * emptySackWeightG) / 1000) * 100) / 100;
}

/**
 * Convert sack pieces to tonnes dynamically:
 * (pieces * empty_sack_weight_g) / 1,000,000
 */
export function piecesToTonnes(pieces: number, emptySackWeightG: number = DEFAULT_EMPTY_SACK_WEIGHT_G): number {
  return Math.round(((pieces * emptySackWeightG) / 1_000_000) * 10000) / 10000;
}

/**
 * Convert kg to tonnes:
 * kg / 1000
 */
export function kgToTonnes(kg: number): number {
  return Math.round((kg / 1000) * 10000) / 10000;
}

export function estimateSackWeightKg(pieces: number, emptySackWeightG: number = DEFAULT_EMPTY_SACK_WEIGHT_G): number {
  return piecesToKg(pieces, emptySackWeightG);
}

export function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
