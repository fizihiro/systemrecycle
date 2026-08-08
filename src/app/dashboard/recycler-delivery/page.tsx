import { RecyclerDeliveryManager } from "@/components/crud/recycler-delivery-manager";
import { getRecyclerDeliveries } from "@/lib/actions/recycler-delivery";
import { getRecyclerOptions } from "@/lib/actions/recyclers";
import { getSupplierOptions } from "@/lib/actions/suppliers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function RecyclerDeliveryPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const [{ items, pagination }, suppliers, recyclers] = await Promise.all([
    getRecyclerDeliveries(page),
    getSupplierOptions(),
    getRecyclerOptions(),
  ]);

  return (
    <RecyclerDeliveryManager
      items={items}
      pagination={pagination}
      suppliers={suppliers.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
      recyclers={recyclers.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
    />
  );
}
