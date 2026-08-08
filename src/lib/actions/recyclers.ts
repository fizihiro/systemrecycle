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
import { recyclerSchema } from "@/lib/validations";

const PATH = "/dashboard/recyclers";

function serialize(item: {
  id: number;
  companyName: string;
  processCapacityKg: { toString(): string };
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    companyName: item.companyName,
    processCapacityKg: Number(item.processCapacityKg),
    phone: item.phone,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export type RecyclerRecord = ReturnType<typeof serialize>;

export async function getRecyclers(
  page?: string | number,
): Promise<PaginatedResult<RecyclerRecord>> {
  const total = await prisma.recycler.count();
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const items = await prisma.recycler.findMany({
    orderBy: { id: "desc" },
    skip: getSkip(pagination.page),
    take: PAGE_SIZE,
  });

  return paginated(items.map(serialize), pagination);
}

export async function getRecyclerOptions() {
  return prisma.recycler.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });
}

function parseInput(formData: FormData) {
  return recyclerSchema.safeParse({
    companyName: formData.get("companyName"),
    processCapacityKg: formData.get("processCapacityKg"),
    phone: formData.get("phone"),
  });
}

export async function createRecycler(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.recycler.create({ data: parsed.data });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function updateRecycler(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await prisma.recycler.update({ where: { id }, data: parsed.data });
  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteRecycler(id: number): Promise<ActionResult> {
  try {
    await prisma.recycler.delete({ where: { id } });
    revalidatePath(PATH);
    return actionSuccess();
  } catch {
    return actionError(
      "Unable to delete this recycler because they are linked to transactions.",
    );
  }
}
