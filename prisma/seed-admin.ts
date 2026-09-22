import "dotenv/config";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_PROGRAM_ID } from "@/lib/tenant";

const USERS_TO_SEED = [
  {
    email: process.env.ADMIN_EMAIL ?? "admin@recycle.local",
    password: process.env.ADMIN_PASSWORD ?? "admin123456",
    name: "System Admin",
    role: "admin",
  },
  {
    email: "manufacturer@recycle.local",
    password: "manuf123456",
    name: "Malayan Plastics (PRO Manufacturer)",
    role: "manufacturer",
  },
  {
    email: "supplier@recycle.local",
    password: "supp123456",
    name: "AgroSupply Kedah (Supplier)",
    role: "supplier",
  },
  {
    email: "recycler@recycle.local",
    password: "recyc123456",
    name: "EcoPlast Recycler Hub",
    role: "recycler",
  },
];

async function main() {
  console.log("Seeding authenticated role accounts...");

  for (const user of USERS_TO_SEED) {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          email: user.email,
          password: user.password,
          name: user.name,
        },
      });

      if (res?.user?.id) {
        await prisma.user.update({
          where: { id: res.user.id },
          data: {
            role: user.role,
            programId: DEFAULT_PROGRAM_ID,
          },
        });
      }
      console.log(`  Created ${user.role} user: ${user.email}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("already")) {
        // Ensure role & programId are updated
        await prisma.user.updateMany({
          where: { email: user.email },
          data: {
            role: user.role,
            programId: DEFAULT_PROGRAM_ID,
          },
        });
        console.log(`  Updated existing user: ${user.email} (${user.role})`);
        continue;
      }
      console.error(`  Failed to create ${user.email}:`, message);
    }
  }

  console.log("Dedicated login accounts ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
