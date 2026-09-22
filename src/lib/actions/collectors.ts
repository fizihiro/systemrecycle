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
  const programId = await getCurrentProgramId();
  const total = await prisma.collector.count({ where: { programId } });
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.collector.findMany({
    where: { programId },
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getCollectorOptions() {
  const programId = await getCurrentProgramId();
  return prisma.collector.findMany({
    where: { programId },
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

  const programId = await getCurrentProgramId();
  await prisma.collector.create({
    data: {
      ...parsed.data,
      programId,
    },
  });
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
