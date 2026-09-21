import { CollectorsManager } from "@/components/crud/collectors-manager";
import { getCollectors } from "@/lib/actions/collectors";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function RecyclersPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const { items, pagination } = await getCollectors(page);

  return (
    <CollectorsManager
      items={items}
      pagination={pagination}
      title="Recyclers"
      description="Manage recyclers processing collected sacks into recycled PP (polypropylene) pellets."
    />
  );
}
