"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getCurrentProgramId } from "@/lib/tenant";
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
import { formatSackLabel } from "@/lib/sack-catalog";
import { sackCatalogSchema } from "@/lib/validations";

const PATH = "/dashboard/sack-catalog";

function serialize(item: {
  id: number;
  brand: string | null;
  dimensions: string | null;
  productCategory: string;
  materialType: string;
  sizeKg: number;
  emptySackWeightG: { toString(): string };
  discountValueRm: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}) {
  const fields = {
    brand: item.brand,
    dimensions: item.dimensions,
    productCategory: item.productCategory,
    materialType: item.materialType,
    sizeKg: item.sizeKg,
    emptySackWeightG: Number(item.emptySackWeightG),
  };

  return {
    id: item.id,
    ...fields,
    label: formatSackLabel(fields),
    discountValueRm: Number(item.discountValueRm),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type SackCatalogRecord = ReturnType<typeof serialize>;

export async function getSackCatalogItems(
  page?: string | number,
): Promise<PaginatedResult<SackCatalogRecord>> {
  const programId = await getCurrentProgramId();
  const total = await prisma.sackCatalog.count({ where: { programId } });
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.sackCatalog.findMany({
    where: { programId },
    orderBy: [{ productCategory: "asc" }, { sizeKg: "asc" }, { id: "desc" }],
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getSackCatalogOptions() {
  const programId = await getCurrentProgramId();
  const items = await prisma.sackCatalog.findMany({
    where: { programId },
    orderBy: [{ productCategory: "asc" }, { sizeKg: "asc" }],
    select: {
      id: true,
      brand: true,
      dimensions: true,
      productCategory: true,
      materialType: true,
      sizeKg: true,
      emptySackWeightG: true,
      discountValueRm: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    brand: item.brand,
    dimensions: item.dimensions,
    productCategory: item.productCategory,
    materialType: item.materialType,
    sizeKg: item.sizeKg,
    emptySackWeightG: Number(item.emptySackWeightG),
    label: formatSackLabel(item),
    discountValueRm: Number(item.discountValueRm),
  }));
}

function parseInput(formData: FormData) {
  return sackCatalogSchema.safeParse({
    brand: formData.get("brand"),
    dimensions: formData.get("dimensions"),
    productCategory: formData.get("productCategory"),
    materialType: formData.get("materialType"),
    sizeKg: formData.get("sizeKg"),
    emptySackWeightG: formData.get("emptySackWeightG") || 80,
    discountValueRm: formData.get("discountValueRm"),
  });
}

export async function createSackCatalog(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const programId = await getCurrentProgramId();
  await prisma.sackCatalog.create({
    data: {
      ...parsed.data,
      programId,
    },
  });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function updateSackCatalog(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.sackCatalog.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteSackCatalog(id: number): Promise<ActionResult> {
  try {
    await prisma.sackCatalog.delete({ where: { id } });
    revalidatePath(PATH);
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this sack catalog entry because it is used in transactions.",
    );
  }
}
