import { SackReturnsManager } from "@/components/crud/sack-returns-manager";
import { getFarmerOptions } from "@/lib/actions/farmers";
import { getSackReturns } from "@/lib/actions/sack-returns";
import { getSackCatalogOptions } from "@/lib/actions/sack-catalog";
import { getCollectorOptions } from "@/lib/actions/collectors";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SackReturnsPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const [{ items, pagination }, collectors, farmers, sacks] = await Promise.all([
    getSackReturns(page),
    getCollectorOptions(),
    getFarmerOptions(),
    getSackCatalogOptions(),
  ]);

  return (
    <SackReturnsManager
      items={items}
      pagination={pagination}
      collectors={collectors.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
      farmers={farmers.map((item) => ({
        id: item.id,
        label: item.name,
      }))}
      sacks={sacks.map((item) => ({
        id: item.id,
        label: item.label,
        discountValueRm: item.discountValueRm,
      }))}
    />
  );
}
