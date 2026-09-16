import { z } from "zod";

import {
  MATERIAL_TYPES,
  PRODUCT_CATEGORIES,
  SIZE_KG_BY_CATEGORY,
  type ProductCategory,
} from "@/lib/sack-catalog";

const positiveInt = z.coerce.number().int().positive();
const positiveDecimal = z.coerce.number().positive();
const nonNegativeDecimal = z.coerce.number().min(0);
const requiredString = z.string().trim().min(1, "This field is required");

export const sackCatalogSchema = z
  .object({
    productCategory: z.enum(PRODUCT_CATEGORIES),
    materialType: z.enum(MATERIAL_TYPES),
    sizeKg: positiveInt,
    discountValueRm: nonNegativeDecimal,
  })
  .superRefine((data, ctx) => {
    const allowedSizes =
      SIZE_KG_BY_CATEGORY[data.productCategory as ProductCategory];
    if (!(allowedSizes as readonly number[]).includes(data.sizeKg)) {
      ctx.addIssue({
        code: "custom",
        message: `Size must be one of ${allowedSizes.join(", ")}kg for ${data.productCategory}.`,
        path: ["sizeKg"],
      });
    }
  });

export const farmerSchema = z.object({
  name: requiredString,
  phone: requiredString,
  address: requiredString,
});

export const supplierSchema = z.object({
  companyName: requiredString,
  location: requiredString,
  phone: requiredString,
});

export const collectorSchema = z.object({
  companyName: requiredString,
  processCapacityKg: positiveDecimal,
  phone: requiredString,
});

export const fertilizerDistributionSchema = z.object({
  date: requiredString,
  supplierId: positiveInt,
  farmerId: positiveInt,
  sackId: positiveInt,
  quantity: positiveInt,
});

export const sackReturnSchema = z.object({
  date: requiredString,
  farmerId: positiveInt,
  supplierId: positiveInt,
  sackId: positiveInt,
  quantity: positiveInt,
  totalDiscountRm: nonNegativeDecimal,
});

export const collectorDeliverySchema = z.object({
  date: requiredString,
  supplierId: positiveInt,
  collectorId: positiveInt,
  sackQty: positiveInt,
  inputWeightKg: positiveDecimal,
  outputWeightKg: nonNegativeDecimal,
});

export type SackCatalogInput = z.infer<typeof sackCatalogSchema>;
export type FarmerInput = z.infer<typeof farmerSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type CollectorInput = z.infer<typeof collectorSchema>;
export type FertilizerDistributionInput = z.infer<
  typeof fertilizerDistributionSchema
>;
export type SackReturnInput = z.infer<typeof sackReturnSchema>;
export type CollectorDeliveryInput = z.infer<typeof collectorDeliverySchema>;
