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
import { fertilizerDistributionSchema } from "@/lib/validations";
import { formatSackLabel } from "@/lib/sack-catalog";
import { formatPiecesMass } from "@/lib/format";

const PATH = "/dashboard/fertilizer-distribution";

function serialize(item: {
  id: number;
  date: Date;
  supplierId: number;
  farmerId: number;
  sackId: number;
  quantity: number;
  supplier: { companyName: string };
  farmer: { name: string };
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
  const emptySackWeightG = item.sack.emptySackWeightG ? Number(item.sack.emptySackWeightG) : 80;
  const weightKg = Math.round(((item.quantity * emptySackWeightG) / 1000) * 100) / 100;
  const weightTonnes = Math.round((weightKg / 1000) * 1000) / 1000;
  const massFormatted = formatPiecesMass(item.quantity, weightKg, weightTonnes);

  return {
    id: item.id,
    date: item.date.toISOString(),
    supplierId: item.supplierId,
    farmerId: item.farmerId,
    sackId: item.sackId,
    quantity: item.quantity,
    weightKg,
    weightTonnes,
    massFormatted,
    supplierName: item.supplier.companyName,
    farmerName: item.farmer.name,
    sackLabel: formatSackLabel(item.sack),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type FertilizerDistributionRecord = ReturnType<typeof serialize>;

export async function getFertilizerDistributions(
  page?: string | number,
): Promise<PaginatedResult<FertilizerDistributionRecord>> {
  const programId = await getCurrentProgramId();
  const total = await prisma.fertilizerDistribution.count({ where: { programId } });
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.fertilizerDistribution.findMany({
    where: { programId },
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
    include: {
      supplier: { select: { companyName: true } },
      farmer: { select: { name: true } },
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
  return fertilizerDistributionSchema.safeParse({
    date: formData.get("date"),
    supplierId: formData.get("supplierId"),
    farmerId: formData.get("farmerId"),
    sackId: formData.get("sackId"),
    quantity: formData.get("quantity"),
  });
}

export async function createFertilizerDistribution(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const programId = await getCurrentProgramId();
  await prisma.fertilizerDistribution.create({
    data: {
      ...parsed.data,
      programId,
      date: new Date(parsed.data.date),
    },
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function updateFertilizerDistribution(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.fertilizerDistribution.update({
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

export async function deleteFertilizerDistribution(
  id: number,
): Promise<ActionResult> {
  try {
    await prisma.fertilizerDistribution.delete({ where: { id } });
    revalidatePath(PATH);
    revalidatePath("/dashboard");
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this fertilizer distribution record.",
    );
  }
}
