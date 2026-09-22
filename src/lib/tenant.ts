import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const DEFAULT_PROGRAM_ID = "prog_sack2loop_demo";

/**
 * Returns the current active program ID for multi-tenant scoping.
 * Reads the authenticated user's session if available; otherwise falls back
 * to DEFAULT_PROGRAM_ID.
 */
export async function getCurrentProgramId(): Promise<string> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user && "programId" in session.user && session.user.programId) {
      return session.user.programId as string;
    }
  } catch {
    // In background tasks, seeders, or non-request contexts
  }

  return process.env.PROGRAM_ID || DEFAULT_PROGRAM_ID;
}
