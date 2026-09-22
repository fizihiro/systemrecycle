import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";

const BATCH_SIZE = 5000;
const PROGRAM_ID = "prog_sack2loop_demo";

// Handover Economic Constants
const INCENTIVE_PER_KG = 0.6; // RM 0.60 / kg
const LOGISTICS_TRIP_COST_RM = 150.0; // RM 150 / trip
const RPP_VALUE_PER_KG = 3.55; // RM 3.55 / kg rPP

function getMariaDbConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit: 10,
    connectTimeout: 10_000,
    allowPublicKeyRetrieval: true,
  };
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(getMariaDbConfig() as ConstructorParameters<typeof PrismaMariaDb>[0]),
});

const MATERIAL_TYPES = [
  "Coated/Laminated PP woven",
  "Plain / non-laminated woven PP",
  "Laminated/coated woven PP",
  "BOPP-laminated woven PP",
  "Woven PP + inner PE liner",
] as const;

function buildSackCatalogSeed() {
  return [
    // Specification Fertilizer SKU: P & ONN, Coated/Laminated PP woven, 55x90 cm, 80g weight
    {
      brand: "P & ONN",
      productCategory: "Fertiliser" as const,
      materialType: "Coated/Laminated PP woven" as const,
      dimensions: "55x90 cm",
      sizeKg: 50,
      emptySackWeightG: 80.0,
      discount: Math.round((80 / 1000) * INCENTIVE_PER_KG * 100) / 100 || 0.05,
    },
    {
      brand: "CropCare Plus",
      productCategory: "Fertiliser" as const,
      materialType: "Laminated/coated woven PP" as const,
      dimensions: "50x85 cm",
      sizeKg: 40,
      emptySackWeightG: 75.0,
      discount: Math.round((75 / 1000) * INCENTIVE_PER_KG * 100) / 100 || 0.05,
    },
    {
      brand: "AgriGrow",
      productCategory: "Fertiliser" as const,
      materialType: "Plain / non-laminated woven PP" as const,
      dimensions: "45x75 cm",
      sizeKg: 25,
      emptySackWeightG: 65.0,
      discount: Math.round((65 / 1000) * INCENTIVE_PER_KG * 100) / 100 || 0.04,
    },
    {
      brand: "NutriFeed Gold",
      productCategory: "Animal Feed" as const,
      materialType: "BOPP-laminated woven PP" as const,
      dimensions: "55x95 cm",
      sizeKg: 50,
      emptySackWeightG: 85.0,
      discount: Math.round((85 / 1000) * INCENTIVE_PER_KG * 100) / 100 || 0.05,
    },
    {
      brand: "AeroFeed Dairy",
      productCategory: "Animal Feed" as const,
      materialType: "Woven PP + inner PE liner" as const,
      dimensions: "45x80 cm",
      sizeKg: 25,
      emptySackWeightG: 70.0,
      discount: Math.round((70 / 1000) * INCENTIVE_PER_KG * 100) / 100 || 0.04,
    },
    {
      brand: "AquaGrow",
      productCategory: "Animal Feed" as const,
      materialType: "Plain / non-laminated woven PP" as const,
      dimensions: "40x70 cm",
      sizeKg: 20,
      emptySackWeightG: 60.0,
      discount: Math.round((60 / 1000) * INCENTIVE_PER_KG * 100) / 100 || 0.04,
    },
  ];
}

const SUPPLIERS = [
  { companyName: "AgroSupply Kedah Sdn Bhd", location: "Alor Setar, Kedah", phone: "04-7312200" },
  { companyName: "GreenFert Perak", location: "Ipoh, Perak", phone: "05-2548800" },
  { companyName: "Sumber Tani Selangor", location: "Shah Alam, Selangor", phone: "03-5512345" },
  { companyName: "Negeri Agro N9", location: "Seremban, Negeri Sembilan", phone: "06-7643200" },
  { companyName: "Johor Fertilizer Hub", location: "Kluang, Johor", phone: "07-7721100" },
  { companyName: "PadiMart Kelantan", location: "Kota Bharu, Kelantan", phone: "09-7445600" },
  { companyName: "East Coast Agro Terengganu", location: "Kuala Terengganu", phone: "09-6234500" },
];

