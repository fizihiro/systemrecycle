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
import { collectorSchema } from "@/lib/validations";

const PATH = "/dashboard/collectors";

function serialize(item: {
  id: number;
  companyName: string;
  processCapacityKg: { toString(): string };
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    companyName: item.companyName,
    processCapacityKg: Number(item.processCapacityKg),
    phone: item.phone,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type CollectorRecord = ReturnType<typeof serialize>;

export async function getCollectors(
  page?: string | number,
): Promise<PaginatedResult<CollectorRecord>> {
  const total = await prisma.collector.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.collector.findMany({
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getCollectorOptions() {
  return prisma.collector.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });
}

function parseInput(formData: FormData) {
  return collectorSchema.safeParse({
    companyName: formData.get("companyName"),
    processCapacityKg: formData.get("processCapacityKg"),
    phone: formData.get("phone"),
  });
}

export async function createCollector(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.collector.create({ data: parsed.data });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function updateCollector(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.collector.update({ where: { id }, data: parsed.data });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteCollector(id: number): Promise<ActionResult> {
  try {
    await prisma.collector.delete({ where: { id } });
    revalidatePath(PATH);
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this collector because they are linked to deliveries.",
    );
  }
}
