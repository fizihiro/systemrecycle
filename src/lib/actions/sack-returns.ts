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
import { computeDiscount } from "@/lib/discount";
import { formatSackLabel } from "@/lib/sack-catalog";
import { sackReturnSchema } from "@/lib/validations";

const PATH = "/dashboard/sack-returns";

function serialize(item: {
  id: number;
  batchId: string | null;
  date: Date;
  farmerId: number;
  supplierId: number;
  collectorId: number | null;
  sackId: number;
  quantity: number;
  totalDiscountRm: { toString(): string };
  farmer: { name: string };
  supplier: { companyName: string };
  collector: { companyName: string } | null;
  sack: {
    brand?: string | null;
    dimensions?: string | null;
    productCategory: string;
    materialType: string;
    sizeKg: number;
    emptySackWeightG?: { toString(): string } | null;
  };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    batchId: item.batchId ?? `BATCH-${String(item.id).padStart(4, "0")}`,
    date: item.date.toISOString(),
    farmerId: item.farmerId,
    supplierId: item.supplierId,
    collectorId: item.collectorId ?? item.supplierId,
    sackId: item.sackId,
    quantity: item.quantity,
    totalDiscountRm: Number(item.totalDiscountRm),
    farmerName: item.farmer.name,
    collectorName: item.collector?.companyName ?? item.supplier.companyName,
    supplierName: item.supplier.companyName,
    sackLabel: formatSackLabel(item.sack),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type SackReturnRecord = ReturnType<typeof serialize>;

export async function getSackReturns(
  page?: string | number,
): Promise<PaginatedResult<SackReturnRecord>> {
  const programId = await getCurrentProgramId();
  const total = await prisma.sackReturn.count({ where: { programId } });
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.sackReturn.findMany({
    where: { programId },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
    include: {
      farmer: { select: { name: true } },
      supplier: { select: { companyName: true } },
      collector: { select: { companyName: true } },
      sack: {
        select: {
          brand: true,
          dimensions: true,
          productCategory: true,
          materialType: true,
          sizeKg: true,
          emptySackWeightG: true,
        },
      },
    },
  });

  return paginated(items.map(serialize), pagination);
}

function parseInput(formData: FormData) {
  const collectorIdRaw = formData.get("collectorId") || formData.get("supplierId");
  const supplierIdRaw = formData.get("supplierId") || formData.get("collectorId");
  return sackReturnSchema.safeParse({
    batchId: formData.get("batchId"),
    date: formData.get("date"),
    farmerId: formData.get("farmerId"),
    supplierId: supplierIdRaw,
    collectorId: collectorIdRaw,
    sackId: formData.get("sackId"),
    quantity: formData.get("quantity"),
    totalDiscountRm: formData.get("totalDiscountRm"),
  });
}

export async function createSackReturn(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const programId = await getCurrentProgramId();
  const defaultSupplier = await prisma.supplier.findFirst({
    where: { programId },
    select: { id: true },
  });
  const defaultCollector = await prisma.collector.findFirst({
    where: { programId },
    select: { id: true },
  });

  const finalSupplierId =
    parsed.data.supplierId || defaultSupplier?.id || 1;
  const finalCollectorId =
    parsed.data.collectorId || defaultCollector?.id || finalSupplierId;

  await prisma.sackReturn.create({
    data: {
      batchId: parsed.data.batchId,
      date: new Date(parsed.data.date),
      farmerId: parsed.data.farmerId,
      supplierId: finalSupplierId,
      collectorId: finalCollectorId,
      sackId: parsed.data.sackId,
      quantity: parsed.data.quantity,
      totalDiscountRm: parsed.data.totalDiscountRm,
      programId,
    },
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function updateSackReturn(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const collectorId = parsed.data.collectorId || parsed.data.supplierId;
  const supplierId = parsed.data.supplierId || parsed.data.collectorId;

  await prisma.sackReturn.update({
    where: { id },
    data: {
      batchId: parsed.data.batchId,
      date: new Date(parsed.data.date),
      farmerId: parsed.data.farmerId,
      ...(supplierId ? { supplierId } : {}),
      ...(collectorId ? { collectorId } : {}),
      sackId: parsed.data.sackId,
      quantity: parsed.data.quantity,
      totalDiscountRm: parsed.data.totalDiscountRm,
    },
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function deleteSackReturn(id: number): Promise<ActionResult> {
  try {
    await prisma.sackReturn.delete({ where: { id } });
    revalidatePath(PATH);
    revalidatePath("/dashboard");
    return actionSuccess();
  } catch {
    return actionError("Unable to delete this sack return record.");
  }
}

export async function getSuggestedDiscount(
  sackId: number,
  quantity: number,
): Promise<number> {
  const sack = await prisma.sackCatalog.findUnique({
    where: { id: sackId },
    select: { discountValueRm: true },
  });

  if (!sack) {
    return 0;
  }

  return computeDiscount(quantity, Number(sack.discountValueRm));
}
