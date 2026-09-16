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
import { collectorDeliverySchema } from "@/lib/validations";

const PATH = "/dashboard/collector-delivery";

function serialize(item: {
  id: number;
  date: Date;
  supplierId: number;
  collectorId: number;
  sackQty: number;
  inputWeightKg: { toString(): string };
  outputWeightKg: { toString(): string };
  supplier: { companyName: string };
  collector: { companyName: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    date: item.date.toISOString(),
    supplierId: item.supplierId,
    collectorId: item.collectorId,
    sackQty: item.sackQty,
    inputWeightKg: Number(item.inputWeightKg),
    outputWeightKg: Number(item.outputWeightKg),
    supplierName: item.supplier.companyName,
    collectorName: item.collector.companyName,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type CollectorDeliveryRecord = ReturnType<typeof serialize>;

export async function getCollectorDeliveries(
  page?: string | number,
): Promise<PaginatedResult<CollectorDeliveryRecord>> {
  const total = await prisma.collectorDelivery.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.collectorDelivery.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
    include: {
      supplier: { select: { companyName: true } },
      collector: { select: { companyName: true } },
    },
  });

  return paginated(items.map(serialize), pagination);
}

function parseInput(formData: FormData) {
  return collectorDeliverySchema.safeParse({
    date: formData.get("date"),
    supplierId: formData.get("supplierId"),
    collectorId: formData.get("collectorId"),
    sackQty: formData.get("sackQty"),
    inputWeightKg: formData.get("inputWeightKg"),
    outputWeightKg: formData.get("outputWeightKg"),
  });
}

export async function createCollectorDelivery(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.collectorDelivery.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function updateCollectorDelivery(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.collectorDelivery.update({
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

export async function deleteCollectorDelivery(
  id: number,
): Promise<ActionResult> {
  await prisma.collectorDelivery.delete({ where: { id } });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}
