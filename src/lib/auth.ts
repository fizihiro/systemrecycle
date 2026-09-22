import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "admin",
        required: false,
      },
      programId: {
        type: "string",
        defaultValue: "prog_sack2loop_demo",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = (user as { role?: string }).role?.toLowerCase();
          if (role === "collector" || role === "farmer") {
            throw new Error("Collectors and Farmers are not permitted login accounts.");
          }
        },
      },
    },
  },
});
