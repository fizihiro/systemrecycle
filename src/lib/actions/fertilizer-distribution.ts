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
import { fertilizerDistributionSchema } from "@/lib/validations";

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
  sack: { fertilizerType: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    date: item.date.toISOString(),
    supplierId: item.supplierId,
    farmerId: item.farmerId,
    sackId: item.sackId,
    quantity: item.quantity,
    supplierName: item.supplier.companyName,
    farmerName: item.farmer.name,
    sackType: item.sack.fertilizerType,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type FertilizerDistributionRecord = ReturnType<typeof serialize>;

export async function getFertilizerDistributions(
  page?: string | number,
): Promise<PaginatedResult<FertilizerDistributionRecord>> {
  const total = await prisma.fertilizerDistribution.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.fertilizerDistribution.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
    include: {
      supplier: { select: { companyName: true } },
      farmer: { select: { name: true } },
      sack: { select: { fertilizerType: true } },
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

  await prisma.fertilizerDistribution.create({
    data: {
      ...parsed.data,
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
  await prisma.fertilizerDistribution.delete({ where: { id } });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}
