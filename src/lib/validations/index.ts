import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().min(0);
const positiveDecimal = z.coerce.number().positive();
const nonNegativeDecimal = z.coerce.number().min(0);
const requiredString = z.string().trim().min(1, "This field is required");
const optionalString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value))
  .optional();

export const sackCatalogSchema = z.object({
  fertilizerType: requiredString,
  discountValueRm: nonNegativeDecimal,
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

export const recyclerSchema = z.object({
  companyName: requiredString,
  processCapacityKg: positiveDecimal,
  phone: requiredString,
});

export const manufacturerSchema = z.object({
  companyName: requiredString,
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
  passQty: nonNegativeInt,
  rejectQty: nonNegativeInt,
  rejectReason: optionalString,
  totalDiscountRm: nonNegativeDecimal,
});

export const recyclerDeliverySchema = z.object({
  date: requiredString,
  supplierId: positiveInt,
  recyclerId: positiveInt,
  sackQty: positiveInt,
  inputWeightKg: positiveDecimal,
  outputWeightKg: nonNegativeDecimal,
});

export const manufacturerSalesSchema = z.object({
  date: requiredString,
  recyclerId: positiveInt,
  manufacturerId: positiveInt,
  purchaseWeightKg: positiveDecimal,
  salesPriceRm: nonNegativeDecimal,
});

export type SackCatalogInput = z.infer<typeof sackCatalogSchema>;
export type FarmerInput = z.infer<typeof farmerSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type RecyclerInput = z.infer<typeof recyclerSchema>;
export type ManufacturerInput = z.infer<typeof manufacturerSchema>;
export type FertilizerDistributionInput = z.infer<
  typeof fertilizerDistributionSchema
>;
export type SackReturnInput = z.infer<typeof sackReturnSchema>;
export type RecyclerDeliveryInput = z.infer<typeof recyclerDeliverySchema>;
export type ManufacturerSalesInput = z.infer<typeof manufacturerSalesSchema>;
