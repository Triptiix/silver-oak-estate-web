import "server-only";

export type AdminMutationErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_origin"
  | "invalid_input"
  | "idempotency_conflict"
  | "date_unavailable"
  | "block_not_found"
  | "block_not_active"
  | "wrong_block_type"
  | "invalid_configuration"
  | "invalid_manual_provider"
  | "customer_conflict"
  | "booking_not_found"
  | "payment_reference_conflict"
  | "payment_already_processed"
  | "invalid_manual_payment_relationship"
  | "operation_failed";

export type AdminMutationFailure = {
  ok: false;
  error: {
    code: AdminMutationErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export type AdminMutationSuccess<T> = { ok: true; data: T };
export type AdminMutationResult<T> = AdminMutationSuccess<T> | AdminMutationFailure;

export type InventoryBlockResult = {
  result: "block_created" | "block_released";
  reservationType: "owner_block" | "maintenance_block";
  status: "active" | "released";
  firstBlockedDate: string;
  lastBlockedDate: string;
  applied: boolean;
};

export type ManualBookingResult = {
  result: "manual_booking_created";
  bookingReference: string;
  bookingStatus: "payment_pending";
  reservationStatus: "active";
  paymentProvider: "manual_upi" | "payment_link";
  checkInAt: string;
  checkOutAt: string;
  totalAmountPaise: number;
  advanceAmountPaise: number;
  balanceAmountPaise: number;
  currency: string;
  holdExpiresAt: string;
  applied: boolean;
};

export type ManualPaymentResult = {
  result: "confirmed" | "reconciliation_required";
  bookingReference: string;
  bookingStatus: "confirmed" | "expired" | "cancelled" | "completed";
  reservationType:
    | "confirmed_booking"
    | "manual_booking"
    | "temporary_hold"
    | "owner_block"
    | "maintenance_block"
    | null;
  reservationStatus: "active" | "released" | "expired" | "cancelled" | null;
  paymentStatus: "manually_verified" | "reconciliation_required";
  manualProvider: "manual_upi" | "payment_link";
  expectedAmountPaise: number;
  observedAmountPaise: number;
  currency: string;
  applied: boolean;
};
