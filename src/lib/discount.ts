export function computeDiscount(
  passQty: number,
  discountValueRm: number,
): number {
  return passQty * discountValueRm;
}
