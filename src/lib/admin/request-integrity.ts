import "server-only";

import { headers } from "next/headers";
import { envClient } from "@/lib/env/client";
import { isTrustedMutationOrigin } from "@/lib/security/mutation-origin";
import { AdminMutationError } from "./mutation-errors";

export async function assertAdminMutationOrigin(): Promise<void> {
  const incoming = await headers();
  if (!isTrustedMutationOrigin(
    incoming.get("origin"),
    envClient.NEXT_PUBLIC_SITE_URL,
  )) {
    throw new AdminMutationError("invalid_origin");
  }
}
