"use server";

import { revalidatePath } from "next/cache";
import { authorizeAdminMutation } from "@/lib/admin/mutation-authorization";
import { failureFrom } from "@/lib/admin/mutation-errors";
import {
  createMaintenanceBlockSchema,
  createOwnerBlockSchema,
  releaseMaintenanceBlockSchema,
  releaseOwnerBlockSchema,
  type CreateMaintenanceBlockInput,
  type CreateOwnerBlockInput,
  type ReleaseMaintenanceBlockInput,
  type ReleaseOwnerBlockInput,
} from "@/lib/admin/mutation-schemas";
import {
  createMaintenanceBlock,
  createOwnerBlock,
  releaseMaintenanceBlock,
  releaseOwnerBlock,
} from "@/lib/admin/mutations";
import type { AdminMutationResult, InventoryBlockResult } from "@/lib/admin/mutation-types";

function revalidateInventory(result: InventoryBlockResult) {
  if (result.applied) revalidatePath("/admin/dashboard");
}

export async function createOwnerBlockAction(
  input: CreateOwnerBlockInput,
): Promise<AdminMutationResult<InventoryBlockResult>> {
  try {
    await authorizeAdminMutation(["admin", "super_admin"]);
    const result = await createOwnerBlock(createOwnerBlockSchema.parse(input));
    revalidateInventory(result);
    return { ok: true, data: result };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function createMaintenanceBlockAction(
  input: CreateMaintenanceBlockInput,
): Promise<AdminMutationResult<InventoryBlockResult>> {
  try {
    await authorizeAdminMutation(["operations", "admin", "super_admin"]);
    const result = await createMaintenanceBlock(createMaintenanceBlockSchema.parse(input));
    revalidateInventory(result);
    return { ok: true, data: result };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function releaseOwnerBlockAction(
  input: ReleaseOwnerBlockInput,
): Promise<AdminMutationResult<InventoryBlockResult>> {
  try {
    await authorizeAdminMutation(["admin", "super_admin"]);
    const result = await releaseOwnerBlock(releaseOwnerBlockSchema.parse(input));
    revalidateInventory(result);
    return { ok: true, data: result };
  } catch (error) {
    return failureFrom(error);
  }
}

export async function releaseMaintenanceBlockAction(
  input: ReleaseMaintenanceBlockInput,
): Promise<AdminMutationResult<InventoryBlockResult>> {
  try {
    await authorizeAdminMutation(["operations", "admin", "super_admin"]);
    const result = await releaseMaintenanceBlock(releaseMaintenanceBlockSchema.parse(input));
    revalidateInventory(result);
    return { ok: true, data: result };
  } catch (error) {
    return failureFrom(error);
  }
}
