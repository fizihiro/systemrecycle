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
import { farmerSchema } from "@/lib/validations";

const PATH = "/dashboard/farmers";

function serialize(item: {
  id: number;
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    address: item.address,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type FarmerRecord = ReturnType<typeof serialize>;

export async function getFarmers(
  page?: string | number,
): Promise<PaginatedResult<FarmerRecord>> {
  const total = await prisma.farmer.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.farmer.findMany({
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getFarmerOptions() {
  return prisma.farmer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

function parseInput(formData: FormData) {
  return farmerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });
}

export async function createFarmer(formData: FormData): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.farmer.create({ data: parsed.data });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function updateFarmer(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.farmer.update({ where: { id }, data: parsed.data });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteFarmer(id: number): Promise<ActionResult> {
  try {
    await prisma.farmer.delete({ where: { id } });
    revalidatePath(PATH);
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this farmer because they are linked to transactions.",
    );
  }
}
