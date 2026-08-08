import "dotenv/config";

import { auth } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@recycle.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123456";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "System Admin";

async function main() {
  try {
    await auth.api.signUpEmail({
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      },
    });
    console.log(`Admin user created: ${ADMIN_EMAIL}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("already")) {
      console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
      return;
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
