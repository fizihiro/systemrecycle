import { FertilizerDistributionManager } from "@/components/crud/fertilizer-distribution-manager";
import { getFertilizerDistributions } from "@/lib/actions/fertilizer-distribution";
import { getFarmerOptions } from "@/lib/actions/farmers";
import { getSackCatalogOptions } from "@/lib/actions/sack-catalog";
import { getSupplierOptions } from "@/lib/actions/suppliers";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function FertilizerDistributionPage({
  searchParams,
}: PageProps) {
  const { page } = await searchParams;
  const [{ items, pagination }, suppliers, farmers, sacks] = await Promise.all([
    getFertilizerDistributions(page),
    getSupplierOptions(),
    getFarmerOptions(),
    getSackCatalogOptions(),
  ]);

  return (
    <FertilizerDistributionManager
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
        label: item.label,
        discountValueRm: item.discountValueRm,
      }))}
    />
  );
}
