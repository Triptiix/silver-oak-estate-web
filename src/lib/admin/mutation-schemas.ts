import "server-only";

import { z } from "zod";
import {
  OVERNIGHT_GUEST_CAPACITY,
  STANDARD_DAY_EVENT_CAPACITY,
} from "@/config/public-information";
import { normalizePhone } from "@/lib/phone";
import type { Database } from "@/types/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type ReservationStatus = Database["public"]["Enums"]["reservation_status"];
type ReservationType = Database["public"]["Enums"]["reservation_type"];

const bookingStatuses = [
  "draft",
  "held",
  "payment_pending",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "expired",
] as const satisfies readonly BookingStatus[];
const reservationStatuses = [
  "active",
  "released",
  "expired",
  "cancelled",
] as const satisfies readonly ReservationStatus[];
const reservationTypes = [
  "temporary_hold",
  "confirmed_booking",
  "manual_booking",
  "ota_booking",
  "owner_block",
  "maintenance_block",
] as const satisfies readonly ReservationType[];
const replayPaymentStatuses = [
  "manually_verified",
  "reconciliation_required",
  "refund_pending",
  "partially_refunded",
  "refunded",
] as const satisfies readonly PaymentStatus[];

const controlCharacters = /[\u0000-\u001F\u007F]/;
const date = z.iso.date();
const uuid = z.string().uuid();
const nullableTrimmed = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .refine((value) => !controlCharacters.test(value), "Control characters are not allowed.")
    .transform((value) => value || null)
    .nullable()
    .optional()
    .transform((value) => value ?? null);

function validDateRange(value: { firstBlockedDate: string; lastBlockedDate: string }) {
  const first = Date.parse(`${value.firstBlockedDate}T00:00:00Z`);
  const last = Date.parse(`${value.lastBlockedDate}T00:00:00Z`);
  return last >= first && (last - first) / 86_400_000 < 31;
}

const blockBase = {
  firstBlockedDate: date,
  lastBlockedDate: date,
  requestId: uuid,
  internalNote: nullableTrimmed(500),
};

export const createOwnerBlockSchema = z
  .strictObject({
    ...blockBase,
    reason: z.enum(["owner_use", "private_event", "operational_hold", "other"]),
  })
  .refine(validDateRange, {
    message: "Date range must be ordered and no longer than 31 nights.",
    path: ["lastBlockedDate"],
  });

export const createMaintenanceBlockSchema = z
  .strictObject({
    ...blockBase,
    reason: z.enum(["maintenance", "repair", "inspection", "deep_cleaning", "safety", "other"]),
  })
  .refine(validDateRange, {
    message: "Date range must be ordered and no longer than 31 nights.",
    path: ["lastBlockedDate"],
  });

const releaseBase = {
  reservationId: uuid,
  requestId: uuid,
  reason: z.enum(["no_longer_needed", "corrected", "rescheduled", "created_in_error", "other"]),
  internalNote: nullableTrimmed(500),
};
export const releaseOwnerBlockSchema = z.strictObject(releaseBase);
export const releaseMaintenanceBlockSchema = z.strictObject(releaseBase);

export const createManualBookingSchema = z
  .strictObject({
    checkInDate: date,
    customerName: z.string().trim().min(1).max(120).refine((v) => !controlCharacters.test(v)),
    customerPhone: z
      .string()
      .trim()
      .transform((value, context) => {
        try {
          return normalizePhone(value);
        } catch {
          context.addIssue({
            code: "custom",
            message: "Enter a valid phone number.",
          });
          return z.NEVER;
        }
      }),
    customerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .transform((value) => value || null)
      .nullable()
      .optional()
      .transform((value) => value ?? null)
      .refine((value) => value === null || z.email().safeParse(value).success, "Enter a valid email."),
    guestCount: z.number().int().min(1).max(STANDARD_DAY_EVENT_CAPACITY),
    overnightGuestCount: z.number().int().min(0).max(OVERNIGHT_GUEST_CAPACITY).optional().default(0),
    specialRequests: nullableTrimmed(1000),
    manualProvider: z.enum(["manual_upi", "payment_link"]),
    requestId: uuid,
  })
  .refine((value) => value.overnightGuestCount <= value.guestCount, {
    message: "Overnight guests cannot exceed total guests.",
    path: ["overnightGuestCount"],
  });

export const verifyManualPaymentSchema = z.strictObject({
  bookingReference: z.string().trim().regex(/^SOE-\d{8}-[A-F0-9]{8}$/),
  externalReference: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._:/-]{2,127}$/),
  observedAmountPaise: z.number().int().positive().safe(),
  observedCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  requestId: uuid,
  operatorNote: nullableTrimmed(500),
  evidenceDescriptor: nullableTrimmed(200).refine(
    (value) =>
      value === null
      || (!/https?:\/\//i.test(value) && !/^(data|file):/i.test(value)),
    "URLs and raw file payloads are not allowed.",
  ),
});

const isoInstant = z.iso.datetime({ offset: true });
const money = z.number().int().nonnegative().safe();
export const inventoryBlockOutputSchema = z.strictObject({
  result: z.enum(["block_created", "block_released"]),
  reservation_type: z.enum(["owner_block", "maintenance_block"]),
  status: z.enum(["active", "released"]),
  first_blocked_date: date,
  last_blocked_date: date,
  applied: z.boolean(),
});
export const manualBookingOutputSchema = z.strictObject({
  result: z.literal("manual_booking_created"),
  booking_reference: z.string().regex(/^SOE-\d{8}-[A-F0-9]{8}$/),
  booking_status: z.enum(bookingStatuses),
  reservation_status: z.enum(reservationStatuses),
  payment_provider: z.enum(["manual_upi", "payment_link"]),
  check_in_at: isoInstant,
  check_out_at: isoInstant,
  total_amount_paise: money,
  advance_amount_paise: money,
  balance_amount_paise: money,
  currency: z.string().regex(/^[A-Z]{3}$/),
  hold_expires_at: isoInstant.nullable(),
  applied: z.boolean(),
});
export const manualPaymentOutputSchema = z.strictObject({
  result: z.enum(["confirmed", "reconciliation_required"]),
  booking_reference: z.string().regex(/^SOE-\d{8}-[A-F0-9]{8}$/),
  booking_status: z.enum([
    "confirmed",
    "checked_in",
    "completed",
    "cancelled",
    "expired",
  ] satisfies readonly BookingStatus[]),
  reservation_type: z.enum(reservationTypes).nullable(),
  reservation_status: z.enum(reservationStatuses).nullable(),
  payment_status: z.enum(replayPaymentStatuses),
  manual_provider: z.enum(["manual_upi", "payment_link"]),
  expected_amount_paise: money,
  observed_amount_paise: money,
  currency: z.string().regex(/^[A-Z]{3}$/),
  applied: z.boolean(),
});

export type CreateOwnerBlockInput = z.input<typeof createOwnerBlockSchema>;
export type CreateMaintenanceBlockInput = z.input<typeof createMaintenanceBlockSchema>;
export type ReleaseOwnerBlockInput = z.input<typeof releaseOwnerBlockSchema>;
export type ReleaseMaintenanceBlockInput = z.input<typeof releaseMaintenanceBlockSchema>;
export type CreateManualBookingInput = z.input<typeof createManualBookingSchema>;
export type VerifyManualPaymentInput = z.input<typeof verifyManualPaymentSchema>;
