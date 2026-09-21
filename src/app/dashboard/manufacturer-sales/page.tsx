import { ManufacturerSalesManager } from "@/components/crud/manufacturer-sales-manager";
import { getManufacturerSales } from "@/lib/actions/manufacturer-sales";
import { getManufacturerOptions } from "@/lib/actions/manufacturers";
import { getCollectorOptions } from "@/lib/actions/collectors";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function ManufacturerSalesPage({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const [{ items, pagination }, recyclers, manufacturers] = await Promise.all([
    getManufacturerSales(page),
    getCollectorOptions(),
    getManufacturerOptions(),
  ]);

  return (
    <ManufacturerSalesManager
      items={items}
      pagination={pagination}
      recyclers={recyclers.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
      manufacturers={manufacturers.map((item) => ({
        id: item.id,
        label: item.companyName,
      }))}
    />
  );
}
