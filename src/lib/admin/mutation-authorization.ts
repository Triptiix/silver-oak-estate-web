import "server-only";

import { getActiveAdmin, type AdminRole } from "@/lib/auth/admin";
import { AdminMutationError } from "./mutation-errors";
import { assertAdminMutationOrigin } from "./request-integrity";

export async function authorizeAdminMutation(
  allowedRoles: readonly AdminRole[],
): Promise<void> {
  await assertAdminMutationOrigin();
  const admin = await getActiveAdmin();
  if (!admin) throw new AdminMutationError("unauthorized");
  if (!allowedRoles.includes(admin.role)) throw new AdminMutationError("forbidden");
}
