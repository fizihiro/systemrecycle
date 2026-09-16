import { CollectorsManager } from "@/components/crud/collectors-manager";
import { getCollectors } from "@/lib/actions/collectors";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CollectorsPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const { items, pagination } = await getCollectors(page);

  return <CollectorsManager items={items} pagination={pagination} />;
}
