"use server";

import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber } from "@/lib/format";

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    year: "numeric",
  }).format(date);
}

type MonthlyRow = { monthKey: string; value: number };
type DiscountByTypeRow = {
  sackType: string;
  discountRm: number;
  passQty: number;
};
type SupplierFlowRow = {
  name: string;
  distributed: number;
  returned: number;
};

export type DashboardAnalytics = Awaited<ReturnType<typeof getDashboardAnalytics>>;

export async function getDashboardAnalytics() {
  const [
    farmers,
    suppliers,
    recyclers,
    manufacturers,
    distributionAgg,
    returnAgg,
    deliveryAgg,
    salesAgg,
    discountAggregate,
    monthlyDistribution,
    monthlyReturns,
    monthlyDeliveries,
    discountBySackTypeRaw,
    supplierDistributedRaw,
    supplierReturnedRaw,
  ] = await Promise.all([
    prisma.farmer.count(),
    prisma.supplier.count(),
    prisma.recycler.count(),
    prisma.manufacturer.count(),
    prisma.fertilizerDistribution.aggregate({ _sum: { quantity: true } }),
    prisma.sackReturn.aggregate({
      _sum: { passQty: true, rejectQty: true },
    }),
    prisma.recyclerDelivery.aggregate({
      _sum: { sackQty: true, inputWeightKg: true, outputWeightKg: true },
    }),
    prisma.manufacturerSales.aggregate({
      _sum: { purchaseWeightKg: true, salesPriceRm: true },
    }),
    prisma.sackReturn.aggregate({ _sum: { totalDiscountRm: true } }),
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT DATE_FORMAT(date, '%Y-%m') AS monthKey,
             CAST(SUM(quantity) AS DECIMAL(20,0)) AS value
      FROM fertilizer_distribution
      GROUP BY monthKey
      ORDER BY monthKey
    `,
    prisma.$queryRaw<
      Array<{
        monthKey: string;
        returnedPass: number;
        returnedReject: number;
        discountRm: number;
      }>
    >`
      SELECT DATE_FORMAT(date, '%Y-%m') AS monthKey,
             CAST(SUM(pass_qty) AS DECIMAL(20,0)) AS returnedPass,
             CAST(SUM(reject_qty) AS DECIMAL(20,0)) AS returnedReject,
             CAST(SUM(total_discount_rm) AS DECIMAL(20,2)) AS discountRm
      FROM sack_return
      GROUP BY monthKey
      ORDER BY monthKey
    `,
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT DATE_FORMAT(date, '%Y-%m') AS monthKey,
             CAST(SUM(sack_qty) AS DECIMAL(20,0)) AS value
      FROM recycler_delivery
      GROUP BY monthKey
      ORDER BY monthKey
    `,
    prisma.$queryRaw<DiscountByTypeRow[]>`
      SELECT CONCAT(
               sc.product_category,
               ' ',
               CAST(sc.size_kg AS CHAR),
               'kg · ',
               sc.material_type
             ) AS sackType,
             CAST(SUM(sr.total_discount_rm) AS DECIMAL(20,2)) AS discountRm,
             CAST(SUM(sr.pass_qty) AS DECIMAL(20,0)) AS passQty
      FROM sack_return sr
      JOIN sack_catalog sc ON sc.id = sr.sack_id
      GROUP BY sc.product_category, sc.size_kg, sc.material_type
      ORDER BY discountRm DESC
    `,
    prisma.$queryRaw<SupplierFlowRow[]>`
      SELECT s.company_name AS name,
             CAST(SUM(fd.quantity) AS DECIMAL(20,0)) AS distributed
      FROM fertilizer_distribution fd
      JOIN supplier s ON s.id = fd.supplier_id
      GROUP BY s.company_name
      ORDER BY distributed DESC
      LIMIT 6
    `,
    prisma.$queryRaw<SupplierFlowRow[]>`
      SELECT s.company_name AS name,
             CAST(SUM(sr.pass_qty + sr.reject_qty) AS DECIMAL(20,0)) AS returned
      FROM sack_return sr
      JOIN supplier s ON s.id = sr.supplier_id
      GROUP BY s.company_name
    `,
  ]);

  const sacksDistributed = Number(distributionAgg._sum.quantity ?? 0);
  const sacksReturnedPass = Number(returnAgg._sum.passQty ?? 0);
  const sacksReturnedReject = Number(returnAgg._sum.rejectQty ?? 0);
  const sacksToRecycler = Number(deliveryAgg._sum.sackQty ?? 0);
  const totalDiscountRm = Number(discountAggregate._sum.totalDiscountRm ?? 0);
  const totalInputWeightKg = Number(deliveryAgg._sum.inputWeightKg ?? 0);
  const totalOutputWeightKg = Number(deliveryAgg._sum.outputWeightKg ?? 0);
  const totalPurchaseWeightKg = Number(salesAgg._sum.purchaseWeightKg ?? 0);
  const totalSalesRevenueRm = Number(salesAgg._sum.salesPriceRm ?? 0);
  const returnRate =
    sacksDistributed > 0
      ? Math.round((sacksReturnedPass / sacksDistributed) * 100)
      : 0;
  const recoveryRate =
    totalInputWeightKg > 0
      ? Math.round((totalOutputWeightKg / totalInputWeightKg) * 100)
      : 0;

  const monthKeys = new Set<string>();
  for (const row of monthlyDistribution) monthKeys.add(row.monthKey);
  for (const row of monthlyReturns) monthKeys.add(row.monthKey);
  for (const row of monthlyDeliveries) monthKeys.add(row.monthKey);

  const distributionMap = new Map(
    monthlyDistribution.map((row) => [row.monthKey, Number(row.value)]),
  );
  const returnsMap = new Map(
    monthlyReturns.map((row) => [row.monthKey, row]),
  );
  const deliveryMap = new Map(
    monthlyDeliveries.map((row) => [row.monthKey, Number(row.value)]),
  );

  const sackFlowMonthly = Array.from(monthKeys)
    .sort()
    .map((key) => {
      const returns = returnsMap.get(key);
      return {
        month: monthLabel(key),
        monthKey: key,
        distributed: distributionMap.get(key) ?? 0,
        returnedPass: Number(returns?.returnedPass ?? 0),
        returnedReject: Number(returns?.returnedReject ?? 0),
        toRecycler: deliveryMap.get(key) ?? 0,
      };
    });

  const discountMonthly = monthlyReturns.map((row) => ({
    month: monthLabel(row.monthKey),
    discountRm: Number(row.discountRm),
  }));

  const discountBySackType = discountBySackTypeRaw.map((row) => ({
    sackType: row.sackType,
    discountRm: Number(row.discountRm),
    passQty: Number(row.passQty),
  }));

  const returnedBySupplier = new Map(
    supplierReturnedRaw.map((row) => [row.name, Number(row.returned)]),
  );

  const supplierFlow = supplierDistributedRaw.map((row) => ({
    name: row.name,
    distributed: Number(row.distributed),
    returned: returnedBySupplier.get(row.name) ?? 0,
  }));

  return {
    kpis: {
      farmers,
      suppliers,
      recyclers,
      manufacturers,
      sacksDistributed,
      sacksReturnedPass,
      sacksReturnedReject,
      sacksToRecycler,
      totalDiscountRm,
      totalDiscountRmFormatted: formatCurrency(totalDiscountRm),
      totalInputWeightKg,
      totalOutputWeightKg,
      totalPurchaseWeightKg,
      totalSalesRevenueRm,
      totalSalesRevenueRmFormatted: formatCurrency(totalSalesRevenueRm),
      returnRate,
      recoveryRate,
      totalInputWeightFormatted: `${formatNumber(totalInputWeightKg)} kg`,
      totalOutputWeightFormatted: `${formatNumber(totalOutputWeightKg)} kg`,
      totalPurchaseWeightFormatted: `${formatNumber(totalPurchaseWeightKg)} kg`,
    },
    sackFlowMonthly,
    discountBySackType,
    discountMonthly,
    supplierFlow,
    returnQuality: [
      { name: "pass", label: "Pass", value: sacksReturnedPass },
      { name: "reject", label: "Reject", value: sacksReturnedReject },
    ],
    weightTotals: [
      {
        stage: "Recycler Input",
        value: totalInputWeightKg,
        fill: "input",
      },
      {
        stage: "Recycler Output",
        value: totalOutputWeightKg,
        fill: "output",
      },
      {
        stage: "Manufacturer Purchase",
        value: totalPurchaseWeightKg,
        fill: "purchase",
      },
    ],
  };
}

export async function getDashboardStats() {
  const analytics = await getDashboardAnalytics();
  return {
    farmers: analytics.kpis.farmers,
    suppliers: analytics.kpis.suppliers,
    sackReturns: analytics.kpis.sacksReturnedPass + analytics.kpis.sacksReturnedReject,
    totalDiscountRm: analytics.kpis.totalDiscountRm,
    totalDiscountRmFormatted: analytics.kpis.totalDiscountRmFormatted,
  };
}
