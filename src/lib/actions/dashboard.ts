"use server";

import { estimateSackWeightKg, pct, SACK_ESTIMATED_WEIGHT_KG } from "@/lib/dashboard/constants";
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
type DiscountComparisonRow = {
  sackType: string;
  actualDiscountRm: number;
  potentialDiscountRm: number;
  passQty: number;
  distributedQty: number;
};
type SupplierFlowRow = {
  name: string;
  distributed: number;
  returned: number;
};
type FarmerPerformanceRow = {
  farmerId: number;
  farmerName: string;
  distributedQty: number;
  returnedPassQty: number;
  returnedRejectQty: number;
  actualDiscountRm: number;
  potentialDiscountRm: number;
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
    discountComparisonRaw,
    supplierDistributedRaw,
    supplierReturnedRaw,
    farmerPerformanceRaw,
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
    prisma.$queryRaw<
      Array<
        DiscountComparisonRow & {
          discountValueRm: number;
        }
      >
    >`
      SELECT *
      FROM (
        SELECT CONCAT(
                 sc.product_category,
                 ' ',
                 CAST(sc.size_kg AS CHAR),
                 'kg · ',
                 sc.material_type
               ) AS sackType,
               CAST(COALESCE((
                 SELECT SUM(sr.total_discount_rm)
                 FROM sack_return sr
                 WHERE sr.sack_id = sc.id
               ), 0) AS DECIMAL(20,2)) AS actualDiscountRm,
               CAST(COALESCE((
                 SELECT SUM(fd.quantity)
                 FROM fertilizer_distribution fd
                 WHERE fd.sack_id = sc.id
               ), 0) AS DECIMAL(20,0)) AS distributedQty,
               CAST(COALESCE((
                 SELECT SUM(sr.pass_qty)
                 FROM sack_return sr
                 WHERE sr.sack_id = sc.id
               ), 0) AS DECIMAL(20,0)) AS passQty,
               sc.discount_value_rm AS discountValueRm
        FROM sack_catalog sc
      ) AS comparison
      WHERE distributedQty > 0
      ORDER BY distributedQty DESC
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
    prisma.$queryRaw<FarmerPerformanceRow[]>`
      SELECT f.id AS farmerId,
             f.name AS farmerName,
             CAST(COALESCE(d.distributedQty, 0) AS DECIMAL(20,0)) AS distributedQty,
             CAST(COALESCE(r.passQty, 0) AS DECIMAL(20,0)) AS returnedPassQty,
             CAST(COALESCE(r.rejectQty, 0) AS DECIMAL(20,0)) AS returnedRejectQty,
             CAST(COALESCE(r.actualDiscount, 0) AS DECIMAL(20,2)) AS actualDiscountRm,
             CAST(COALESCE(p.potentialDiscount, 0) AS DECIMAL(20,2)) AS potentialDiscountRm
      FROM farmer f
      LEFT JOIN (
        SELECT farmer_id, SUM(quantity) AS distributedQty
        FROM fertilizer_distribution
        GROUP BY farmer_id
      ) d ON d.farmer_id = f.id
      LEFT JOIN (
        SELECT farmer_id,
               SUM(pass_qty) AS passQty,
               SUM(reject_qty) AS rejectQty,
               SUM(total_discount_rm) AS actualDiscount
        FROM sack_return
        GROUP BY farmer_id
      ) r ON r.farmer_id = f.id
      LEFT JOIN (
        SELECT fd.farmer_id,
               SUM(fd.quantity * sc.discount_value_rm) AS potentialDiscount
        FROM fertilizer_distribution fd
        JOIN sack_catalog sc ON sc.id = fd.sack_id
        GROUP BY fd.farmer_id
      ) p ON p.farmer_id = f.id
      WHERE COALESCE(d.distributedQty, 0) > 0
    `,
  ]);

  const sacksDistributed = Number(distributionAgg._sum.quantity ?? 0);
  const sacksReturnedPass = Number(returnAgg._sum.passQty ?? 0);
  const sacksReturnedReject = Number(returnAgg._sum.rejectQty ?? 0);
  const sacksReturnedTotal = sacksReturnedPass + sacksReturnedReject;
  const sacksToRecycler = Number(deliveryAgg._sum.sackQty ?? 0);
  const totalDiscountRm = Number(discountAggregate._sum.totalDiscountRm ?? 0);
  const totalInputWeightKg = Number(deliveryAgg._sum.inputWeightKg ?? 0);
  const totalOutputWeightKg = Number(deliveryAgg._sum.outputWeightKg ?? 0);
  const totalPurchaseWeightKg = Number(salesAgg._sum.purchaseWeightKg ?? 0);
  const totalSalesRevenueRm = Number(salesAgg._sum.salesPriceRm ?? 0);

  const distributedWeightKg = estimateSackWeightKg(sacksDistributed);
  const returnedWeightKg = estimateSackWeightKg(sacksReturnedTotal);
  const returnedPassWeightKg = estimateSackWeightKg(sacksReturnedPass);

  const returnRate = pct(sacksReturnedPass, sacksDistributed);
  const recoveryRate = pct(totalOutputWeightKg, totalInputWeightKg);

  const returnGapPct = pct(
    Math.max(0, sacksDistributed - sacksReturnedTotal),
    sacksDistributed,
  );
  const rejectRatePct = pct(sacksReturnedReject, sacksReturnedTotal);
  const recyclingYieldLossPct = pct(
    Math.max(0, totalOutputWeightKg - totalPurchaseWeightKg),
    totalOutputWeightKg,
  );

  const monthKeys = new Set<string>();
  for (const row of monthlyDistribution) monthKeys.add(row.monthKey);
  for (const row of monthlyReturns) monthKeys.add(row.monthKey);
  for (const row of monthlyDeliveries) monthKeys.add(row.monthKey);

  const distributionMap = new Map(
    monthlyDistribution.map((row) => [row.monthKey, Number(row.value)]),
  );
  const returnsMap = new Map(monthlyReturns.map((row) => [row.monthKey, row]));
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

  const discountComparison = discountComparisonRaw.map((row) => {
    const distributedQty = Number(row.distributedQty);
    const discountValueRm = Number(row.discountValueRm);
    const potentialDiscountRm = distributedQty * discountValueRm;
    const actualDiscountRm = Number(row.actualDiscountRm);

    return {
      sackType: row.sackType,
      actualDiscountRm,
      potentialDiscountRm,
      passQty: Number(row.passQty),
      distributedQty,
      captureRate: pct(actualDiscountRm, potentialDiscountRm),
    };
  }).sort((a, b) => b.potentialDiscountRm - a.potentialDiscountRm);

  const totalPotentialDiscountRm = discountComparison.reduce(
    (sum, row) => sum + row.potentialDiscountRm,
    0,
  );
  const discountCaptureRate = pct(totalDiscountRm, totalPotentialDiscountRm);

  const returnedBySupplier = new Map(
    supplierReturnedRaw.map((row) => [row.name, Number(row.returned)]),
  );

  const supplierFlow = supplierDistributedRaw.map((row) => ({
    name: row.name,
    distributed: Number(row.distributed),
    returned: returnedBySupplier.get(row.name) ?? 0,
  }));

  const farmerMetrics = farmerPerformanceRaw
    .map((row) => {
      const distributedQty = Number(row.distributedQty);
      const returnedPassQty = Number(row.returnedPassQty);
      const actualDiscountRm = Number(row.actualDiscountRm);
      const potentialDiscountRm = Number(row.potentialDiscountRm);

      return {
        farmerId: Number(row.farmerId),
        farmerName: row.farmerName,
        distributedQty,
        returnedPassQty,
        returnedRejectQty: Number(row.returnedRejectQty),
        returnRate: pct(returnedPassQty, distributedQty),
        actualDiscountRm,
        potentialDiscountRm,
        actualDiscountRmFormatted: formatCurrency(actualDiscountRm),
        potentialDiscountRmFormatted: formatCurrency(potentialDiscountRm),
        savingsPct: pct(actualDiscountRm, potentialDiscountRm),
      };
    })
    .filter((f) => f.distributedQty >= 10);

  const sortedByReturnRate = [...farmerMetrics].sort(
    (a, b) => b.returnRate - a.returnRate || b.returnedPassQty - a.returnedPassQty,
  );
  const topPerformingFarmer = sortedByReturnRate[0] ?? null;
  const lowestPerformingFarmer =
    sortedByReturnRate.length > 1
      ? sortedByReturnRate[sortedByReturnRate.length - 1]
      : sortedByReturnRate[0] ?? null;

  const circularFlow = {
    nodes: [
      {
        key: "supplier",
        label: "Supplier",
        pcs: null as number | null,
        kg: null as number | null,
      },
      {
        key: "farmer",
        label: "Farmer",
        pcs: sacksDistributed,
        kg: distributedWeightKg,
      },
      {
        key: "collection",
        label: "Collection Point",
        pcs: sacksReturnedTotal,
        kg: returnedWeightKg,
        sublabel: `${sacksReturnedPass.toLocaleString()} pass · ${sacksReturnedReject.toLocaleString()} reject`,
      },
      {
        key: "recycler",
        label: "Recycler",
        pcs: sacksToRecycler,
        kg: totalInputWeightKg,
      },
      {
        key: "manufacturer",
        label: "Plastic Manufacturer",
        pcs: null,
        kg: totalPurchaseWeightKg,
      },
      {
        key: "newSacks",
        label: "New PP Sacks",
        pcs: null,
        kg: totalOutputWeightKg,
      },
    ],
    leakages: {
      returnGapPct,
      rejectRatePct,
      recyclingYieldLossPct,
    },
    weightEstimateKg: SACK_ESTIMATED_WEIGHT_KG,
  };

  return {
    kpis: {
      farmers,
      suppliers,
      recyclers,
      manufacturers,
      sacksDistributed,
      sacksReturnedPass,
      sacksReturnedReject,
      sacksReturnedTotal,
      sacksToRecycler,
      totalDiscountRm,
      totalDiscountRmFormatted: formatCurrency(totalDiscountRm),
      totalPotentialDiscountRm,
      totalPotentialDiscountRmFormatted: formatCurrency(totalPotentialDiscountRm),
      discountCaptureRate,
      totalInputWeightKg,
      totalOutputWeightKg,
      totalPurchaseWeightKg,
      totalSalesRevenueRm,
      totalSalesRevenueRmFormatted: formatCurrency(totalSalesRevenueRm),
      returnRate,
      recoveryRate,
      distributedWeightKg,
      returnedWeightKg,
      returnedPassWeightKg,
      distributedWeightFormatted: `${formatNumber(distributedWeightKg)} kg`,
      returnedWeightFormatted: `${formatNumber(returnedWeightKg)} kg`,
      totalInputWeightFormatted: `${formatNumber(totalInputWeightKg)} kg`,
      totalOutputWeightFormatted: `${formatNumber(totalOutputWeightKg)} kg`,
      totalPurchaseWeightFormatted: `${formatNumber(totalPurchaseWeightKg)} kg`,
    },
    leakages: {
      returnGapPct,
      rejectRatePct,
      recyclingYieldLossPct,
      returnGapPieces: Math.max(0, sacksDistributed - sacksReturnedTotal),
      rejectPieces: sacksReturnedReject,
      yieldLossKg: Math.max(0, totalOutputWeightKg - totalPurchaseWeightKg),
    },
    circularFlow,
    farmerPerformance: {
      top: topPerformingFarmer,
      lowest: lowestPerformingFarmer,
    },
    sackFlowMonthly,
    discountComparison,
    discountMonthly,
    supplierFlow,
    returnQuality: [
      { name: "pass", label: "Pass", value: sacksReturnedPass },
      { name: "reject", label: "Reject", value: sacksReturnedReject },
    ],
    weightTotals: [
      { stage: "Distributed (est.)", value: distributedWeightKg, fill: "input" },
      { stage: "Returned (est.)", value: returnedWeightKg, fill: "output" },
      { stage: "Recycler Input", value: totalInputWeightKg, fill: "input" },
      { stage: "Recycler Output", value: totalOutputWeightKg, fill: "output" },
      { stage: "Manufacturer Purchase", value: totalPurchaseWeightKg, fill: "purchase" },
    ],
  };
}

export async function getDashboardStats() {
  const analytics = await getDashboardAnalytics();
  return {
    farmers: analytics.kpis.farmers,
    suppliers: analytics.kpis.suppliers,
    sackReturns: analytics.kpis.sacksReturnedTotal,
    totalDiscountRm: analytics.kpis.totalDiscountRm,
    totalDiscountRmFormatted: analytics.kpis.totalDiscountRmFormatted,
  };
}
