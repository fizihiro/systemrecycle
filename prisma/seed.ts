import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";

const BATCH_SIZE = 5000;

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
  "Plain / non-laminated woven PP",
  "Laminated/coated woven PP",
  "BOPP-laminated woven PP",
  "Woven PP + inner PE liner",
  "FIBC / jumbo PP bag",
] as const;

function buildSackCatalogSeed() {
  const entries: Array<{
    productCategory: "Fertiliser" | "Animal Feed";
    sizeKg: number;
    materialType: (typeof MATERIAL_TYPES)[number];
    discount: number;
    weightKg: number;
  }> = [];

  for (const sizeKg of [20, 25, 50]) {
    entries.push({
      productCategory: "Animal Feed",
      sizeKg,
      materialType: pick([...MATERIAL_TYPES]),
      discount: Math.round(sizeKg * 0.05 * 100) / 100,
      weightKg: Math.round(sizeKg * 3.6) / 1000,
    });
  }

  for (const sizeKg of [25, 40, 50]) {
    entries.push({
      productCategory: "Fertiliser",
      sizeKg,
      materialType: pick([...MATERIAL_TYPES]),
      discount: Math.round(sizeKg * 0.05 * 100) / 100,
      weightKg: Math.round(sizeKg * 3.6) / 1000,
    });
  }

  return entries;
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
  { companyName: "EcoPlast Collector & Processing", processCapacityKg: 500000, phone: "03-77889900" },
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
  console.log("Clearing existing business data...");
  await prisma.manufacturerSales.deleteMany();
  await prisma.collectorDelivery.deleteMany();
  await prisma.sackReturn.deleteMany();
  await prisma.fertilizerDistribution.deleteMany();
  await prisma.sackCatalog.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.collector.deleteMany();
  await prisma.manufacturer.deleteMany();
}

