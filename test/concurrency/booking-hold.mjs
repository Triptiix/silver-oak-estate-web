import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const output = execFileSync("./node_modules/.bin/supabase", ["status", "-o", "env"], { encoding: "utf8" });
const values = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="(.*)"$/)).filter(Boolean).map((match) => [match[1], match[2]]));
if (!values.API_URL?.startsWith("http://127.0.0.1:") || !values.SERVICE_ROLE_KEY) throw new Error("Local Supabase is required");
const client = createClient(values.API_URL, values.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: priorBookings } = await client.from("bookings").select("id").like("request_fingerprint_hash", "concurrency-%");
const priorIds = priorBookings?.map((booking) => booking.id) ?? [];
if (priorIds.length) {
  await client.from("booking_events").delete().in("booking_id", priorIds);
  await client.from("inventory_reservations").delete().in("booking_id", priorIds);
  await client.from("bookings").delete().in("id", priorIds);
}
await client.from("customers").delete().like("phone", "+919880%");

function args(date, phone, fingerprint, actorHash = "a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0") {
  return {
    p_property_slug: "silver-oak-estate", p_check_in_date: date,
    p_customer_name: "Concurrency Test", p_customer_email: null, p_customer_phone: phone,
    p_whatsapp: null, p_guest_count: 4, p_overnight_guest_count: 2, p_special_requests: null,
    p_hold_request_id: randomUUID(), p_hold_token_nonce: randomUUID(),
    p_request_fingerprint_hash: fingerprint,
    p_actor_identity_hash: actorHash,
    p_fallback_hold_minutes: 10,
  };
}

const createdBookingIds = [];
const testFingerprints = [];
for (let round = 0; round < 3; round += 1) {
  const date = `2031-08-${String(10 + round).padStart(2, "0")}`;
  const fingerprints = [`concurrency-a-${round}`, `concurrency-b-${round}`];
  testFingerprints.push(...fingerprints);
  const actorA = `11111111111111111111111111111111111111111111111111111111111111${round}1`;
  const actorB = `22222222222222222222222222222222222222222222222222222222222222${round}2`;
  const results = await Promise.all([
    client.rpc("create_booking_hold", args(date, `+9198800000${round}1`, fingerprints[0], actorA)),
    client.rpc("create_booking_hold", args(date, `+9198800000${round}2`, fingerprints[1], actorB)),
  ]);
  const winners = results.filter((result) => !result.error);
  const losers = results.filter((result) => result.error?.message.includes("date_unavailable"));
  if (winners.length !== 1 || losers.length !== 1) {
    const messages = results.map((result) => result.error?.message ?? "success").join(" | ");
    throw new Error(`same-date round ${round + 1} did not produce exactly one winner: ${messages}`);
  }
  createdBookingIds.push(winners[0].data.bookingId);
  const { count } = await client.from("inventory_reservations").select("id", { count: "exact", head: true }).eq("booking_id", winners[0].data.bookingId).eq("status", "active");
  if (count !== 1) throw new Error(`same-date round ${round + 1} did not leave one active reservation`);
}

const different = await Promise.all([
  client.rpc("create_booking_hold", args("2031-09-10", "+919880000101", "concurrency-different-a")),
  client.rpc("create_booking_hold", args("2031-09-11", "+919880000102", "concurrency-different-b")),
]);
testFingerprints.push("concurrency-different-a", "concurrency-different-b");
if (different.some((result) => result.error)) throw new Error("non-overlapping concurrent holds did not both succeed");
createdBookingIds.push(...different.map((result) => result.data.bookingId));

const { count: reservationCount } = await client.from("inventory_reservations").select("id", { count: "exact", head: true }).in("booking_id", createdBookingIds);
if (reservationCount !== 5) throw new Error("unexpected reservation count after concurrency test");
const { count: bookingCount } = await client.from("bookings").select("id", { count: "exact", head: true }).in("request_fingerprint_hash", testFingerprints);
const { count: eventCount } = await client.from("booking_events").select("id", { count: "exact", head: true }).in("booking_id", createdBookingIds);
if (bookingCount !== 5 || eventCount !== 10) throw new Error("a losing transaction left partial booking or event state");
console.log("Concurrency PASS: 3/3 same-date races produced one winner; 2/2 non-overlapping holds succeeded; no partial losing reservations.");
