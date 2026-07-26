"use server";

import { revalidatePath } from "next/cache";
import { authorizeAdminMutation } from "@/lib/admin/mutation-authorization";
import { failureFrom } from "@/lib/admin/mutation-errors";
import {
  verifyManualPaymentSchema,
  type VerifyManualPaymentInput,
} from "@/lib/admin/mutation-schemas";
import { verifyManualPayment } from "@/lib/admin/mutations";
import type { AdminMutationResult, ManualPaymentResult } from "@/lib/admin/mutation-types";

export async function verifyManualPaymentAction(
  input: VerifyManualPaymentInput,
): Promise<AdminMutationResult<ManualPaymentResult>> {
  try {
    await authorizeAdminMutation(["admin", "super_admin"]);
    const result = await verifyManualPayment(verifyManualPaymentSchema.parse(input));
    if (result.applied) {
      revalidatePath("/admin/bookings");
      revalidatePath(`/admin/bookings/${result.bookingReference}`);
      revalidatePath("/admin/payments");
      revalidatePath("/admin/dashboard");
      if (result.result === "confirmed") {
        revalidatePath("/admin/notifications");
      } else {
        revalidatePath("/admin/recovery");
      }
    }
    return { ok: true, data: result };
  } catch (error) {
    return failureFrom(error);
  }
}
