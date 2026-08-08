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

const SACK_TYPES = [
  { type: "Urea 50kg", discount: 2.5, weightKg: 0.18 },
  { type: "NPK 25kg", discount: 1.8, weightKg: 0.12 },
  { type: "Compound 10kg", discount: 1.2, weightKg: 0.08 },
  { type: "Organic 20kg", discount: 2.0, weightKg: 0.14 },
  { type: "Phosphate 40kg", discount: 2.2, weightKg: 0.16 },
  { type: "Potash 25kg", discount: 1.9, weightKg: 0.13 },
] as const;

const SUPPLIERS = [
  { companyName: "AgroSupply Kedah Sdn Bhd", location: "Alor Setar, Kedah", phone: "04-7312200" },
  { companyName: "GreenFert Perak", location: "Ipoh, Perak", phone: "05-2548800" },
  { companyName: "Sumber Tani Selangor", location: "Shah Alam, Selangor", phone: "03-5512345" },
  { companyName: "Negeri Agro N9", location: "Seremban, Negeri Sembilan", phone: "06-7643200" },
  { companyName: "Johor Fertilizer Hub", location: "Kluang, Johor", phone: "07-7721100" },
  { companyName: "PadiMart Kelantan", location: "Kota Bharu, Kelantan", phone: "09-7445600" },
  { companyName: "East Coast Agro Terengganu", location: "Kuala Terengganu", phone: "09-6234500" },
];

const RECYCLERS = [
  { companyName: "EcoPlast Recycling Sdn Bhd", processCapacityKg: 500000, phone: "03-77889900" },
  { companyName: "GreenCycle Industries", processCapacityKg: 350000, phone: "04-4567890" },
  { companyName: "Malaysia Polymer Recyclers", processCapacityKg: 420000, phone: "07-3344556" },
  { companyName: "Circular Plastics Johor", processCapacityKg: 280000, phone: "07-2233445" },
  { companyName: "Sustainable Sack Processing", processCapacityKg: 310000, phone: "05-6677889" },
];