const COLLECTORS = [
  { companyName: "EcoPlast Collector Hub", processCapacityKg: 500000, phone: "03-77889900" },
  { companyName: "GreenCycle Recovery Hub", processCapacityKg: 350000, phone: "04-4567890" },
  { companyName: "Malaysia Polymer Collectors", processCapacityKg: 420000, phone: "07-3344556" },
  { companyName: "Circular Sack Collectors Johor", processCapacityKg: 280000, phone: "07-2233445" },
  { companyName: "Sustainable Sack Processing Hub", processCapacityKg: 310000, phone: "05-6677889" },
];

const MANUFACTURERS = [
  { companyName: "Malayan Plastic Manufacturing Sdn Bhd", phone: "03-89451122" },
  { companyName: "TopPolymer Industries Bhd", phone: "07-5566778" },
  { companyName: "Sinaran Moulding & Extrusion", phone: "04-3908822" },
  { companyName: "BioLoop Industrial Products", phone: "03-51239900" },
  { companyName: "GreenTek Compounders Sdn Bhd", phone: "03-78452200" },
];

const FARMER_FIRST = [
  "Ahmad", "Siti", "Ravi", "Lim", "Fatimah", "Hassan", "Mei Ling", "Kumar",
  "Nurul", "Zulkifli", "Tan", "Priya", "Azman", "Wong", "Faridah", "Raj",
  "Hafiz", "Chong", "Aminah", "Deepak", "Roslan", "Yusof", "Letchumi", "Imran",
  "Saraswati", "Kamal", "Noor", "Arjun", "Zainab", "Lee",
];

const FARMER_LAST = [
  "Abdullah", "Rahman", "Subramaniam", "Wei", "Ibrahim", "Muthu", "Ismail",
  "Tan", "Hussin", "Krishnan", "Omar", "Lim", "Yusof", "Singh", "Ali",
  "Ng", "Hamid", "Devi", "Osman", "Chua", "Hassan", "Menon", "Bakar",
  "Gopal", "Salleh", "Chan", "Nair", "Mahmud", "Kaur", "Ho",
];

const ADDRESSES = [
  "Kampung Parit 3, Sekinchan, Selangor",
  "Lot 142, Jalan Padi, Alor Setar, Kedah",
  "Felda Chini 2, Pekan, Pahang",
  "Kampung Baru, Tanjung Karang, Selangor",
  "Taman Desa Padi, Bachok, Kelantan",
  "Lot 88, Jalan Utama, Teluk Intan, Perak",
  "Kampung Sungai Buaya, Banting, Selangor",
  "Felda Kemahang, Jeli, Kelantan",
  "Kampung Permatang, Sungai Petani, Kedah",
  "Taman Sri Padi, Kota Tinggi, Johor",
];

