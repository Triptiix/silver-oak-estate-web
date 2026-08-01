import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const output = execFileSync(
  "./node_modules/.bin/supabase",
  ["status", "-o", "env"],
  { encoding: "utf8" },
);
const values = Object.fromEntries(
  output
    .split("\n")
    .map((line) => line.match(/^([A-Z_]+)="(.*)"$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2]]),
);
const apiUrl = new URL(values.API_URL ?? "http://invalid.local");
const databaseUrl = new URL(values.DB_URL ?? "postgresql://invalid.local");
if (
  !["127.0.0.1", "localhost"].includes(apiUrl.hostname)
  || !["127.0.0.1", "localhost"].includes(databaseUrl.hostname)
  || !values.SERVICE_ROLE_KEY
) {
  throw new Error("Loopback-only local Supabase is required");
}

const client = createClient(values.API_URL, values.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const runId = randomUUID();
const compactRunId = runId.replaceAll("-", "");
const phone = `+919881${compactRunId.slice(0, 6)}`;
const fingerprint = `payment-finalization-${runId}`;
const actorHash = createHash("sha256").update(runId).digest("hex");
let bookingId;
let customerId;

async function requireNoError(label, result) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

try {
  const hold = await requireNoError(
    "hold setup failed",
    await client.rpc("create_booking_hold", {
      p_property_slug: "silver-oak-estate",
      p_check_in_date: "2032-08-18",
      p_customer_name: "Payment Race Test",
      p_customer_email: null,
      p_customer_phone: phone,
      p_whatsapp: null,
      p_guest_count: 4,
      p_overnight_guest_count: 2,
      p_special_requests: null,
      p_hold_request_id: randomUUID(),
      p_hold_token_nonce: randomUUID(),
      p_request_fingerprint_hash: fingerprint,
      p_actor_identity_hash: actorHash,
      p_fallback_hold_minutes: 10,
    }),
  );
  bookingId = hold.bookingId;

  const booking = await requireNoError(
    "booking lookup failed",
    await client.from("bookings").select("customer_id").eq("id", bookingId).single(),
  );
  customerId = booking.customer_id;

  const prepared = await requireNoError(
    "payment setup failed",
    await client.rpc("prepare_payment_order", {
      p_booking_id: bookingId,
      p_hold_token_nonce: hold.holdTokenNonce,
      p_provider: "razorpay",
    }),
  );
  const providerOrderId = `order_race_${compactRunId}`;
  const providerPaymentId = `pay_race_${compactRunId}`;
  await requireNoError(
    "provider-order setup failed",
    await client.rpc("attach_provider_order", {
      p_payment_id: prepared.paymentId,
      p_provider_order_id: providerOrderId,
      p_amount_paise: prepared.amountPaise,
      p_currency: prepared.currency,
    }),
  );

  const common = {
    p_provider: "razorpay",
    p_provider_order_id: providerOrderId,
    p_provider_payment_id: providerPaymentId,
    p_amount_paise: prepared.amountPaise,
    p_currency: prepared.currency,
    p_financial_status: "captured",
  };
  const results = await Promise.all([
    client.rpc("finalize_verified_payment", {
      ...common,
      p_verification_source: "browser",
      p_provider_event_id: null,
    }),
    client.rpc("finalize_verified_payment", {
      ...common,
      p_verification_source: "webhook",
      p_provider_event_id: `event_race_${compactRunId}`,
    }),
  ]);
  if (results.some((result) => result.error)) {
    throw new Error(
      `finalization race failed: ${results.map((result) => result.error?.message ?? "success").join(" | ")}`,
    );
  }
  if (results.some((result) => result.data?.result !== "payment_received")) {
    throw new Error("both finalizers must return payment_received");
  }

  const [
    bookingResult,
    reservationsResult,
    paymentsResult,
    awaitingEventsResult,
    confirmedEventsResult,
    awaitingNotificationsResult,
    customerConfirmationsResult,
  ] = await Promise.all([
    client.from("bookings").select("booking_status").eq("id", bookingId).single(),
    client.from("inventory_reservations").select("reservation_type,status,expires_at").eq("booking_id", bookingId),
    client.from("payments").select("status").eq("booking_id", bookingId),
    client.from("booking_events").select("id").eq("booking_id", bookingId).eq("event_type", "payment_received_awaiting_confirmation"),
    client.from("booking_events").select("id").eq("booking_id", bookingId).eq("event_type", "booking_confirmed"),
    client.from("notification_events").select("id").eq("booking_id", bookingId).eq("channel", "internal").eq("template_key", "payment_received_awaiting_confirmation"),
    client.from("notification_events").select("id").eq("booking_id", bookingId).eq("template_key", "booking_confirmed"),
  ]);
  const queryError = [
    bookingResult,
    reservationsResult,
    paymentsResult,
    awaitingEventsResult,
    confirmedEventsResult,
    awaitingNotificationsResult,
    customerConfirmationsResult,
  ].find((result) => result.error)?.error;
  if (queryError) throw new Error(`verification query failed: ${queryError.message}`);

  if (bookingResult.data.booking_status !== "payment_pending") {
    throw new Error("race did not leave one payment_pending booking");
  }
  if (
    reservationsResult.data.length !== 1
    || reservationsResult.data[0].reservation_type !== "confirmed_booking"
    || reservationsResult.data[0].status !== "active"
    || reservationsResult.data[0].expires_at !== null
  ) {
    throw new Error("race did not leave one active durable reservation with no expiry");
  }
  if (paymentsResult.data.length !== 1 || paymentsResult.data[0].status !== "verified") {
    throw new Error("race did not leave one verified payment");
  }
  if (awaitingEventsResult.data.length !== 1 || confirmedEventsResult.data.length !== 0) {
    throw new Error("race produced incorrect payment or confirmation event counts");
  }
  if (
    awaitingNotificationsResult.data.length !== 1
    || customerConfirmationsResult.data.length !== 0
  ) {
    throw new Error("race produced incorrect internal or customer notification counts");
  }

  console.log(
    "Payment finalization concurrency PASS: browser/webhook race returned payment_received twice with one durable block, one awaiting-confirmation event, and no automatic confirmation.",
  );
} finally {
  if (bookingId) {
    const cleanupResults = await Promise.all([
      client.from("notification_events").delete().eq("booking_id", bookingId),
      client.from("booking_events").delete().eq("booking_id", bookingId),
      client.from("payments").delete().eq("booking_id", bookingId),
    ]);
    const firstCleanupError = cleanupResults.find((result) => result.error)?.error;
    if (firstCleanupError) throw new Error(`payment-race cleanup failed: ${firstCleanupError.message}`);
    await requireNoError(
      "reservation cleanup failed",
      await client.from("inventory_reservations").delete().eq("booking_id", bookingId),
    );
    await requireNoError(
      "booking cleanup failed",
      await client.from("bookings").delete().eq("id", bookingId),
    );
  }
  if (customerId) {
    await requireNoError(
      "customer cleanup failed",
      await client.from("customers").delete().eq("id", customerId),
    );
  }
}