const MANUFACTURERS = [
  { companyName: "PackPro Manufacturing", phone: "03-11223344" },
  { companyName: "FlexiSack Industries", phone: "04-55667788" },
  { companyName: "UniPlast Products Sdn Bhd", phone: "07-99887766" },
  { companyName: "Advanced Packaging Solutions", phone: "06-44556677" },
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

const REJECT_REASONS = [
  "Torn or punctured sack",
  "Contaminated with fertilizer residue",
  "Wrong sack type returned",
  "Excessive UV damage",
  "Wet and mouldy material",
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
  await prisma.recyclerDelivery.deleteMany();
  await prisma.sackReturn.deleteMany();
  await prisma.fertilizerDistribution.deleteMany();
  await prisma.sackCatalog.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.recycler.deleteMany();
  await prisma.manufacturer.deleteMany();
}

async function seedMasters() {
  console.log("Seeding master tables...");

  const sacks = await Promise.all(
    SACK_TYPES.map((sack) =>
      prisma.sackCatalog.create({
        data: {
          fertilizerType: sack.type,
          discountValueRm: sack.discount,
        },
      }),
    ),
  );

  const suppliers = await Promise.all(
    SUPPLIERS.map((supplier) => prisma.supplier.create({ data: supplier })),
  );

  const recyclers = await Promise.all(
    RECYCLERS.map((recycler) =>
      prisma.recycler.create({
        data: {
          companyName: recycler.companyName,
          processCapacityKg: recycler.processCapacityKg,
          phone: recycler.phone,
        },
      }),
    ),
  );

  const manufacturers = await Promise.all(
    MANUFACTURERS.map((manufacturer) =>
      prisma.manufacturer.create({ data: manufacturer }),
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

  return { sacks, suppliers, recyclers, manufacturers, farmers };
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
  passQty: number;
  rejectQty: number;
  rejectReason: string | null;
  totalDiscountRm: number;
};

async function seedReturns(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  distributions: DistributionRow[],
) {
  console.log("Seeding sack returns (40k+ records)...");

  const sackDiscountMap = new Map(
    masters.sacks.map((sack, index) => [sack.id, SACK_TYPES[index]!.discount]),
  );
  const sackWeightMap = new Map(
    masters.sacks.map((sack, index) => [sack.id, SACK_TYPES[index]!.weightKg]),
  );

  const totalDistributed = distributions.reduce((sum, row) => sum + row.quantity, 0);
  const targetPassQty = Math.round(totalDistributed * 0.32);
  const returnRecordCount = 42_000;

  const returnIndices = new Set<number>();
  while (returnIndices.size < returnRecordCount) {
    returnIndices.add(randomInt(0, distributions.length - 1));
  }

  const returns: ReturnAccumulator[] = [];
  let allocatedPass = 0;
  const sortedIndices = Array.from(returnIndices);

  for (let i = 0; i < sortedIndices.length; i++) {
    const dist = distributions[sortedIndices[i]!]!;
    const remaining = targetPassQty - allocatedPass;
    const recordsLeft = sortedIndices.length - i;

    let passQty: number;
    if (recordsLeft <= 1) {
      passQty = Math.max(1, remaining);
    } else {
      const avgNeeded = remaining / recordsLeft;
      passQty = Math.max(1, Math.min(6, Math.round(avgNeeded + randomInt(-1, 1))));
    }

    if (allocatedPass + passQty > targetPassQty && i < sortedIndices.length - 1) {
      passQty = Math.max(1, targetPassQty - allocatedPass);
    }

    allocatedPass += passQty;
    const rejectQty = Math.random() < 0.13 ? randomInt(1, 2) : 0;
    const discount = sackDiscountMap.get(dist.sackId) ?? 1.5;

    returns.push({
      date: addMonths(dist.date, randomInt(0, 2)),
      farmerId: dist.farmerId,
      supplierId: dist.supplierId,
      sackId: dist.sackId,
      passQty,
      rejectQty,
      rejectReason: rejectQty > 0 ? pick(REJECT_REASONS) : null,
      totalDiscountRm: round2(passQty * discount),
    });
  }

  await insertBatches("Returns", returns, (batch) =>
    prisma.sackReturn.createMany({ data: batch }),
  );

  const totalPass = returns.reduce((sum, row) => sum + row.passQty, 0);
  const totalReject = returns.reduce((sum, row) => sum + row.rejectQty, 0);

  return { returns, totalPass, totalReject, sackWeightMap };
}

async function seedRecyclerDeliveries(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  returns: ReturnAccumulator[],
  sackWeightMap: Map<number, number>,
) {
  console.log("Seeding recycler deliveries...");

  type DeliveryBucket = {
    monthKey: string;
    supplierId: number;
    passQty: number;
    weightKg: number;
  };

  const buckets = new Map<string, DeliveryBucket>();

  for (const row of returns) {
    const monthKey = `${row.date.getUTCFullYear()}-${String(row.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const key = `${monthKey}:${row.supplierId}`;
    const weight = row.passQty * (sackWeightMap.get(row.sackId) ?? 0.14);
    const existing = buckets.get(key);

    if (existing) {
      existing.passQty += row.passQty;
      existing.weightKg += weight;
    } else {
      buckets.set(key, {
        monthKey,
        supplierId: row.supplierId,
        passQty: row.passQty,
        weightKg: weight,
      });
    }
  }

  const deliveries = Array.from(buckets.values()).map((bucket) => {
    const [year, month] = bucket.monthKey.split("-").map(Number);
    const inputWeightKg = round2(bucket.weightKg);
    const recoveryRate = 0.76 + Math.random() * 0.08;
    const outputWeightKg = round2(inputWeightKg * recoveryRate);

    return {
      date: addMonths(randomDateInMonth(year!, month!), randomInt(0, 1)),
      supplierId: bucket.supplierId,
      recyclerId: pick(masters.recyclers.map((r) => r.id)),
      sackQty: bucket.passQty,
      inputWeightKg,
      outputWeightKg,
    };
  });

  await insertBatches("Recycler deliveries", deliveries, (batch) =>
    prisma.recyclerDelivery.createMany({ data: batch }),
  );

  return deliveries;
}

async function seedManufacturerSales(
  masters: Awaited<ReturnType<typeof seedMasters>>,
  deliveries: Awaited<ReturnType<typeof seedRecyclerDeliveries>>,
) {
  console.log("Seeding manufacturer sales...");

  type SalesBucket = {
    monthKey: string;
    recyclerId: number;
    outputWeightKg: number;
  };

  const buckets = new Map<string, SalesBucket>();

  for (const delivery of deliveries) {
    const monthKey = `${delivery.date.getUTCFullYear()}-${String(delivery.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const key = `${monthKey}:${delivery.recyclerId}`;
    const existing = buckets.get(key);

    if (existing) {
      existing.outputWeightKg += Number(delivery.outputWeightKg);
    } else {
      buckets.set(key, {
        monthKey,
        recyclerId: delivery.recyclerId,
        outputWeightKg: Number(delivery.outputWeightKg),
      });
    }
  }

  const sales = Array.from(buckets.values()).flatMap((bucket) => {
    const [year, month] = bucket.monthKey.split("-").map(Number);
    const purchaseWeightKg = round2(bucket.outputWeightKg * (0.88 + Math.random() * 0.08));
    const pricePerKg = 2.6 + Math.random() * 1.2;

    return {
      date: addMonths(randomDateInMonth(year!, month!), randomInt(1, 2)),
      recyclerId: bucket.recyclerId,
      manufacturerId: pick(masters.manufacturers.map((m) => m.id)),
      purchaseWeightKg,
      salesPriceRm: round2(purchaseWeightKg * pricePerKg),
    };
  });

  await insertBatches("Manufacturer sales", sales, (batch) =>
    prisma.manufacturerSales.createMany({ data: batch }),
  );
}

async function printSummary() {
  const [
    farmers,
    suppliers,
    recyclers,
    manufacturers,
    sacks,
    distributions,
    returns,
    deliveries,
    sales,
    distQty,
    passAgg,
    discountSum,
  ] = await Promise.all([
    prisma.farmer.count(),
    prisma.supplier.count(),
    prisma.recycler.count(),
    prisma.manufacturer.count(),
    prisma.sackCatalog.count(),
    prisma.fertilizerDistribution.count(),
    prisma.sackReturn.count(),
    prisma.recyclerDelivery.count(),
    prisma.manufacturerSales.count(),
    prisma.fertilizerDistribution.aggregate({ _sum: { quantity: true } }),
    prisma.sackReturn.aggregate({ _sum: { passQty: true, rejectQty: true } }),
    prisma.sackReturn.aggregate({ _sum: { totalDiscountRm: true } }),
  ]);

  const distributed = Number(distQty._sum.quantity ?? 0);
  const passed = Number(passAgg._sum.passQty ?? 0);
  const rejected = Number(passAgg._sum.rejectQty ?? 0);
  const returnRate = distributed > 0 ? ((passed / distributed) * 100).toFixed(1) : "0";

  console.log("\nSeed complete:");
  console.log(`  Masters: ${farmers} farmers, ${suppliers} suppliers, ${recyclers} recyclers, ${manufacturers} manufacturers, ${sacks} sack types`);
  console.log(`  Transactions: ${distributions.toLocaleString()} distributions, ${returns.toLocaleString()} returns, ${deliveries} recycler deliveries, ${sales} manufacturer sales`);
  console.log(`  Sacks distributed: ${distributed.toLocaleString()}`);
  console.log(`  Return rate (pass/distributed): ${returnRate}% (${passed.toLocaleString()} pass, ${rejected.toLocaleString()} reject)`);
  console.log(`  Total discounts: RM ${Number(discountSum._sum.totalDiscountRm ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
}

async function main() {
  console.log("Starting comprehensive seed...\n");
  const started = Date.now();

  await clearBusinessData();
  const masters = await seedMasters();
  const distributions = await seedDistributions(masters);
  const { returns, sackWeightMap } = await seedReturns(masters, distributions);
  const deliveries = await seedRecyclerDeliveries(masters, returns, sackWeightMap);
  await seedManufacturerSales(masters, deliveries);
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
