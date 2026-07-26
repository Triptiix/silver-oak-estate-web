import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  inventoryBlockOutputSchema,
  manualBookingOutputSchema,
  manualPaymentOutputSchema,
} from "./mutation-schemas";
import { AdminMutationError } from "./mutation-errors";
import type {
  InventoryBlockResult,
  ManualBookingResult,
  ManualPaymentResult,
} from "./mutation-types";

async function rpcResult<T>(
  invoke: (
    client: Awaited<ReturnType<typeof createClient>>,
  ) => PromiseLike<{ data: unknown; error: unknown }>,
  parse: (value: unknown) => T,
): Promise<T> {
  const client = await createClient();
  const { data, error } = await invoke(client);
  if (error) throw error;
  try {
    return parse(data);
  } catch {
    throw new AdminMutationError("operation_failed");
  }
}

function inventoryResult(value: unknown): InventoryBlockResult {
  const row = inventoryBlockOutputSchema.parse(value);
  return {
    result: row.result,
    reservationType: row.reservation_type,
    status: row.status,
    firstBlockedDate: row.first_blocked_date,
    lastBlockedDate: row.last_blocked_date,
    applied: row.applied,
  };
}

export async function createOwnerBlock(input: {
  firstBlockedDate: string;
  lastBlockedDate: string;
  requestId: string;
  reason: string;
  internalNote: string | null;
}): Promise<InventoryBlockResult> {
  return rpcResult(
    (client) => client.rpc("create_admin_owner_block", {
      p_first_blocked_date: input.firstBlockedDate,
      p_last_blocked_date: input.lastBlockedDate,
      p_request_id: input.requestId,
      p_reason_category: input.reason,
      p_internal_note: input.internalNote ?? undefined,
    }),
    inventoryResult,
  );
}

export async function createMaintenanceBlock(input: {
  firstBlockedDate: string;
  lastBlockedDate: string;
  requestId: string;
  reason: string;
  internalNote: string | null;
}): Promise<InventoryBlockResult> {
  return rpcResult(
    (client) => client.rpc("create_admin_maintenance_block", {
      p_first_blocked_date: input.firstBlockedDate,
      p_last_blocked_date: input.lastBlockedDate,
      p_request_id: input.requestId,
      p_reason_category: input.reason,
      p_internal_note: input.internalNote ?? undefined,
    }),
    inventoryResult,
  );
}

export async function releaseOwnerBlock(input: {
  reservationId: string;
  requestId: string;
  reason: string;
  internalNote: string | null;
}): Promise<InventoryBlockResult> {
  return rpcResult(
    (client) => client.rpc("release_admin_owner_block", {
      p_inventory_reservation_id: input.reservationId,
      p_request_id: input.requestId,
      p_reason_category: input.reason,
      p_internal_note: input.internalNote ?? undefined,
    }),
    inventoryResult,
  );
}

export async function releaseMaintenanceBlock(input: {
  reservationId: string;
  requestId: string;
  reason: string;
  internalNote: string | null;
}): Promise<InventoryBlockResult> {
  return rpcResult(
    (client) => client.rpc("release_admin_maintenance_block", {
      p_inventory_reservation_id: input.reservationId,
      p_request_id: input.requestId,
      p_reason_category: input.reason,
      p_internal_note: input.internalNote ?? undefined,
    }),
    inventoryResult,
  );
}

export async function createManualBooking(input: {
  checkInDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  guestCount: number;
  overnightGuestCount: number;
  specialRequests: string | null;
  manualProvider: "manual_upi" | "payment_link";
  requestId: string;
}): Promise<ManualBookingResult> {
  return rpcResult(
    (client) => client.rpc("create_admin_manual_booking", {
      p_check_in_date: input.checkInDate,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_customer_email: input.customerEmail ?? "",
      p_guest_count: input.guestCount,
      p_overnight_guest_count: input.overnightGuestCount,
      p_special_requests: input.specialRequests ?? "",
      p_manual_provider: input.manualProvider,
      p_request_id: input.requestId,
    }),
    (value) => {
      const row = manualBookingOutputSchema.parse(value);
      return {
        result: row.result,
        bookingReference: row.booking_reference,
        bookingStatus: row.booking_status,
        reservationStatus: row.reservation_status,
        paymentProvider: row.payment_provider,
        checkInAt: row.check_in_at,
        checkOutAt: row.check_out_at,
        totalAmountPaise: row.total_amount_paise,
        advanceAmountPaise: row.advance_amount_paise,
        balanceAmountPaise: row.balance_amount_paise,
        currency: row.currency,
        holdExpiresAt: row.hold_expires_at,
        applied: row.applied,
      };
    },
  );
}

export async function verifyManualPayment(input: {
  bookingReference: string;
  externalReference: string;
  observedAmountPaise: number;
  observedCurrency: string;
  requestId: string;
  operatorNote: string | null;
  evidenceDescriptor: string | null;
}): Promise<ManualPaymentResult> {
  return rpcResult(
    (client) => client.rpc("verify_admin_manual_payment", {
      p_booking_reference: input.bookingReference,
      p_external_reference: input.externalReference,
      p_observed_amount_paise: input.observedAmountPaise,
      p_observed_currency: input.observedCurrency,
      p_request_id: input.requestId,
      p_operator_note: input.operatorNote ?? undefined,
      p_evidence_descriptor: input.evidenceDescriptor ?? undefined,
    }),
    (value) => {
      const row = manualPaymentOutputSchema.parse(value);
      return {
        result: row.result,
        bookingReference: row.booking_reference,
        bookingStatus: row.booking_status,
        reservationType: row.reservation_type,
        reservationStatus: row.reservation_status,
        paymentStatus: row.payment_status,
        manualProvider: row.manual_provider,
        expectedAmountPaise: row.expected_amount_paise,
        observedAmountPaise: row.observed_amount_paise,
        currency: row.currency,
        applied: row.applied,
      };
    },
  );
}
