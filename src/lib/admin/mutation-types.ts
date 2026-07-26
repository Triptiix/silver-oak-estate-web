import "server-only";

import type { Database } from "@/types/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type ReservationStatus = Database["public"]["Enums"]["reservation_status"];
type ReservationType = Database["public"]["Enums"]["reservation_type"];

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
  bookingStatus: BookingStatus;
  reservationStatus: ReservationStatus;
  paymentProvider: "manual_upi" | "payment_link";
  checkInAt: string;
  checkOutAt: string;
  totalAmountPaise: number;
  advanceAmountPaise: number;
  balanceAmountPaise: number;
  currency: string;
  holdExpiresAt: string | null;
  applied: boolean;
};

export type ManualPaymentResult = {
  result: "confirmed" | "reconciliation_required";
  bookingReference: string;
  bookingStatus: Extract<
    BookingStatus,
    "confirmed" | "checked_in" | "completed" | "cancelled" | "expired"
  >;
  reservationType: ReservationType | null;
  reservationStatus: ReservationStatus | null;
  paymentStatus: Extract<
    PaymentStatus,
    | "manually_verified"
    | "reconciliation_required"
    | "refund_pending"
    | "partially_refunded"
    | "refunded"
  >;
  manualProvider: "manual_upi" | "payment_link";
  expectedAmountPaise: number;
  observedAmountPaise: number;
  currency: string;
  applied: boolean;
};
