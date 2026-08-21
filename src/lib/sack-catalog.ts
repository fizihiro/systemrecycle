export const PRODUCT_CATEGORIES = ["Fertiliser", "Animal Feed"] as const;

export const MATERIAL_TYPES = [
  "Plain / non-laminated woven PP",
  "Laminated/coated woven PP",
  "BOPP-laminated woven PP",
  "Woven PP + inner PE liner",
  "FIBC / jumbo PP bag",
] as const;

export const SIZE_KG_BY_CATEGORY = {
  Fertiliser: [25, 40, 50],
  "Animal Feed": [20, 25, 50],
} as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export type SackCatalogFields = {
  productCategory: string;
  materialType: string;
  sizeKg: number;
};

export function formatSackLabel({
  productCategory,
  materialType,
  sizeKg,
}: SackCatalogFields) {
  return `${productCategory} · ${sizeKg}kg · ${materialType}`;
}

export function formatSackShortLabel({
  productCategory,
  sizeKg,
}: Pick<SackCatalogFields, "productCategory" | "sizeKg">) {
  return `${productCategory} ${sizeKg}kg`;
}

export function emptySackWeightKg(sizeKg: number) {
  return Math.round(sizeKg * 3.6) / 1000;
}

export function discountForSizeKg(sizeKg: number) {
  return Math.round(sizeKg * 0.05 * 100) / 100;
}
