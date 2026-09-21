import { ManufacturersManager } from "@/components/crud/manufacturers-manager";
import { getManufacturers } from "@/lib/actions/manufacturers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function ManufacturersPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const { items, pagination } = await getManufacturers(page);

  return <ManufacturersManager items={items} pagination={pagination} />;
}
