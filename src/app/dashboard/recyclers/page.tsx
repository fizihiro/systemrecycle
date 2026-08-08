import { RecyclersManager } from "@/components/crud/recyclers-manager";
import { getRecyclers } from "@/lib/actions/recyclers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function RecyclersPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const { items, pagination } = await getRecyclers(page);

  return <RecyclersManager items={items} pagination={pagination} />;
}
