"use server";

import {
  kgToTonnes,
  pct,
  RPP_VALUE_PER_KG,
  SACK_ESTIMATED_WEIGHT_KG,
} from "@/lib/dashboard/constants";
import { prisma } from "@/lib/db";
import { formatCurrency, formatNumber, formatPiecesMass } from "@/lib/format";
import { getCurrentProgramId } from "@/lib/tenant";

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
  collectedQty: number;
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
  returnedQty: number;
  actualDiscountRm: number;
  potentialDiscountRm: number;
};

export type DashboardAnalytics = Awaited<ReturnType<typeof getDashboardAnalytics>>;

export async function getDashboardAnalytics() {
  const programId = await getCurrentProgramId();

  const [
    farmers,
    suppliers,
    collectors,
    manufacturers,
    distributionAgg,
    returnAgg,
    deliveryAgg,
    discountAggregate,
    monthlyDistribution,
    monthlyReturns,
    monthlyDeliveries,
    discountComparisonRaw,
    supplierDistributedRaw,
    supplierReturnedRaw,
    farmerPerformanceRaw,
    distributedMassRaw,
    collectedMassRaw,
  ] = await Promise.all([
    prisma.farmer.count({ where: { programId } }),
    prisma.supplier.count({ where: { programId } }),
    prisma.collector.count({ where: { programId } }),
    prisma.manufacturer.count({ where: { programId } }),
    prisma.fertilizerDistribution.aggregate({
      where: { programId },
      _sum: { quantity: true },
    }),
    prisma.sackReturn.aggregate({
      where: { programId },
      _sum: { quantity: true },
    }),
    prisma.collectorDelivery.aggregate({
      where: { programId },
      _sum: { sackQty: true, inputWeightKg: true, outputWeightKg: true },
    }),
    prisma.sackReturn.aggregate({
      where: { programId },
      _sum: { totalDiscountRm: true },
    }),
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT DATE_FORMAT(date, '%Y-%m') AS monthKey,
             CAST(SUM(quantity) AS DECIMAL(20,0)) AS value
      FROM fertilizer_distribution
      WHERE program_id = ${programId}
      GROUP BY monthKey
      ORDER BY monthKey
    `,
    prisma.$queryRaw<
      Array<{
        monthKey: string;
        returned: number;
        discountRm: number;
      }>
    >`
      SELECT DATE_FORMAT(date, '%Y-%m') AS monthKey,
             CAST(SUM(quantity) AS DECIMAL(20,0)) AS returned,
             CAST(SUM(total_discount_rm) AS DECIMAL(20,2)) AS discountRm
      FROM sack_return
      WHERE program_id = ${programId}
      GROUP BY monthKey
      ORDER BY monthKey
    `,
    prisma.$queryRaw<MonthlyRow[]>`
      SELECT DATE_FORMAT(date, '%Y-%m') AS monthKey,
             CAST(SUM(sack_qty) AS DECIMAL(20,0)) AS value
      FROM collector_delivery
      WHERE program_id = ${programId}
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
                 COALESCE(CONCAT(sc.brand, ' · '), ''),
                 sc.product_category,
                 ' ',
                 CAST(sc.size_kg AS CHAR),
                 'kg · ',
                 sc.material_type
               ) AS sackType,
               CAST(COALESCE((
                 SELECT SUM(sr.total_discount_rm)
                 FROM sack_return sr
                 WHERE sr.sack_id = sc.id AND sr.program_id = ${programId}
               ), 0) AS DECIMAL(20,2)) AS actualDiscountRm,
               CAST(COALESCE((
                 SELECT SUM(fd.quantity)
                 FROM fertilizer_distribution fd
                 WHERE fd.sack_id = sc.id AND fd.program_id = ${programId}
               ), 0) AS DECIMAL(20,0)) AS distributedQty,
               CAST(COALESCE((
                 SELECT SUM(sr.quantity)
                 FROM sack_return sr
                 WHERE sr.sack_id = sc.id AND sr.program_id = ${programId}
               ), 0) AS DECIMAL(20,0)) AS collectedQty,
               sc.discount_value_rm AS discountValueRm
        FROM sack_catalog sc
        WHERE sc.program_id = ${programId}
      ) AS comparison
      WHERE distributedQty > 0
      ORDER BY distributedQty DESC
    `,
    prisma.$queryRaw<SupplierFlowRow[]>`
      SELECT s.company_name AS name,
             CAST(SUM(fd.quantity) AS DECIMAL(20,0)) AS distributed
      FROM fertilizer_distribution fd
      JOIN supplier s ON s.id = fd.supplier_id
      WHERE fd.program_id = ${programId}
      GROUP BY s.company_name
      ORDER BY distributed DESC
      LIMIT 6
    `,
    prisma.$queryRaw<SupplierFlowRow[]>`
      SELECT s.company_name AS name,
             CAST(SUM(sr.quantity) AS DECIMAL(20,0)) AS returned
      FROM sack_return sr
      JOIN supplier s ON s.id = sr.supplier_id
      WHERE sr.program_id = ${programId}
      GROUP BY s.company_name
    `,
    prisma.$queryRaw<FarmerPerformanceRow[]>`
      SELECT f.id AS farmerId,
             f.name AS farmerName,
             CAST(COALESCE(d.distributedQty, 0) AS DECIMAL(20,0)) AS distributedQty,
             CAST(COALESCE(r.returnedQty, 0) AS DECIMAL(20,0)) AS returnedQty,
             CAST(COALESCE(r.actualDiscount, 0) AS DECIMAL(20,2)) AS actualDiscountRm,
             CAST(COALESCE(p.potentialDiscount, 0) AS DECIMAL(20,2)) AS potentialDiscountRm
      FROM farmer f
      LEFT JOIN (
        SELECT farmer_id, SUM(quantity) AS distributedQty
        FROM fertilizer_distribution
        WHERE program_id = ${programId}
        GROUP BY farmer_id
      ) d ON d.farmer_id = f.id
      LEFT JOIN (
        SELECT farmer_id,
               SUM(quantity) AS returnedQty,
               SUM(total_discount_rm) AS actualDiscount
        FROM sack_return
        WHERE program_id = ${programId}
        GROUP BY farmer_id
      ) r ON r.farmer_id = f.id
      LEFT JOIN (
        SELECT fd.farmer_id,
               SUM(fd.quantity * sc.discount_value_rm) AS potentialDiscount
        FROM fertilizer_distribution fd
        JOIN sack_catalog sc ON sc.id = fd.sack_id
        WHERE fd.program_id = ${programId}
        GROUP BY fd.farmer_id
      ) p ON p.farmer_id = f.id
      WHERE f.program_id = ${programId} AND COALESCE(d.distributedQty, 0) > 0
    `,
    prisma.$queryRaw<Array<{ totalKg: number }>>`
      SELECT CAST(COALESCE(SUM(fd.quantity * sc.empty_sack_weight_g / 1000), 0) AS DECIMAL(20,2)) AS totalKg
      FROM fertilizer_distribution fd
      JOIN sack_catalog sc ON sc.id = fd.sack_id
      WHERE fd.program_id = ${programId}
    `,
    prisma.$queryRaw<Array<{ totalKg: number }>>`
      SELECT CAST(COALESCE(SUM(sr.quantity * sc.empty_sack_weight_g / 1000), 0) AS DECIMAL(20,2)) AS totalKg
      FROM sack_return sr
      JOIN sack_catalog sc ON sc.id = sr.sack_id
      WHERE sr.program_id = ${programId}
    `,
  ]);

  const sacksDistributed = Number(distributionAgg._sum.quantity ?? 0);
  const sacksCollected = Number(returnAgg._sum.quantity ?? 0);
  const sacksToCollector = Number(deliveryAgg._sum.sackQty ?? 0);
  const totalDiscountRm = Number(discountAggregate._sum.totalDiscountRm ?? 0);
  const totalInputWeightKg = Number(deliveryAgg._sum.inputWeightKg ?? 0);
  const totalOutputWeightKg = Number(deliveryAgg._sum.outputWeightKg ?? 0);

  // Dynamic mass calculated from Sack SKU empty_sack_weight_g
  const distributedWeightKg = Number(distributedMassRaw[0]?.totalKg ?? 0);
  const collectedWeightKg = Number(collectedMassRaw[0]?.totalKg ?? 0);
  const distributedWeightTonnes = kgToTonnes(distributedWeightKg);
  const collectedWeightTonnes = kgToTonnes(collectedWeightKg);
  const totalInputWeightTonnes = kgToTonnes(totalInputWeightKg);
  const totalOutputWeightTonnes = kgToTonnes(totalOutputWeightKg);
  const rppEconomicValueRm = Math.round(totalOutputWeightKg * RPP_VALUE_PER_KG * 100) / 100;

  const collectionRate = pct(sacksCollected, sacksDistributed);
  const recoveryYieldPct = pct(totalOutputWeightKg, totalInputWeightKg);

  const returnGapPieces = Math.max(0, sacksDistributed - sacksCollected);
  const returnGapPct = pct(returnGapPieces, sacksDistributed);

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
        collected: Number(returns?.returned ?? 0),
        toCollector: deliveryMap.get(key) ?? 0,
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
      collectedQty: Number(row.collectedQty),
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
      const returnedQty = Number(row.returnedQty);
      const actualDiscountRm = Number(row.actualDiscountRm);
      const potentialDiscountRm = Number(row.potentialDiscountRm);

      return {
        farmerId: Number(row.farmerId),
        farmerName: row.farmerName,
        distributedQty,
        returnedQty,
        returnRate: pct(returnedQty, distributedQty),
        actualDiscountRm,
        potentialDiscountRm,
        actualDiscountRmFormatted: formatCurrency(actualDiscountRm),
        potentialDiscountRmFormatted: formatCurrency(potentialDiscountRm),
        savingsPct: pct(actualDiscountRm, potentialDiscountRm),
      };
    })
    .filter((f) => f.distributedQty >= 10);

  const sortedByReturnRate = [...farmerMetrics].sort(
    (a, b) => b.returnRate - a.returnRate || b.returnedQty - a.returnedQty,
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
        tonnes: distributedWeightTonnes,
      },
      {
        key: "collection",
        label: "Collection Point",
        pcs: sacksCollected,
        kg: collectedWeightKg,
        tonnes: collectedWeightTonnes,
      },
      {
        key: "collector",
        label: "Collector Hub",
        pcs: sacksToCollector,
        kg: totalInputWeightKg,
        tonnes: totalInputWeightTonnes,
        outputKg: totalOutputWeightKg,
        outputTonnes: totalOutputWeightTonnes,
      },
    ],
    recoveryYieldPct,
    returnGapPct,
    weightEstimateKg: SACK_ESTIMATED_WEIGHT_KG,
  };

  return {
    kpis: {
      farmers,
      suppliers,
      collectors,
      manufacturers,
      sacksDistributed,
      sacksCollected,
      sacksToCollector,
      collectionRate,
      distributedWeightKg,
      distributedWeightTonnes,
      distributedWeightFormatted: `${formatNumber(distributedWeightKg)} kg`,
      distributedMassFormatted: formatPiecesMass(sacksDistributed, distributedWeightKg, distributedWeightTonnes),
      collectedWeightKg,
      collectedWeightTonnes,
      collectedWeightFormatted: `${formatNumber(collectedWeightKg)} kg`,
      collectedMassFormatted: formatPiecesMass(sacksCollected, collectedWeightKg, collectedWeightTonnes),
      totalInputWeightKg,
      totalInputWeightTonnes,
      totalInputWeightFormatted: `${formatNumber(totalInputWeightKg)} kg`,
      inputMassFormatted: formatPiecesMass(sacksToCollector, totalInputWeightKg, totalInputWeightTonnes),
      totalOutputWeightKg,
      totalOutputWeightTonnes,
      totalOutputWeightFormatted: `${formatNumber(totalOutputWeightKg)} kg`,
      outputMassFormatted: `${formatNumber(totalOutputWeightKg)} kg | ${formatNumber(totalOutputWeightTonnes, 3)} t`,
      recoveryYieldPct,
      returnGapPieces,
      returnGapPct,
      returnGapMassFormatted: formatPiecesMass(returnGapPieces, returnGapPieces * SACK_ESTIMATED_WEIGHT_KG, (returnGapPieces * SACK_ESTIMATED_WEIGHT_KG) / 1000),
      totalDiscountRm,
      totalDiscountRmFormatted: formatCurrency(totalDiscountRm),
      totalPotentialDiscountRm,
      totalPotentialDiscountRmFormatted: formatCurrency(totalPotentialDiscountRm),
      discountCaptureRate,
      rppEconomicValueRm,
      rppEconomicValueFormatted: formatCurrency(rppEconomicValueRm),
    },
    leakages: {
      returnGapPct,
      returnGapPieces,
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
    weightTotals: [
      { stage: "Distributed (est.)", value: distributedWeightKg, fill: "distributed" },
      { stage: "Collected (est.)", value: collectedWeightKg, fill: "collected" },
      { stage: "Collector Input", value: totalInputWeightKg, fill: "input" },
      { stage: "Collector Output", value: totalOutputWeightKg, fill: "output" },
    ],
  };
}

export async function getDashboardStats() {
  const analytics = await getDashboardAnalytics();
  return {
    farmers: analytics.kpis.farmers,
    suppliers: analytics.kpis.suppliers,
    collectors: analytics.kpis.collectors,
    manufacturers: analytics.kpis.manufacturers,
    sacksDistributed: analytics.kpis.sacksDistributed,
    sacksCollected: analytics.kpis.sacksCollected,
    recoveryYieldPct: analytics.kpis.recoveryYieldPct,
    totalDiscountRm: analytics.kpis.totalDiscountRm,
    totalDiscountRmFormatted: analytics.kpis.totalDiscountRmFormatted,
  };
}
