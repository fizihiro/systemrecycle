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
import { computeDiscount } from "@/lib/discount";
import { sackReturnSchema } from "@/lib/validations";

const PATH = "/dashboard/sack-returns";

function serialize(item: {
  id: number;
  date: Date;
  farmerId: number;
  supplierId: number;
  sackId: number;
  passQty: number;
  rejectQty: number;
  rejectReason: string | null;
  totalDiscountRm: { toString(): string };
  farmer: { name: string };
  supplier: { companyName: string };
  sack: { fertilizerType: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    date: item.date.toISOString(),
    farmerId: item.farmerId,
    supplierId: item.supplierId,
    sackId: item.sackId,
    passQty: item.passQty,
    rejectQty: item.rejectQty,
    rejectReason: item.rejectReason,
    totalDiscountRm: Number(item.totalDiscountRm),
    farmerName: item.farmer.name,
    supplierName: item.supplier.companyName,
    sackType: item.sack.fertilizerType,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type SackReturnRecord = ReturnType<typeof serialize>;

export async function getSackReturns(
  page?: string | number,
): Promise<PaginatedResult<SackReturnRecord>> {
  const total = await prisma.sackReturn.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.sackReturn.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
    include: {
      farmer: { select: { name: true } },
      supplier: { select: { companyName: true } },
      sack: { select: { fertilizerType: true } },
    },
  });

  return paginated(items.map(serialize), pagination);
}

function parseInput(formData: FormData) {
  return sackReturnSchema.safeParse({
    date: formData.get("date"),
    farmerId: formData.get("farmerId"),
    supplierId: formData.get("supplierId"),
    sackId: formData.get("sackId"),
    passQty: formData.get("passQty"),
    rejectQty: formData.get("rejectQty"),
    rejectReason: formData.get("rejectReason"),
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

  if (parsed.data.passQty === 0 && parsed.data.rejectQty === 0) {
    return actionError("Pass quantity or reject quantity must be greater than zero.");
  }

  await prisma.sackReturn.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
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

  if (parsed.data.passQty === 0 && parsed.data.rejectQty === 0) {
    return actionError("Pass quantity or reject quantity must be greater than zero.");
  }

  await prisma.sackReturn.update({
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

export async function deleteSackReturn(id: number): Promise<ActionResult> {
  await prisma.sackReturn.delete({ where: { id } });
  revalidatePath(PATH);
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function getSuggestedDiscount(
  sackId: number,
  passQty: number,
): Promise<number> {
  const sack = await prisma.sackCatalog.findUnique({
    where: { id: sackId },
    select: { discountValueRm: true },
  });

  if (!sack) {
    return 0;
  }

  return computeDiscount(passQty, Number(sack.discountValueRm));
}
