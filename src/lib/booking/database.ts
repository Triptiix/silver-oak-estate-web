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

export async function createHold(values: Record<string, unknown>): Promise<HoldDatabaseResult> {
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