const MONTHLY_DISTRIBUTION_COUNTS: Array<{ year: number; month: number; count: number }> = [
  { year: 2025, month: 8, count: 6900 },
  { year: 2025, month: 9, count: 8500 },
  { year: 2025, month: 10, count: 10500 },
  { year: 2025, month: 11, count: 10500 },
  { year: 2025, month: 12, count: 10500 },
  { year: 2026, month: 1, count: 10500 },
  { year: 2026, month: 2, count: 8500 },
  { year: 2026, month: 3, count: 8500 },
  { year: 2026, month: 4, count: 6900 },
  { year: 2026, month: 5, count: 6900 },
  { year: 2026, month: 6, count: 6900 },
  { year: 2026, month: 7, count: 6900 },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

function randomDateInMonth(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = randomInt(1, daysInMonth);
  return new Date(Date.UTC(year, month - 1, day));
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

async function insertBatches<T>(
  label: string,
  items: T[],
  inserter: (batch: T[]) => Promise<{ count: number }>,
) {
  let inserted = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const result = await inserter(batch);
    inserted += result.count;
    process.stdout.write(`\r  ${label}: ${inserted.toLocaleString()} / ${items.length.toLocaleString()}`);
  }
  process.stdout.write("\n");
}

async function clearBusinessData() {
  console.log("Clearing existing program business data...");
  await prisma.manufacturerSales.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.collectorDelivery.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.sackReturn.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.fertilizerDistribution.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.sackCatalog.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.farmer.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.supplier.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.collector.deleteMany({ where: { programId: PROGRAM_ID } });
  await prisma.manufacturer.deleteMany({ where: { programId: PROGRAM_ID } });
}

async function seedProgram() {
  console.log("Seeding demo program...");
  return prisma.program.upsert({
    where: { id: PROGRAM_ID },
    update: {
      name: "Sack2Loop Malaysia Circular Pilot",
      code: "S2L-MY-2025",
      description: "Handover demo multi-tenant program",
    },
    create: {
      id: PROGRAM_ID,
      name: "Sack2Loop Malaysia Circular Pilot",
      code: "S2L-MY-2025",
      description: "Handover demo multi-tenant program",
    },
  });
}

async function seedMasters() {
  console.log("Seeding master tables with program_id...");

  const sackCatalogSeed = buildSackCatalogSeed();
  const sacks = await Promise.all(
    sackCatalogSeed.map((sack) =>
      prisma.sackCatalog.create({
        data: {
          programId: PROGRAM_ID,
          brand: sack.brand,
          productCategory: sack.productCategory,
          materialType: sack.materialType,
          dimensions: sack.dimensions,
          sizeKg: sack.sizeKg,
          emptySackWeightG: sack.emptySackWeightG,
          discountValueRm: sack.discount,
        },
      }),
    ),
  );

  const suppliers = await Promise.all(
    SUPPLIERS.map((supplier) =>
      prisma.supplier.create({
        data: {
          ...supplier,
          programId: PROGRAM_ID,
        },
      }),
    ),
  );

  const collectors = await Promise.all(
    COLLECTORS.map((collector) =>
      prisma.collector.create({
        data: {
          programId: PROGRAM_ID,
          companyName: collector.companyName,
          processCapacityKg: collector.processCapacityKg,
          phone: collector.phone,
        },
      }),
    ),
  );

  const manufacturers = await Promise.all(
    MANUFACTURERS.map((manufacturer) =>
      prisma.manufacturer.create({
        data: {
          programId: PROGRAM_ID,
          companyName: manufacturer.companyName,
          phone: manufacturer.phone,
        },
      }),
    ),
  );

  const farmers = await Promise.all(
    Array.from({ length: 35 }, (_, index) => {
      const first = FARMER_FIRST[index % FARMER_FIRST.length]!;
      const last = FARMER_LAST[(index * 3) % FARMER_LAST.length]!;
      return prisma.farmer.create({
        data: {
          programId: PROGRAM_ID,
          name: `${first} bin ${last}`,
          phone: `01${randomInt(2, 9)}-${randomInt(100, 999)}${randomInt(1000, 9999)}`,
          address: pick(ADDRESSES),
        },
      });
    }),
  );

  return { sacks, suppliers, collectors, farmers, manufacturers };
}

type DistributionRow = {
  programId: string;
  date: Date;
  supplierId: number;
  farmerId: number;
  sackId: number;
  quantity: number;
};

async function seedDistributions(
  masters: Awaited<ReturnType<typeof seedMasters>>,
) {
  console.log("Seeding fertilizer distributions (102k+ records)...");

  const distributions: DistributionRow[] = [];
  const supplierIds = masters.suppliers.map((s) => s.id);
  const farmerIds = masters.farmers.map((f) => f.id);
  const sackIds = masters.sacks.map((s) => s.id);

  for (const { year, month, count } of MONTHLY_DISTRIBUTION_COUNTS) {
    for (let i = 0; i < count; i++) {
      distributions.push({
        programId: PROGRAM_ID,
        date: randomDateInMonth(year, month),
        supplierId: pick(supplierIds),
        farmerId: pick(farmerIds),
        sackId: pick(sackIds),
        quantity: randomInt(1, 8),
      });
    }
  }

  await insertBatches("Distributions", distributions, (batch) =>
    prisma.fertilizerDistribution.createMany({ data: batch }),
  );

  return distributions;
}

type ReturnAccumulator = {
  programId: string;
  batchId: string;
  date: Date;
  farmerId: number;
  supplierId: number;
  collectorId: number;
  sackId: number;
  quantity: number;
  totalDiscountRm: number;
};

async function seedReturns(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  distributions: DistributionRow[],
) {
  console.log("Seeding sack returns with Batch IDs and Collectors (42k+ records)...");

  const sackDiscountMap = new Map(
    masters.sacks.map((sack) => [sack.id, Number(sack.discountValueRm)]),
  );
  const sackWeightGMap = new Map(
    masters.sacks.map((sack) => [sack.id, Number(sack.emptySackWeightG)]),
  );

  const totalDistributed = distributions.reduce((sum, row) => sum + row.quantity, 0);
  const targetQuantity = Math.round(totalDistributed * 0.35); // 35% collection target
  const returnRecordCount = 42_000;

  const returnIndices = new Set<number>();
  while (returnIndices.size < returnRecordCount) {
    returnIndices.add(randomInt(0, distributions.length - 1));
  }

  const returns: ReturnAccumulator[] = [];
  let allocatedQuantity = 0;
  const sortedIndices = Array.from(returnIndices);
  const collectorIds = masters.collectors.map((c) => c.id);

  for (let i = 0; i < sortedIndices.length; i++) {
    const dist = distributions[sortedIndices[i]!]!;
    const remaining = targetQuantity - allocatedQuantity;
    const recordsLeft = sortedIndices.length - i;

    let quantity: number;
    if (recordsLeft <= 1) {
      quantity = Math.max(1, remaining);
    } else {
      const avgNeeded = remaining / recordsLeft;
      quantity = Math.max(1, Math.min(6, Math.round(avgNeeded + randomInt(-1, 1))));
    }

    if (allocatedQuantity + quantity > targetQuantity && i < sortedIndices.length - 1) {
      quantity = Math.max(1, targetQuantity - allocatedQuantity);
    }

    allocatedQuantity += quantity;
    const discount = sackDiscountMap.get(dist.sackId) ?? 0.05;
    const returnDate = addMonths(dist.date, randomInt(0, 2));
    const yearMonth = `${returnDate.getUTCFullYear()}${String(returnDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const batchId = `BATCH-${yearMonth}-${String(i + 1).padStart(5, "0")}`;

    returns.push({
      programId: PROGRAM_ID,
      batchId,
      date: returnDate,
      farmerId: dist.farmerId,
      supplierId: dist.supplierId,
      collectorId: pick(collectorIds),
      sackId: dist.sackId,
      quantity,
      totalDiscountRm: round2(quantity * discount),
    });
  }

  await insertBatches("Returns", returns, (batch) =>
    prisma.sackReturn.createMany({ data: batch }),
  );

  const totalCollected = returns.reduce((sum, row) => sum + row.quantity, 0);

  return { returns, totalCollected, sackWeightGMap };
}

async function seedCollectorDeliveries(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  returns: ReturnAccumulator[],
  sackWeightGMap: Map<number, number>,
) {
  console.log("Seeding collector receipts with strict output <= input weight validation...");

  type DeliveryBucket = {
    monthKey: string;
    supplierId: number;
    collectorId: number;
    quantity: number;
    weightKg: number;
  };

  const buckets = new Map<string, DeliveryBucket>();

  for (const row of returns) {
    const monthKey = `${row.date.getUTCFullYear()}-${String(row.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const key = `${monthKey}:${row.collectorId}:${row.supplierId}`;
    const emptyG = sackWeightGMap.get(row.sackId) ?? 80;
    // Dynamic mass formula: (pieces * empty_sack_weight_g) / 1000
    const weight = (row.quantity * emptyG) / 1000;
    const existing = buckets.get(key);

    if (existing) {
      existing.quantity += row.quantity;
      existing.weightKg += weight;
    } else {
      buckets.set(key, {
        monthKey,
        supplierId: row.supplierId,
        collectorId: row.collectorId,
        quantity: row.quantity,
        weightKg: weight,
      });
    }
  }

  const deliveries = Array.from(buckets.values()).map((bucket) => {
    const [year, month] = bucket.monthKey.split("-").map(Number);
    const inputWeightKg = round2(bucket.weightKg);
    // Strict requirement: Recycled output NEVER exceeds input weight (e.g. 82% to 88% yield)
    const recoveryRate = 0.82 + Math.random() * 0.06;
    const outputWeightKg = Math.min(inputWeightKg, round2(inputWeightKg * recoveryRate));

    return {
      programId: PROGRAM_ID,
      date: addMonths(randomDateInMonth(year!, month!), randomInt(0, 1)),
      supplierId: bucket.supplierId,
      collectorId: bucket.collectorId,
      sackQty: bucket.quantity,
      inputWeightKg,
      outputWeightKg,
    };
  });

  await insertBatches("Collector deliveries", deliveries, (batch) =>
    prisma.collectorDelivery.createMany({ data: batch }),
  );

  return deliveries;
}

async function seedManufacturerSales(
  masters: Awaited<ReturnType<typeof seedMasters>>,
) {
  console.log("Seeding manufacturer sales with RM3.55/kg rPP market value...");

  const collectorIds = masters.collectors.map((c) => c.id);
  const manufacturerIds = masters.manufacturers.map((m) => m.id);

  const initialSales = [
    {
      programId: PROGRAM_ID,
      date: new Date("2026-02-15"),
      recyclerId: collectorIds[0] ?? 1,
      manufacturerId: manufacturerIds[0] ?? 1,
      purchaseWeightKg: 4500.0,
      salesPriceRm: round2(4500.0 * RPP_VALUE_PER_KG),
    },
    {
      programId: PROGRAM_ID,
      date: new Date("2026-02-28"),
      recyclerId: collectorIds[1] ?? 2,
      manufacturerId: manufacturerIds[1] ?? 2,
      purchaseWeightKg: 3800.0,
      salesPriceRm: round2(3800.0 * RPP_VALUE_PER_KG),
    },
    {
      programId: PROGRAM_ID,
      date: new Date("2026-03-10"),
      recyclerId: collectorIds[2] ?? 3,
      manufacturerId: manufacturerIds[2] ?? 3,
      purchaseWeightKg: 5200.0,
      salesPriceRm: round2(5200.0 * RPP_VALUE_PER_KG),
    },
    {
      programId: PROGRAM_ID,
      date: new Date("2026-03-15"),
      recyclerId: collectorIds[0] ?? 1,
      manufacturerId: manufacturerIds[3] ?? 4,
      purchaseWeightKg: 2900.0,
      salesPriceRm: round2(2900.0 * RPP_VALUE_PER_KG),
    },
  ];

  await prisma.manufacturerSales.createMany({ data: initialSales });
  return initialSales;
}

async function printSummary() {
  const [
    farmers,
    suppliers,
    collectors,
    manufacturers,
    sacks,
    distributions,
    returns,
    deliveries,
    sales,
    distQty,
    returnQty,
    deliveryAgg,
    discountSum,
    salesAgg,
    massDist,
    massReturn,
  ] = await Promise.all([
    prisma.farmer.count({ where: { programId: PROGRAM_ID } }),
    prisma.supplier.count({ where: { programId: PROGRAM_ID } }),
    prisma.collector.count({ where: { programId: PROGRAM_ID } }),
    prisma.manufacturer.count({ where: { programId: PROGRAM_ID } }),
    prisma.sackCatalog.count({ where: { programId: PROGRAM_ID } }),
    prisma.fertilizerDistribution.count({ where: { programId: PROGRAM_ID } }),
    prisma.sackReturn.count({ where: { programId: PROGRAM_ID } }),
    prisma.collectorDelivery.count({ where: { programId: PROGRAM_ID } }),
    prisma.manufacturerSales.count({ where: { programId: PROGRAM_ID } }),
    prisma.fertilizerDistribution.aggregate({
      where: { programId: PROGRAM_ID },
      _sum: { quantity: true },
    }),
    prisma.sackReturn.aggregate({
      where: { programId: PROGRAM_ID },
      _sum: { quantity: true },
    }),
    prisma.collectorDelivery.aggregate({
      where: { programId: PROGRAM_ID },
      _sum: { sackQty: true, inputWeightKg: true, outputWeightKg: true },
    }),
    prisma.sackReturn.aggregate({
      where: { programId: PROGRAM_ID },
      _sum: { totalDiscountRm: true },
    }),
    prisma.manufacturerSales.aggregate({
      where: { programId: PROGRAM_ID },
      _sum: { purchaseWeightKg: true, salesPriceRm: true },
    }),
    prisma.$queryRaw<Array<{ totalKg: number }>>`
      SELECT CAST(COALESCE(SUM(fd.quantity * sc.empty_sack_weight_g / 1000), 0) AS DECIMAL(20,2)) AS totalKg
      FROM fertilizer_distribution fd
      JOIN sack_catalog sc ON sc.id = fd.sack_id
      WHERE fd.program_id = ${PROGRAM_ID}
    `,
    prisma.$queryRaw<Array<{ totalKg: number }>>`
      SELECT CAST(COALESCE(SUM(sr.quantity * sc.empty_sack_weight_g / 1000), 0) AS DECIMAL(20,2)) AS totalKg
      FROM sack_return sr
      JOIN sack_catalog sc ON sc.id = sr.sack_id
      WHERE sr.program_id = ${PROGRAM_ID}
    `,
  ]);

  const distributedPcs = Number(distQty._sum.quantity ?? 0);
  const collectedPcs = Number(returnQty._sum.quantity ?? 0);
  const deliveredPcs = Number(deliveryAgg._sum.sackQty ?? 0);
  const collectionRate = distributedPcs > 0 ? ((collectedPcs / distributedPcs) * 100).toFixed(1) : "0";

  const distKg = Number(massDist[0]?.totalKg ?? 0);
  const returnKg = Number(massReturn[0]?.totalKg ?? 0);
  const distTonnes = (distKg / 1000).toFixed(2);
  const returnTonnes = (returnKg / 1000).toFixed(2);

  const inputKg = Number(deliveryAgg._sum.inputWeightKg ?? 0);
  const outputKg = Number(deliveryAgg._sum.outputWeightKg ?? 0);
  const recoveryYield = inputKg > 0 ? ((outputKg / inputKg) * 100).toFixed(1) : "0";

  const returnGapPieces = Math.max(0, distributedPcs - collectedPcs);
  const returnGapPct = distributedPcs > 0 ? ((returnGapPieces / distributedPcs) * 100).toFixed(1) : "0";

  const totalDiscountRm = Number(discountSum._sum.totalDiscountRm ?? 0);
  const salesWeightKg = Number(salesAgg._sum.purchaseWeightKg ?? 0);
  const salesPriceTotal = Number(salesAgg._sum.salesPriceRm ?? 0);
  const logisticsTrips = deliveries;
  const totalLogisticsCost = logisticsTrips * LOGISTICS_TRIP_COST_RM;
  const rppEconomicValue = outputKg * RPP_VALUE_PER_KG;

  console.log("\n=======================================================");
  console.log("   SACK2LOOP PROGRAM SEED VERIFICATION (24 KPIS)       ");
  console.log("=======================================================");
  console.log(`Program ID: ${PROGRAM_ID}`);
  console.log(`Constants: Incentive RM${INCENTIVE_PER_KG}/kg | Trip RM${LOGISTICS_TRIP_COST_RM} | rPP RM${RPP_VALUE_PER_KG}/kg\n`);

  console.log("Master Entities:");
  console.log(`  1. Farmers: ${farmers} (No login access)`);
  console.log(`  2. Suppliers: ${suppliers} (Dedicated login)`);
  console.log(`  3. Collectors: ${collectors} (Record-keeping only - No login)`);
  console.log(`  4. Manufacturers: ${manufacturers} (PRO dedicated login)`);
  console.log(`  5. Sack Catalog SKUs: ${sacks} (Includes P & ONN 80g SKU)`);

  console.log("\nSack Volume KPIs:");
  console.log(`  6. Sacks Distributed: ${distributedPcs.toLocaleString()} pcs`);
  console.log(`  7. Sacks Collected: ${collectedPcs.toLocaleString()} pcs`);
  console.log(`  8. Sacks to Recycler: ${deliveredPcs.toLocaleString()} pcs`);
  console.log(`  9. Collection Rate: ${collectionRate}%`);

  console.log("\nDynamic Mass KPIs (Formula: pieces * empty_sack_weight_g / 1000):");
  console.log(` 10. Distributed Mass (kg): ${distKg.toLocaleString()} kg`);
  console.log(` 11. Distributed Mass (tonnes): ${distTonnes} t`);
  console.log(` 12. Collected Mass (kg): ${returnKg.toLocaleString()} kg`);
  console.log(` 13. Collected Mass (tonnes): ${returnTonnes} t`);

  console.log("\nRecycler Processing KPIs (Output <= Input strict validation):");
  console.log(` 14. Accepted Input Weight (kg): ${inputKg.toLocaleString()} kg`);
  console.log(` 15. Accepted Input Weight (tonnes): ${(inputKg / 1000).toFixed(2)} t`);
  console.log(` 16. Recycled Output Weight (kg): ${outputKg.toLocaleString()} kg`);
  console.log(` 17. Recycled Output Weight (tonnes): ${(outputKg / 1000).toFixed(2)} t`);
  console.log(` 18. Recycler Recovery Yield: ${recoveryYield}% (Validated <= 100%)`);

  console.log("\nLeakage & Incentive KPIs:");
  console.log(` 19. Return Gap (pieces): ${returnGapPieces.toLocaleString()} pcs`);
  console.log(` 20. Return Gap (%): ${returnGapPct}%`);
  console.log(` 21. Total Farmer Incentive: RM ${totalDiscountRm.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

  console.log("\nFinancial & Economic Circularity KPIs:");
  console.log(` 22. Logistics Deliveries & Cost: ${logisticsTrips} trips = RM ${totalLogisticsCost.toLocaleString()}`);
  console.log(` 23. Recycled PP Value Generated: RM ${rppEconomicValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
  console.log(` 24. Manufacturer Sales Recorded: ${salesWeightKg.toLocaleString()} kg = RM ${salesPriceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
  console.log("=======================================================\n");
}

async function main() {
  console.log("Starting Sack2Loop handover demo seed...\n");
  const started = Date.now();

  await seedProgram();
  await clearBusinessData();
  const masters = await seedMasters();
  const distributions = await seedDistributions(masters);
  const { returns, sackWeightGMap } = await seedReturns(masters, distributions);
  await seedCollectorDeliveries(masters, returns, sackWeightGMap);
  await seedManufacturerSales(masters);
  await printSummary();

  console.log(`Finished seeding in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
