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

function args(date, phone, fingerprint, actorHash) {
  return {
    p_property_slug: "silver-oak-estate",
    p_check_in_date: date,
    p_customer_name: "Concurrency Test",
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
  };
}

// Scenario dates are kept 10 days apart so a +/- 1 day window around one
// request's date can never overlap the other request's reservation.
function dayWindow(date) {
  const base = new Date(`${date}T00:00:00Z`).valueOf();
  return { from: new Date(base - 86400000).toISOString(), to: new Date(base + 2 * 86400000).toISOString() };
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

// Scenario A: one actor identity, different phones, fingerprints, request IDs
// and non-overlapping dates. The actor-level active-hold rule permits only one.
const sameActorHash = "3333333333333333333333333333333333333333333333333333333333333333";
const scenarioARequests = [
  args("2031-09-10", "+919880000101", "concurrency-same-actor-a", sameActorHash),
  args("2031-09-20", "+919880000102", "concurrency-same-actor-b", sameActorHash),
];
const scenarioA = await Promise.all(scenarioARequests.map((request) => client.rpc("create_booking_hold", request)));
testFingerprints.push(...scenarioARequests.map((request) => request.p_request_fingerprint_hash));

const scenarioAWinnerIndex = scenarioA.findIndex((result) => !result.error);
const scenarioALoserIndex = scenarioA.findIndex((result) => result.error?.message.includes("hold_abuse_limit"));
if (scenarioA.filter((result) => !result.error).length !== 1
  || scenarioA.filter((result) => result.error?.message.includes("hold_abuse_limit")).length !== 1) {
  const messages = scenarioA.map((result) => result.error?.message ?? "success").join(" | ");
  throw new Error(`scenario A (same actor, different dates) did not produce exactly one winner and one hold_abuse_limit loser: ${messages}`);
}
createdBookingIds.push(scenarioA[scenarioAWinnerIndex].data.bookingId);

const loserRequest = scenarioARequests[scenarioALoserIndex];
const loserWindow = dayWindow(loserRequest.p_check_in_date);
const [
  { count: loserBookingCount },
  { count: loserRequestIdCount },
  { count: loserReservationCount },
  { count: loserCustomerCount },
  { count: scenarioAWinnerEventCount },
] = await Promise.all([
  client.from("bookings").select("id", { count: "exact", head: true }).eq("request_fingerprint_hash", loserRequest.p_request_fingerprint_hash),
  client.from("bookings").select("id", { count: "exact", head: true }).eq("hold_request_id", loserRequest.p_hold_request_id),
  client.from("inventory_reservations").select("id", { count: "exact", head: true }).gte("start_at", loserWindow.from).lt("start_at", loserWindow.to),
  client.from("customers").select("id", { count: "exact", head: true }).eq("phone", loserRequest.p_customer_phone),
  client.from("booking_events").select("id", { count: "exact", head: true }).eq("booking_id", scenarioA[scenarioAWinnerIndex].data.bookingId),
]);
if (loserBookingCount !== 0 || loserRequestIdCount !== 0) throw new Error("losing transaction in scenario A left a booking");
if (loserReservationCount !== 0) throw new Error("losing transaction in scenario A left a reservation");
if (loserCustomerCount !== 0) throw new Error("losing transaction in scenario A left a customer mutation");
if (scenarioAWinnerEventCount !== 2) throw new Error("scenario A did not leave exactly the winning booking events");

// Scenario B: distinct actor identities on non-overlapping dates must both win.
const actorC = "4444444444444444444444444444444444444444444444444444444444444444";
const actorD = "5555555555555555555555555555555555555555555555555555555555555555";
const scenarioB = await Promise.all([
  client.rpc("create_booking_hold", args("2031-10-10", "+919880000201", "concurrency-diff-actor-a", actorC)),
  client.rpc("create_booking_hold", args("2031-10-20", "+919880000202", "concurrency-diff-actor-b", actorD)),
]);
testFingerprints.push("concurrency-diff-actor-a", "concurrency-diff-actor-b");
if (scenarioB.some((result) => result.error)) {
  const messages = scenarioB.map((result) => result.error?.message ?? "success").join(" | ");
  throw new Error(`scenario B (different actors, different dates) did not have both succeed: ${messages}`);
}
const scenarioBBookingIds = scenarioB.map((result) => result.data.bookingId);
createdBookingIds.push(...scenarioBBookingIds);
for (const bookingId of scenarioBBookingIds) {
  const { count } = await client.from("inventory_reservations").select("id", { count: "exact", head: true }).eq("booking_id", bookingId).eq("status", "active");
  if (count !== 1) throw new Error("scenario B booking did not leave exactly one active reservation");
}

const { count: reservationCount } = await client.from("inventory_reservations").select("id", { count: "exact", head: true }).in("booking_id", createdBookingIds);
if (reservationCount !== 6) throw new Error("unexpected reservation count after concurrency test");
const { count: bookingCount } = await client.from("bookings").select("id", { count: "exact", head: true }).in("request_fingerprint_hash", testFingerprints);
const { count: eventCount } = await client.from("booking_events").select("id", { count: "exact", head: true }).in("booking_id", createdBookingIds);
if (bookingCount !== 6 || eventCount !== 12) throw new Error("a losing transaction left partial booking or event state");
console.log("Concurrency PASS: 3/3 same-date races produced one winner; scenario A (same actor, different dates) produced one winner and one hold_abuse_limit with no losing side effects; scenario B (different actors, different dates) both succeeded.");
