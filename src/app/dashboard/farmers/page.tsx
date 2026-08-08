import { FarmersManager } from "@/components/crud/farmers-manager";
import { getFarmers } from "@/lib/actions/farmers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function FarmersPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const { items, pagination } = await getFarmers(page);

  return <FarmersManager items={items} pagination={pagination} />;
}
