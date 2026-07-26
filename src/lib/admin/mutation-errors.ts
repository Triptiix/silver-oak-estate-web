import "server-only";

import { z } from "zod";
import type { AdminMutationErrorCode, AdminMutationFailure } from "./mutation-types";

const messages: Record<AdminMutationErrorCode, string> = {
  unauthorized: "Please sign in again.",
  forbidden: "You do not have permission to perform this operation.",
  invalid_origin: "This request could not be verified.",
  invalid_input: "Review the highlighted fields.",
  idempotency_conflict: "This submission was already used with different details.",
  date_unavailable: "The selected dates are no longer available.",
  block_not_found: "This inventory block could not be found.",
  block_not_active: "This inventory block is no longer active.",
  wrong_block_type: "This inventory block has a different type.",
  invalid_configuration: "The operation is temporarily unavailable.",
  invalid_manual_provider: "Select a supported manual payment provider.",
  customer_conflict: "The customer details conflict with an existing record.",
  booking_not_found: "The booking could not be found.",
  payment_reference_conflict: "That payment reference has already been recorded.",
  payment_already_processed: "This payment has already been processed.",
  invalid_manual_payment_relationship: "The manual payment relationship is invalid.",
  operation_failed: "The operation could not be completed.",
};

export class AdminMutationError extends Error {
  constructor(readonly code: AdminMutationErrorCode) {
    super(code);
  }
}

const databaseCodes: Partial<Record<string, AdminMutationErrorCode>> = {
  admin_unauthorized: "unauthorized",
  idempotency_conflict: "idempotency_conflict",
  date_unavailable: "date_unavailable",
  block_not_found: "block_not_found",
  block_not_active: "block_not_active",
  wrong_block_type: "wrong_block_type",
  property_configuration_invalid: "invalid_configuration",
  manual_hold_configuration_invalid: "invalid_configuration",
  invalid_manual_provider: "invalid_manual_provider",
  customer_conflict: "customer_conflict",
  booking_not_found: "booking_not_found",
  payment_reference_conflict: "payment_reference_conflict",
  payment_already_processed: "payment_already_processed",
  invalid_manual_payment_relationship: "invalid_manual_payment_relationship",
};

export function failureFrom(error: unknown): AdminMutationFailure {
  if (error instanceof z.ZodError) {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: messages.invalid_input,
        fieldErrors: z.flattenError(error).fieldErrors,
      },
    };
  }
  const code = error instanceof AdminMutationError
    ? error.code
    : databaseCodes[
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : ""
      ] ?? "operation_failed";
  return { ok: false, error: { code, message: messages[code] } };
}
