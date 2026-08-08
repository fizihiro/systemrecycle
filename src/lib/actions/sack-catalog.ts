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
import { sackCatalogSchema } from "@/lib/validations";

const PATH = "/dashboard/sack-catalog";

function serialize(item: {
  id: number;
  fertilizerType: string;
  discountValueRm: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    fertilizerType: item.fertilizerType,
    discountValueRm: Number(item.discountValueRm),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type SackCatalogRecord = ReturnType<typeof serialize>;

export async function getSackCatalogItems(
  page?: string | number,
): Promise<PaginatedResult<SackCatalogRecord>> {
  const total = await prisma.sackCatalog.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.sackCatalog.findMany({
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getSackCatalogOptions() {
  const items = await prisma.sackCatalog.findMany({
    orderBy: { fertilizerType: "asc" },
    select: { id: true, fertilizerType: true, discountValueRm: true },
  });

  return items.map((item) => ({
    id: item.id,
    fertilizerType: item.fertilizerType,
    discountValueRm: Number(item.discountValueRm),
  }));
}

function parseInput(formData: FormData) {
  return sackCatalogSchema.safeParse({
    fertilizerType: formData.get("fertilizerType"),
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

  await prisma.sackCatalog.create({ data: parsed.data });
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
