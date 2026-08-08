import { SackCatalogManager } from "@/components/crud/sack-catalog-manager";
import { getSackCatalogItems } from "@/lib/actions/sack-catalog";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SackCatalogPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const { items, pagination } = await getSackCatalogItems(page);

  return <SackCatalogManager items={items} pagination={pagination} />;
}
