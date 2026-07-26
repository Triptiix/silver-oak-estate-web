"use server";

import { revalidatePath } from "next/cache";
import { authorizeAdminMutation } from "@/lib/admin/mutation-authorization";
import { failureFrom } from "@/lib/admin/mutation-errors";
import {
  createManualBookingSchema,
  type CreateManualBookingInput,
} from "@/lib/admin/mutation-schemas";
import { createManualBooking } from "@/lib/admin/mutations";
import type { AdminMutationResult, ManualBookingResult } from "@/lib/admin/mutation-types";

export async function createManualBookingAction(
  input: CreateManualBookingInput,
): Promise<AdminMutationResult<ManualBookingResult>> {
  try {
    await authorizeAdminMutation(["operations", "admin", "super_admin"]);
    const result = await createManualBooking(createManualBookingSchema.parse(input));
    if (result.applied) {
      revalidatePath("/admin/bookings");
      revalidatePath("/admin/payments");
      revalidatePath("/admin/dashboard");
    }
    return { ok: true, data: result };
  } catch (error) {
    return failureFrom(error);
  }
}
