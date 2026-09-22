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
import { supplierSchema } from "@/lib/validations";

const PATH = "/dashboard/suppliers";

function serialize(item: {
  id: number;
  companyName: string;
  location: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    companyName: item.companyName,
    location: item.location,
    phone: item.phone,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type SupplierRecord = ReturnType<typeof serialize>;

export async function getSuppliers(
  page?: string | number,
): Promise<PaginatedResult<SupplierRecord>> {
  const programId = await getCurrentProgramId();
  const total = await prisma.supplier.count({ where: { programId } });
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.supplier.findMany({
    where: { programId },
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getSupplierOptions() {
  const programId = await getCurrentProgramId();
  return prisma.supplier.findMany({
    where: { programId },
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });
}

function parseInput(formData: FormData) {
  return supplierSchema.safeParse({
    companyName: formData.get("companyName"),
    location: formData.get("location"),
    phone: formData.get("phone"),
  });
}

export async function createSupplier(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const programId = await getCurrentProgramId();
  await prisma.supplier.create({
    data: {
      ...parsed.data,
      programId,
    },
  });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function updateSupplier(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.supplier.update({ where: { id }, data: parsed.data });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteSupplier(id: number): Promise<ActionResult> {
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath(PATH);
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this supplier because they are linked to transactions.",
    );
  }
}
