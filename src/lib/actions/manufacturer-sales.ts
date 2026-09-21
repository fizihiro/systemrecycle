"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  actionSuccess,
  type ActionResult,
} from "@/lib/actions/types";
import {
  buildPaginationMeta,
  getSkip,
  PAGE_SIZE,
  paginated,
  resolvePage,
  type PaginatedResult,
} from "@/lib/pagination";
import { manufacturerSalesSchema } from "@/lib/validations";
import { getCollectorOptions } from "@/lib/actions/collectors";
import { getManufacturerOptions } from "@/lib/actions/manufacturers";

const PATH = "/dashboard/manufacturer-sales";

export type ManufacturerSalesRecord = {
  id: number;
  date: string;
  recyclerId: number;
  recyclerName: string;
  manufacturerId: number;
  manufacturerName: string;
  purchaseWeightKg: number;
  salesPriceRm: number;
  createdAt: string;
  updatedAt: string;
};

type StoredSale = {
  id: number;
  date: string;
  recyclerId: number;
  manufacturerId: number;
  purchaseWeightKg: number;
  salesPriceRm: number;
  createdAt: string;
  updatedAt: string;
};

const initialSales: StoredSale[] = [
  {
    id: 1,
    date: "2026-02-15",
    recyclerId: 1,
    manufacturerId: 1,
    purchaseWeightKg: 4500.0,
    salesPriceRm: 11250.0,
    createdAt: new Date("2026-02-15").toISOString(),
    updatedAt: new Date("2026-02-15").toISOString(),
  },
  {
    id: 2,
    date: "2026-02-28",
    recyclerId: 2,
    manufacturerId: 2,
    purchaseWeightKg: 3800.0,
    salesPriceRm: 9500.0,
    createdAt: new Date("2026-02-28").toISOString(),
    updatedAt: new Date("2026-02-28").toISOString(),
  },
  {
    id: 3,
    date: "2026-03-10",
    recyclerId: 3,
    manufacturerId: 3,
    purchaseWeightKg: 5200.0,
    salesPriceRm: 13000.0,
    createdAt: new Date("2026-03-10").toISOString(),
    updatedAt: new Date("2026-03-10").toISOString(),
  },
  {
    id: 4,
    date: "2026-03-15",
    recyclerId: 1,
    manufacturerId: 4,
    purchaseWeightKg: 2900.0,
    salesPriceRm: 7250.0,
    createdAt: new Date("2026-03-15").toISOString(),
    updatedAt: new Date("2026-03-15").toISOString(),
  },
];

const store = {
  sales: [...initialSales],
  nextId: 5,
};

export async function getManufacturerSales(
  page?: string | number,
): Promise<PaginatedResult<ManufacturerSalesRecord>> {
  const [recyclers, manufacturers] = await Promise.all([
    getCollectorOptions(),
    getManufacturerOptions(),
  ]);

  const recyclerMap = new Map(recyclers.map((r) => [r.id, r.companyName]));
  const manufacturerMap = new Map(manufacturers.map((m) => [m.id, m.companyName]));

  const total = store.sales.length;
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const skip = getSkip(pagination.page);

  const enriched: ManufacturerSalesRecord[] = store.sales
    .slice(skip, skip + PAGE_SIZE)
    .map((sale) => ({
      ...sale,
      recyclerName: recyclerMap.get(sale.recyclerId) ?? `Recycler #${sale.recyclerId}`,
      manufacturerName: manufacturerMap.get(sale.manufacturerId) ?? `Manufacturer #${sale.manufacturerId}`,
    }));

  return paginated(enriched, pagination);
}

function parseInput(formData: FormData) {
  return manufacturerSalesSchema.safeParse({
    date: formData.get("date"),
    recyclerId: formData.get("recyclerId"),
    manufacturerId: formData.get("manufacturerId"),
    purchaseWeightKg: formData.get("purchaseWeightKg"),
    salesPriceRm: formData.get("salesPriceRm"),
  });
}

export async function createManufacturerSales(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const now = new Date().toISOString();
  const newSale: StoredSale = {
    id: store.nextId++,
    date: parsed.data.date,
    recyclerId: parsed.data.recyclerId,
    manufacturerId: parsed.data.manufacturerId,
    purchaseWeightKg: parsed.data.purchaseWeightKg,
    salesPriceRm: parsed.data.salesPriceRm,
    createdAt: now,
    updatedAt: now,
  };

  store.sales.unshift(newSale);
  revalidatePath(PATH);
  return actionSuccess();
}

export async function updateManufacturerSales(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const index = store.sales.findIndex((s) => s.id === id);
  if (index === -1) {
    return actionError("Sale record not found");
  }

  const existing = store.sales[index]!;
  store.sales[index] = {
    ...existing,
    date: parsed.data.date,
    recyclerId: parsed.data.recyclerId,
    manufacturerId: parsed.data.manufacturerId,
    purchaseWeightKg: parsed.data.purchaseWeightKg,
    salesPriceRm: parsed.data.salesPriceRm,
    updatedAt: new Date().toISOString(),
  };

  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteManufacturerSales(id: number): Promise<ActionResult> {
  const index = store.sales.findIndex((s) => s.id === id);
  if (index === -1) {
    return actionError("Sale record not found");
  }

  store.sales.splice(index, 1);
  revalidatePath(PATH);
  return actionSuccess();
}
