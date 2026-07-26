import "server-only";

import { headers } from "next/headers";
import { envClient } from "@/lib/env/client";
import { AdminMutationError } from "./mutation-errors";

export async function assertAdminMutationOrigin(): Promise<void> {
  const incoming = await headers();
  const origin = incoming.get("origin");
  if (!origin) throw new AdminMutationError("invalid_origin");
  try {
    const actual = new URL(origin);
    const trusted = new URL(envClient.NEXT_PUBLIC_SITE_URL);
    if (actual.origin !== trusted.origin) {
      throw new AdminMutationError("invalid_origin");
    }
  } catch (error) {
    if (error instanceof AdminMutationError) throw error;
    throw new AdminMutationError("invalid_origin");
  }
}
