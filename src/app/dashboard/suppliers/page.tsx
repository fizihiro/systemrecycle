import { SuppliersManager } from "@/components/crud/suppliers-manager";
import { getSuppliers } from "@/lib/actions/suppliers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SuppliersPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const { items, pagination } = await getSuppliers(page);

  return <SuppliersManager items={items} pagination={pagination} />;
}
