import { CollectorDeliveryManager } from "@/components/crud/collector-delivery-manager";
import { getCollectorDeliveries } from "@/lib/actions/collector-delivery";
import { getCollectorOptions } from "@/lib/actions/collectors";
import { getSupplierOptions } from "@/lib/actions/suppliers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CollectorDeliveryPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const [{ items, pagination }, suppliers, collectors] = await Promise.all([
    getCollectorDeliveries(page),
    getSupplierOptions(),
    getCollectorOptions(),
  ]);

  return (
    <CollectorDeliveryManager
      items={items}
      pagination={pagination}
      suppliers={suppliers.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
      collectors={collectors.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
    />
  );
}
