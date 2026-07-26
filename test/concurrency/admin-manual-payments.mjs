import { execFileSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
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
if (!values.API_URL?.startsWith("http://127.0.0.1:") || !values.SERVICE_ROLE_KEY) {
  throw new Error("Local Supabase is required");
}

const service = createClient(values.API_URL, values.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
function authenticatedToken(userId) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: "authenticated",
    sub: userId,
  });
  const signature = createHmac("sha256", values.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

async function makeAdmin(role, ordinal) {
  const email = `manual-payment-concurrency-${randomUUID()}@example.test`;
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createError || !created.user) throw createError ?? new Error("admin user missing");
  const { error: membershipError } = await service.from("admins").insert({
    auth_user_id: created.user.id,
    role,
    name: `Payment Concurrency Admin ${ordinal}`,
    email,
    is_active: true,
  });
  if (membershipError) throw membershipError;
  return createClient(values.API_URL, values.ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${authenticatedToken(created.user.id)}` },
    },
  });
}

const [adminA, adminB] = await Promise.all([
  makeAdmin("admin", 1),
  makeAdmin("super_admin", 2),
]);

const base = new Date(Date.UTC(2045, 0, 1));
base.setUTCDate(base.getUTCDate() + Math.floor(Math.random() * 2000));
const date = (offset) => {
  const value = new Date(base);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
};
const manualArgs = (day, requestId, phone, provider = "manual_upi") => ({
  p_check_in_date: day,
  p_customer_name: "Payment Race Guest",
  p_customer_phone: phone,
  p_customer_email: null,
  p_guest_count: 2,
  p_overnight_guest_count: 0,
  p_special_requests: null,
  p_manual_provider: provider,
  p_request_id: requestId,
});
const verificationArgs = (bookingReference, reference, requestId) => ({
  p_booking_reference: bookingReference,
  p_external_reference: reference,
  p_observed_amount_paise: 500000,
  p_observed_currency: "INR",
  p_request_id: requestId,
  p_operator_note: null,
  p_evidence_descriptor: null,
});

async function createManualBooking(client, offset, phone, provider = "manual_upi") {
  const { data, error } = await client.rpc(
    "create_admin_manual_booking",
    manualArgs(date(offset), randomUUID(), phone, provider),
  );
  if (error || !data) throw error ?? new Error("manual booking creation returned no row");
  return data;
}

async function receiptFor(reference) {
  const { data: booking, error: bookingError } = await service
    .from("bookings")
    .select("id")
    .eq("booking_reference", reference)
    .single();
  if (bookingError || !booking) throw bookingError ?? new Error("booking missing");
  const { data: receipt, error: receiptError } = await service
    .from("admin_operation_events")
    .select("booking_id,inventory_reservation_id,payment_id")
    .eq("booking_id", booking.id)
    .eq("action_type", "manual_booking_created")
    .single();
  if (receiptError || !receipt) throw receiptError ?? new Error("creation receipt missing");
  return receipt;
}

const competing = await createManualBooking(
  adminA,
  0,
  "+919870100001",
);
const competingRequests = [randomUUID(), randomUUID()];
const competingResults = await Promise.all([
  adminA.rpc(
    "verify_admin_manual_payment",
    verificationArgs(competing.booking_reference, "RACE-REF-001", competingRequests[0]),
  ),
  adminB.rpc(
    "verify_admin_manual_payment",
    verificationArgs(competing.booking_reference, "RACE-REF-002", competingRequests[1]),
  ),
]);
if (
  competingResults.filter((result) => result.data?.result === "confirmed").length !== 1
  || competingResults.filter(
    (result) => result.error?.message === "payment_already_processed",
  ).length !== 1
) {
  throw new Error("two-administrator verification race did not produce one confirmation");
}
const competingReceipt = await receiptFor(competing.booking_reference);
const [
  { count: competingConfirmReceipts },
  { count: competingEvents },
  { count: competingOutbox },
] = await Promise.all([
  service
    .from("admin_operation_events")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", competingReceipt.booking_id)
    .eq("action_type", "manual_payment_verified"),
  service
    .from("booking_events")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", competingReceipt.booking_id)
    .eq("event_type", "manual_payment_confirmed"),
  service
    .from("notification_events")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", competingReceipt.booking_id)
    .eq("template_key", "booking_confirmed"),
]);
if (competingConfirmReceipts !== 1 || competingEvents !== 1 || competingOutbox !== 1) {
  throw new Error("two-administrator race duplicated confirmation artifacts");
}

const retry = await createManualBooking(adminA, 2, "+919870100002");
const retryRequest = randomUUID();
const retryArgs = verificationArgs(retry.booking_reference, "RACE-REF-RETRY", retryRequest);
const retryResults = await Promise.all([
  adminA.rpc("verify_admin_manual_payment", retryArgs),
  adminA.rpc("verify_admin_manual_payment", retryArgs),
]);
if (
  retryResults.some((result) => result.error)
  || retryResults.filter((result) => result.data?.applied).length !== 1
  || retryResults.filter((result) => result.data?.applied === false).length !== 1
) {
  throw new Error("concurrent exact retry did not produce one application and one replay");
}
const retryReceipt = await receiptFor(retry.booking_reference);
const { count: retryOutbox } = await service
  .from("notification_events")
  .select("id", { count: "exact", head: true })
  .eq("booking_id", retryReceipt.booking_id)
  .eq("template_key", "booking_confirmed");
if (retryOutbox !== 1) throw new Error("exact retry duplicated confirmation outbox");

const verificationFirst = await createManualBooking(adminA, 4, "+919870100003");
const { error: verificationFirstError } = await adminA.rpc(
  "verify_admin_manual_payment",
  verificationArgs(verificationFirst.booking_reference, "RACE-REF-WIN", randomUUID()),
);
if (verificationFirstError) throw verificationFirstError;
const { error: laterExpiryError } = await service.rpc("expire_stale_holds");
if (laterExpiryError) throw laterExpiryError;
const verificationFirstReceipt = await receiptFor(verificationFirst.booking_reference);
const { data: verificationFirstReservation } = await service
  .from("inventory_reservations")
  .select("reservation_type,status,expires_at")
  .eq("id", verificationFirstReceipt.inventory_reservation_id)
  .single();
if (
  verificationFirstReservation?.reservation_type !== "confirmed_booking"
  || verificationFirstReservation.status !== "active"
  || verificationFirstReservation.expires_at !== null
) {
  throw new Error("expiry changed an already confirmed manual reservation");
}

const expiryFirst = await createManualBooking(adminA, 6, "+919870100004");
const expiryFirstReceipt = await receiptFor(expiryFirst.booking_reference);
const past = new Date(Date.now() - 60_000).toISOString();
const [{ error: expireReservationError }, { error: expirePaymentError }] =
  await Promise.all([
    service
      .from("inventory_reservations")
      .update({ expires_at: past })
      .eq("id", expiryFirstReceipt.inventory_reservation_id),
    service
      .from("payments")
      .update({ attempt_expires_at: past })
      .eq("id", expiryFirstReceipt.payment_id),
  ]);
if (expireReservationError || expirePaymentError) {
  throw expireReservationError ?? expirePaymentError;
}
const { error: expiryError } = await service.rpc("expire_stale_holds");
if (expiryError) throw expiryError;
const { data: expiryResult, error: expiryVerifyError } = await adminB.rpc(
  "verify_admin_manual_payment",
  verificationArgs(expiryFirst.booking_reference, "RACE-REF-LATE", randomUUID()),
);
if (expiryVerifyError || expiryResult?.result !== "reconciliation_required") {
  throw expiryVerifyError ?? new Error("expiry-first path did not reconcile");
}
const [
  { data: expiredBooking },
  { data: expiredReservation },
  { data: reconciledPayment },
  { count: expiryOutbox },
] = await Promise.all([
  service.from("bookings").select("booking_status").eq("id", expiryFirstReceipt.booking_id).single(),
  service.from("inventory_reservations").select("status").eq("id", expiryFirstReceipt.inventory_reservation_id).single(),
  service.from("payments").select("status,manual_reference").eq("id", expiryFirstReceipt.payment_id).single(),
  service
    .from("notification_events")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", expiryFirstReceipt.booking_id)
    .eq("template_key", "booking_confirmed"),
]);
if (
  expiredBooking?.booking_status !== "expired"
  || expiredReservation?.status !== "expired"
  || reconciledPayment?.status !== "reconciliation_required"
  || reconciledPayment.manual_reference !== "RACE-REF-LATE"
  || expiryOutbox !== 0
) {
  throw new Error("expiry-first path revived state or lost observed payment facts");
}

const [referenceA, referenceB] = await Promise.all([
  createManualBooking(adminA, 8, "+919870100005"),
  createManualBooking(adminB, 10, "+919870100006", "manual_upi"),
]);
const sharedReference = "RACE-REF-SHARED";
const referenceResults = await Promise.all([
  adminA.rpc(
    "verify_admin_manual_payment",
    verificationArgs(referenceA.booking_reference, sharedReference, randomUUID()),
  ),
  adminB.rpc(
    "verify_admin_manual_payment",
    verificationArgs(referenceB.booking_reference, ` ${sharedReference.toLowerCase()} `, randomUUID()),
  ),
]);
if (
  referenceResults.filter((result) => result.data?.result === "confirmed").length !== 1
  || referenceResults.filter(
    (result) => result.error?.message === "payment_reference_conflict",
  ).length !== 1
) {
  throw new Error("duplicate normalized reference race did not produce one winner");
}
const losingReference = referenceResults[0].error ? referenceA : referenceB;
const losingReceipt = await receiptFor(losingReference.booking_reference);
const [
  { data: losingBooking },
  { data: losingReservation },
  { data: losingPayment },
  { count: losingMutationReceipts },
] = await Promise.all([
  service.from("bookings").select("booking_status").eq("id", losingReceipt.booking_id).single(),
  service.from("inventory_reservations").select("status,reservation_type").eq("id", losingReceipt.inventory_reservation_id).single(),
  service.from("payments").select("status,manual_reference").eq("id", losingReceipt.payment_id).single(),
  service
    .from("admin_operation_events")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", losingReceipt.booking_id)
    .in("action_type", [
      "manual_payment_verified",
      "manual_payment_reconciliation_required",
    ]),
]);
if (
  losingBooking?.booking_status !== "payment_pending"
  || losingReservation?.status !== "active"
  || losingReservation.reservation_type !== "manual_booking"
  || losingPayment?.status !== "pending"
  || losingPayment.manual_reference !== null
  || losingMutationReceipts !== 0
) {
  throw new Error("duplicate reference loser was partially mutated");
}

console.log(
  "Manual payment concurrency PASS: competing administrators, exact retries, both expiry orderings, and duplicate normalized references preserve atomicity and no revival.",
);
