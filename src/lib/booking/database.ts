import "server-only";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { AvailabilityResponse, HoldResponse } from "@/types/booking";

export type HoldDatabaseResult = HoldResponse & {
  created: boolean; bookingId: string; holdTokenNonce: string;
};

export async function getAvailability(propertySlug: string, month: string): Promise<AvailabilityResponse> {
  const { data, error } = await createPublicSupabaseClient().rpc("get_monthly_availability", {
    p_property_slug: propertySlug, p_month: month,
  });
  if (error) throw error;
  return data as unknown as AvailabilityResponse;
}

export type CreateHoldArgs = {
  p_property_slug: string;
  p_check_in_date: string;
  p_customer_name: string;
  p_customer_email: string | null;
  p_customer_phone: string;
  p_whatsapp: string | null;
  p_guest_count: number;
  p_overnight_guest_count: number;
  p_special_requests: string | null;
  p_hold_request_id: string;
  p_hold_token_nonce: string;
  p_request_fingerprint_hash: string;
  p_actor_identity_hash: string;
  p_fallback_hold_minutes: number;
};

export async function createHold(values: CreateHoldArgs): Promise<HoldDatabaseResult> {
  const client = createServiceRoleClient();
  let { data, error } = await client.rpc("create_booking_hold", values as never);
  if (error?.message.includes("idempotency_retry")) {
    ({ data, error } = await client.rpc("create_booking_hold", values as never));
  }
  if (error) throw error;
  return data as unknown as HoldDatabaseResult;
}

export async function releaseHold(bookingId: string, nonce: string): Promise<boolean> {
  const { data, error } = await createServiceRoleClient().rpc("release_booking_hold", {
    p_booking_id: bookingId, p_hold_token_nonce: nonce,
  });
  if (error) throw error;
  return data;
}

export async function expireHolds(): Promise<number> {
  const { data, error } = await createServiceRoleClient().rpc("expire_stale_holds", { p_property_id: undefined });
  if (error) throw error;
  return data;
}
