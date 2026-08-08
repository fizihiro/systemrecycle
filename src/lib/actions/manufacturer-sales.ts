"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
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

const PATH = "/dashboard/manufacturer-sales";

function serialize(item: {
  id: number;
  date: Date;
  recyclerId: number;
  manufacturerId: number;
  purchaseWeightKg: { toString(): string };
  salesPriceRm: { toString(): string };
  recycler: { companyName: string };
  manufacturer: { companyName: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    date: item.date.toISOString(),
    recyclerId: item.recyclerId,
    manufacturerId: item.manufacturerId,
    purchaseWeightKg: Number(item.purchaseWeightKg),
    salesPriceRm: Number(item.salesPriceRm),
    recyclerName: item.recycler.companyName,
    manufacturerName: item.manufacturer.companyName,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type ManufacturerSalesRecord = ReturnType<typeof serialize>;

export async function getManufacturerSales(
  page?: string | number,
): Promise<PaginatedResult<ManufacturerSalesRecord>> {
  const total = await prisma.manufacturerSales.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.manufacturerSales.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
    include: {
      recycler: { select: { companyName: true } },
      manufacturer: { select: { companyName: true } },
    },
  });

  return paginated(items.map(serialize), pagination);
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

  await prisma.manufacturerSales.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
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

  await prisma.manufacturerSales.update({
    where: { id },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function deleteManufacturerSales(
  id: number,
): Promise<ActionResult> {
  await prisma.manufacturerSales.delete({ where: { id } });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}