async function seedMasters() {
  console.log("Seeding master tables...");

  const sackCatalogSeed = buildSackCatalogSeed();
  const sacks = await Promise.all(
    sackCatalogSeed.map((sack) =>
      prisma.sackCatalog.create({
        data: {
          productCategory: sack.productCategory,
          materialType: sack.materialType,
          sizeKg: sack.sizeKg,
          discountValueRm: sack.discount,
        },
      }),
    ),
  );

  const suppliers = await Promise.all(
    SUPPLIERS.map((supplier) => prisma.supplier.create({ data: supplier })),
  );

  const collectors = await Promise.all(
    COLLECTORS.map((collector) =>
      prisma.collector.create({
        data: {
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
  date: Date;
  farmerId: number;
  supplierId: number;
  sackId: number;
  quantity: number;
  totalDiscountRm: number;
};

async function seedReturns(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  distributions: DistributionRow[],
) {
  console.log("Seeding sack returns (40k+ records)...");

  const sackDiscountMap = new Map(
    masters.sacks.map((sack) => [sack.id, Number(sack.discountValueRm)]),
  );
  const sackWeightMap = new Map(
    masters.sacks.map((sack) => [
      sack.id,
      Math.round(sack.sizeKg * 3.6) / 1000,
    ]),
  );

  const totalDistributed = distributions.reduce((sum, row) => sum + row.quantity, 0);
  const targetQuantity = Math.round(totalDistributed * 0.35);
  const returnRecordCount = 42_000;

  const returnIndices = new Set<number>();
  while (returnIndices.size < returnRecordCount) {
    returnIndices.add(randomInt(0, distributions.length - 1));
  }

  const returns: ReturnAccumulator[] = [];
  let allocatedQuantity = 0;
  const sortedIndices = Array.from(returnIndices);

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
    const discount = sackDiscountMap.get(dist.sackId) ?? 1.5;

    returns.push({
      date: addMonths(dist.date, randomInt(0, 2)),
      farmerId: dist.farmerId,
      supplierId: dist.supplierId,
      sackId: dist.sackId,
      quantity,
      totalDiscountRm: round2(quantity * discount),
    });
  }

  await insertBatches("Returns", returns, (batch) =>
    prisma.sackReturn.createMany({ data: batch }),
  );

  const totalCollected = returns.reduce((sum, row) => sum + row.quantity, 0);

  return { returns, totalCollected, sackWeightMap };
}

async function seedCollectorDeliveries(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  returns: ReturnAccumulator[],
  sackWeightMap: Map<number, number>,
) {
  console.log("Seeding collector deliveries...");

  type DeliveryBucket = {
    monthKey: string;
    supplierId: number;
    quantity: number;
    weightKg: number;
  };

  const buckets = new Map<string, DeliveryBucket>();

  for (const row of returns) {
    const monthKey = `${row.date.getUTCFullYear()}-${String(row.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const key = `${monthKey}:${row.supplierId}`;
    const weight = row.quantity * (sackWeightMap.get(row.sackId) ?? 0.14);
    const existing = buckets.get(key);

    if (existing) {
      existing.quantity += row.quantity;
      existing.weightKg += weight;
    } else {
      buckets.set(key, {
        monthKey,
        supplierId: row.supplierId,
        quantity: row.quantity,
        weightKg: weight,
      });
    }
  }

  const deliveries = Array.from(buckets.values()).map((bucket) => {
    const [year, month] = bucket.monthKey.split("-").map(Number);
    const inputWeightKg = round2(bucket.weightKg);
    const recoveryRate = 0.82 + Math.random() * 0.08;
    const outputWeightKg = round2(inputWeightKg * recoveryRate);

    return {
      date: addMonths(randomDateInMonth(year!, month!), randomInt(0, 1)),
      supplierId: bucket.supplierId,
      collectorId: pick(masters.collectors.map((c) => c.id)),
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
  console.log("Seeding manufacturer sales...");

  const collectorIds = masters.collectors.map((c) => c.id);
  const manufacturerIds = masters.manufacturers.map((m) => m.id);

  const initialSales = [
    {
      date: new Date("2026-02-15"),
      recyclerId: collectorIds[0] ?? 1,
      manufacturerId: manufacturerIds[0] ?? 1,
      purchaseWeightKg: 4500.0,
      salesPriceRm: 11250.0,
    },
    {
      date: new Date("2026-02-28"),
      recyclerId: collectorIds[1] ?? 2,
      manufacturerId: manufacturerIds[1] ?? 2,
      purchaseWeightKg: 3800.0,
      salesPriceRm: 9500.0,
    },
    {
      date: new Date("2026-03-10"),
      recyclerId: collectorIds[2] ?? 3,
      manufacturerId: manufacturerIds[2] ?? 3,
      purchaseWeightKg: 5200.0,
      salesPriceRm: 13000.0,
    },
    {
      date: new Date("2026-03-15"),
      recyclerId: collectorIds[0] ?? 1,
      manufacturerId: manufacturerIds[3] ?? 4,
      purchaseWeightKg: 2900.0,
      salesPriceRm: 7250.0,
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
  ] = await Promise.all([
    prisma.farmer.count(),
    prisma.supplier.count(),
    prisma.collector.count(),
    prisma.manufacturer.count(),
    prisma.sackCatalog.count(),
    prisma.fertilizerDistribution.count(),
    prisma.sackReturn.count(),
    prisma.collectorDelivery.count(),
    prisma.manufacturerSales.count(),
    prisma.fertilizerDistribution.aggregate({ _sum: { quantity: true } }),
    prisma.sackReturn.aggregate({ _sum: { quantity: true } }),
    prisma.collectorDelivery.aggregate({ _sum: { inputWeightKg: true, outputWeightKg: true } }),
    prisma.sackReturn.aggregate({ _sum: { totalDiscountRm: true } }),
    prisma.manufacturerSales.aggregate({ _sum: { purchaseWeightKg: true, salesPriceRm: true } }),
  ]);

  const distributed = Number(distQty._sum.quantity ?? 0);
  const collected = Number(returnQty._sum.quantity ?? 0);
  const returnRate = distributed > 0 ? ((collected / distributed) * 100).toFixed(1) : "0";
  const inputKg = Number(deliveryAgg._sum.inputWeightKg ?? 0);
  const outputKg = Number(deliveryAgg._sum.outputWeightKg ?? 0);
  const recoveryYield = inputKg > 0 ? ((outputKg / inputKg) * 100).toFixed(1) : "0";
  const salesWeightKg = Number(salesAgg._sum.purchaseWeightKg ?? 0);
  const salesPriceTotal = Number(salesAgg._sum.salesPriceRm ?? 0);

  console.log("\nSeed complete:");
  console.log(`  Masters: ${farmers} farmers, ${suppliers} suppliers, ${collectors} collectors, ${manufacturers} manufacturers, ${sacks} sack types`);
  console.log(`  Transactions: ${distributions.toLocaleString()} distributions, ${returns.toLocaleString()} returns, ${deliveries} collector deliveries, ${sales} manufacturer sales`);
  console.log(`  Total distributed: ${distributed.toLocaleString()} pcs`);
  console.log(`  Total collected: ${collected.toLocaleString()} pcs (${returnRate}% collection rate)`);
  console.log(`  Collector recovery yield: ${recoveryYield}% (${outputKg.toLocaleString()} kg out / ${inputKg.toLocaleString()} kg in)`);
  console.log(`  Total discounts: RM ${Number(discountSum._sum.totalDiscountRm ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
  console.log(`  Total manufacturer sales: ${salesWeightKg.toLocaleString()} kg / RM ${salesPriceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
}

async function main() {
  console.log("Starting Sack2Loop seed...\n");
  const started = Date.now();

  await clearBusinessData();
  const masters = await seedMasters();
  const distributions = await seedDistributions(masters);
  const { returns, sackWeightMap } = await seedReturns(masters, distributions);
  await seedCollectorDeliveries(masters, returns, sackWeightMap);
  await seedManufacturerSales(masters);
  await printSummary();

  console.log(`\nFinished in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
