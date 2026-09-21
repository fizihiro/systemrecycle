"use server";

import { revalidatePath } from "next/cache";

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

export type ManufacturerRecord = {
  id: number;
  companyName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

// In-memory persistent store initialized with realistic manufacturer records
const initialManufacturers: ManufacturerRecord[] = [
  {
    id: 1,
    companyName: "Malayan Plastic Manufacturing Sdn Bhd",
    phone: "03-89451122",
    createdAt: new Date("2025-08-01").toISOString(),
    updatedAt: new Date("2025-08-01").toISOString(),
  },
  {
    id: 2,
    companyName: "TopPolymer Industries Bhd",
    phone: "07-5566778",
    createdAt: new Date("2025-08-05").toISOString(),
    updatedAt: new Date("2025-08-05").toISOString(),
  },
  {
    id: 3,
    companyName: "Sinaran Moulding & Extrusion",
    phone: "04-3908822",
    createdAt: new Date("2025-08-10").toISOString(),
    updatedAt: new Date("2025-08-10").toISOString(),
  },
  {
    id: 4,
    companyName: "BioLoop Industrial Products",
    phone: "03-51239900",
    createdAt: new Date("2025-08-15").toISOString(),
    updatedAt: new Date("2025-08-15").toISOString(),
  },
  {
    id: 5,
    companyName: "GreenTek Compounders Sdn Bhd",
    phone: "03-78452200",
    createdAt: new Date("2025-08-20").toISOString(),
    updatedAt: new Date("2025-08-20").toISOString(),
  },
];

const store = {
  manufacturers: [...initialManufacturers],
  nextId: 6,
};

export async function getManufacturers(
  page?: string | number,
): Promise<PaginatedResult<ManufacturerRecord>> {
  const total = store.manufacturers.length;
  const pagination = buildPaginationMeta(total, resolvePage(page));
  const skip = getSkip(pagination.page);
  const items = store.manufacturers.slice(skip, skip + PAGE_SIZE);

  return paginated(items, pagination);
}

export async function getManufacturerOptions() {
  return store.manufacturers
    .map((m) => ({ id: m.id, companyName: m.companyName }))
    .sort((a, b) => a.companyName.localeCompare(b.companyName));
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

  const now = new Date().toISOString();
  const newManufacturer: ManufacturerRecord = {
    id: store.nextId++,
    companyName: parsed.data.companyName,
    phone: parsed.data.phone,
    createdAt: now,
    updatedAt: now,
  };

  store.manufacturers.unshift(newManufacturer);
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

  const index = store.manufacturers.findIndex((m) => m.id === id);
  if (index === -1) {
    return actionError("Manufacturer not found");
  }

  const existing = store.manufacturers[index]!;
  store.manufacturers[index] = {
    ...existing,
    companyName: parsed.data.companyName,
    phone: parsed.data.phone,
    updatedAt: new Date().toISOString(),
  };

  revalidatePath(PATH);
  return actionSuccess();
}

export async function deleteManufacturer(id: number): Promise<ActionResult> {
  const index = store.manufacturers.findIndex((m) => m.id === id);
  if (index === -1) {
    return actionError("Manufacturer not found");
  }

  store.manufacturers.splice(index, 1);
  revalidatePath(PATH);
  return actionSuccess();
}
