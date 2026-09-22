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
import { formatPiecesMass } from "@/lib/format";
import { collectorDeliverySchema } from "@/lib/validations";

const PATH = "/dashboard/recycler-delivery";
const ALT_PATH = "/dashboard/collector-delivery";

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
  const inputWeightKg = Number(item.inputWeightKg);
  const inputWeightTonnes = Math.round((inputWeightKg / 1000) * 1000) / 1000;
  const inputMassFormatted = formatPiecesMass(item.sackQty, inputWeightKg, inputWeightTonnes);

  const outputWeightKg = Number(item.outputWeightKg);
  const outputWeightTonnes = Math.round((outputWeightKg / 1000) * 1000) / 1000;
  const outputMassFormatted = `${Number.isInteger(outputWeightKg) ? outputWeightKg.toLocaleString() : outputWeightKg.toFixed(2)} kg | ${outputWeightTonnes.toFixed(3)} t`;

  return {
    id: item.id,
    date: item.date.toISOString(),
    supplierId: item.supplierId,
    collectorId: item.collectorId,
    sackQty: item.sackQty,
    inputWeightKg,
    inputWeightTonnes,
    inputMassFormatted,
    outputWeightKg,
    outputWeightTonnes,
    outputMassFormatted,
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
  const programId = await getCurrentProgramId();
  const total = await prisma.collectorDelivery.count({ where: { programId } });
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.collectorDelivery.findMany({
    where: { programId },
    orderBy: { id: "desc" },
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

  if (parsed.data.outputWeightKg > parsed.data.inputWeightKg) {
    return actionError("Recycled output weight cannot exceed accepted input weight.");
  }

  const programId = await getCurrentProgramId();
  await prisma.collectorDelivery.create({
    data: {
      ...parsed.data,
      programId,
      date: new Date(parsed.data.date),
    },
  });
  revalidatePath(PATH);
  revalidatePath(ALT_PATH);
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

  if (parsed.data.outputWeightKg > parsed.data.inputWeightKg) {
    return actionError("Recycled output weight cannot exceed accepted input weight.");
  }

  await prisma.collectorDelivery.update({
    where: { id },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });
  revalidatePath(PATH);
  revalidatePath(ALT_PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function deleteCollectorDelivery(
  id: number,
): Promise<ActionResult> {
  try {
    await prisma.collectorDelivery.delete({ where: { id } });
    revalidatePath(PATH);
    revalidatePath(ALT_PATH);
    revalidatePath("/dashboard");
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this delivery record.",
    );
  }
}
