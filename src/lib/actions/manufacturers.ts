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
import { manufacturerSchema } from "@/lib/validations";

const PATH = "/dashboard/manufacturers";

function serialize(item: {
  id: number;
  companyName: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    companyName: item.companyName,
    phone: item.phone,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type ManufacturerRecord = ReturnType<typeof serialize>;

export async function getManufacturers(
  page?: string | number,
): Promise<PaginatedResult<ManufacturerRecord>> {
  const programId = await getCurrentProgramId();
  const total = await prisma.manufacturer.count({ where: { programId } });
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.manufacturer.findMany({
    where: { programId },
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getManufacturerOptions() {
  const programId = await getCurrentProgramId();
  return prisma.manufacturer.findMany({
    where: { programId },
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });
}

function parseInput(formData: FormData) {
  return manufacturerSchema.safeParse({
    companyName: formData.get("companyName"),
    phone: formData.get("phone"),
  });
}

export async function createManufacturer(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const programId = await getCurrentProgramId();
  await prisma.manufacturer.create({
    data: {
      ...parsed.data,
      programId,
    },
  });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function updateManufacturer(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.manufacturer.update({
    where: { id },
    data: parsed.data,
  });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteManufacturer(id: number): Promise<ActionResult> {
  try {
    await prisma.manufacturer.delete({ where: { id } });
    revalidatePath(PATH);
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this manufacturer because they are linked to sales records.",
    );
  }
}
