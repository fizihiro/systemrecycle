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
import { recyclerDeliverySchema } from "@/lib/validations";

const PATH = "/dashboard/recycler-delivery";

function serialize(item: {
  id: number;
  date: Date;
  supplierId: number;
  recyclerId: number;
  sackQty: number;
  inputWeightKg: { toString(): string };
  outputWeightKg: { toString(): string };
  supplier: { companyName: string };
  recycler: { companyName: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    date: item.date.toISOString(),
    supplierId: item.supplierId,
    recyclerId: item.recyclerId,
    sackQty: item.sackQty,
    inputWeightKg: Number(item.inputWeightKg),
    outputWeightKg: Number(item.outputWeightKg),
    supplierName: item.supplier.companyName,
    recyclerName: item.recycler.companyName,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type RecyclerDeliveryRecord = ReturnType<typeof serialize>;

export async function getRecyclerDeliveries(
  page?: string | number,
): Promise<PaginatedResult<RecyclerDeliveryRecord>> {
  const total = await prisma.recyclerDelivery.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.recyclerDelivery.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
    include: {
      supplier: { select: { companyName: true } },
      recycler: { select: { companyName: true } },
    },
  });

  return paginated(items.map(serialize), pagination);
}

function parseInput(formData: FormData) {
  return recyclerDeliverySchema.safeParse({
    date: formData.get("date"),
    supplierId: formData.get("supplierId"),
    recyclerId: formData.get("recyclerId"),
    sackQty: formData.get("sackQty"),
    inputWeightKg: formData.get("inputWeightKg"),
    outputWeightKg: formData.get("outputWeightKg"),
  });
}

export async function createRecyclerDelivery(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.recyclerDelivery.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function updateRecyclerDelivery(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.recyclerDelivery.update({
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

export async function deleteRecyclerDelivery(
  id: number,
): Promise<ActionResult> {
  await prisma.recyclerDelivery.delete({ where: { id } });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}
