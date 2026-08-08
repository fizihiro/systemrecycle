import { SackReturnsManager } from "@/components/crud/sack-returns-manager";
import { getFarmerOptions } from "@/lib/actions/farmers";
import { getSackReturns } from "@/lib/actions/sack-returns";
import { getSackCatalogOptions } from "@/lib/actions/sack-catalog";
import { getSupplierOptions } from "@/lib/actions/suppliers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SackReturnsPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const [{ items, pagination }, suppliers, farmers, sacks] = await Promise.all([
    getSackReturns(page),
    getSupplierOptions(),
    getFarmerOptions(),
    getSackCatalogOptions(),
  ]);

  return (
    <SackReturnsManager
      items={items}
      pagination={pagination}
      suppliers={suppliers.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
      farmers={farmers.map((item) => ({
        id: item.id,
        label: item.name,
      }))}
      sacks={sacks.map((item) => ({
        id: item.id,
        label: item.fertilizerType,
        discountValueRm: item.discountValueRm,
      }))}
    />
  );
}
