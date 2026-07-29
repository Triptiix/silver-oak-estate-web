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
  const email = `manual-concurrency-${randomUUID()}@example.test`;
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (createError || !created.user) throw createError ?? new Error("admin user missing");
  const { error: membershipError } = await service.from("admins").insert({
    auth_user_id: created.user.id,
    role,
    name: `Concurrency Admin ${ordinal}`,
    email,
    is_active: true,
  });
  if (membershipError) throw membershipError;
  const client = createClient(values.API_URL, values.ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${authenticatedToken(created.user.id)}` },
    },
  });
  return client;
}

const [adminA, adminB] = await Promise.all([
  makeAdmin("admin", 1),
  makeAdmin("super_admin", 2),
]);

const base = new Date(Date.UTC(2040, 0, 1));
base.setUTCDate(base.getUTCDate() + Math.floor(Math.random() * 3000));
const date = (offset) => {
  const value = new Date(base);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
};
const manualArgs = (day, requestId, phone, provider = "manual_upi") => ({
  p_check_in_date: day,
  p_customer_name: "Concurrency Guest",
  p_customer_phone: phone,
  p_customer_email: null,
  p_guest_count: 2,
  p_overnight_guest_count: 0,
  p_special_requests: null,
  p_manual_provider: provider,
  p_request_id: requestId,
});

const sameDateRequests = [randomUUID(), randomUUID()];
const sameDateResults = await Promise.all([
  adminA.rpc("create_admin_manual_booking", manualArgs(date(0), sameDateRequests[0], "+919870000001")),
  adminB.rpc("create_admin_manual_booking", manualArgs(date(0), sameDateRequests[1], "+919870000002")),
]);
if (
  sameDateResults.filter((result) => !result.error).length !== 1
  || sameDateResults.filter((result) => result.error?.message === "date_unavailable").length !== 1
) {
  throw new Error("manual/manual race did not produce one winner");
}
const { count: sameDateReceipts } = await service
  .from("admin_operation_events")
  .select("id", { count: "exact", head: true })
  .in("request_id", sameDateRequests);
if (sameDateReceipts !== 1) throw new Error("manual/manual loser left a receipt");

const publicRequest = randomUUID();
const publicResultPromise = service.rpc("create_booking_hold", {
  p_property_slug: "silver-oak-estate",
  p_check_in_date: date(2),
  p_customer_name: "Public Race",
  p_customer_email: null,
  p_customer_phone: "+919870000003",
  p_whatsapp: null,
  p_guest_count: 2,
  p_overnight_guest_count: 0,
  p_special_requests: null,
  p_hold_request_id: publicRequest,
  p_hold_token_nonce: randomUUID(),
  p_request_fingerprint_hash: `manual-public-${randomUUID()}`,
  p_actor_identity_hash: "6666666666666666666666666666666666666666666666666666666666666666",
  p_fallback_hold_minutes: 10,
});
const manualPublicRequest = randomUUID();
const [publicResult, manualPublicResult] = await Promise.all([
  publicResultPromise,
  adminA.rpc(
    "create_admin_manual_booking",
    manualArgs(date(2), manualPublicRequest, "+919870000004", "payment_link"),
  ),
]);
if ([publicResult, manualPublicResult].filter((result) => !result.error).length !== 1) {
  throw new Error("manual/public race did not produce one winner");
}

const ownerRequest = randomUUID();
const manualOwnerRequest = randomUUID();
const [ownerResult, manualOwnerResult] = await Promise.all([
  adminA.rpc("create_admin_owner_block", {
    p_first_blocked_date: date(4),
    p_last_blocked_date: date(4),
    p_request_id: ownerRequest,
    p_reason_category: "owner_use",
    p_internal_note: null,
  }),
  adminB.rpc(
    "create_admin_manual_booking",
    manualArgs(date(4), manualOwnerRequest, "+919870000005"),
  ),
]);
if ([ownerResult, manualOwnerResult].filter((result) => !result.error).length !== 1) {
  throw new Error("manual/owner race did not produce one winner");
}

const retryRequest = randomUUID();
const retryArgs = manualArgs(date(6), retryRequest, "+919870000006");
const retryResults = await Promise.all([
  adminA.rpc("create_admin_manual_booking", retryArgs),
  adminA.rpc("create_admin_manual_booking", retryArgs),
]);
if (retryResults.some((result) => result.error)) {
  throw new Error("concurrent exact retry failed");
}
const retryRows = retryResults.map((result) => result.data);
if (
  retryRows[0].booking_reference !== retryRows[1].booking_reference
  || retryRows.filter((row) => row.applied).length !== 1
  || retryRows.filter((row) => !row.applied).length !== 1
) {
  throw new Error("concurrent exact retry did not return one create and one replay");
}
const { data: retryReceipt, error: retryReceiptError } = await service
  .from("admin_operation_events")
  .select("booking_id,inventory_reservation_id,payment_id")
  .eq("request_id", retryRequest)
  .single();
if (retryReceiptError || !retryReceipt) throw retryReceiptError ?? new Error("retry receipt missing");
const [{ count: bookingCount }, { count: reservationCount }, { count: paymentCount }] =
  await Promise.all([
    service.from("bookings").select("id", { count: "exact", head: true }).eq("id", retryReceipt.booking_id),
    service.from("inventory_reservations").select("id", { count: "exact", head: true }).eq("id", retryReceipt.inventory_reservation_id),
    service.from("payments").select("id", { count: "exact", head: true }).eq("id", retryReceipt.payment_id),
  ]);
if (bookingCount !== 1 || reservationCount !== 1 || paymentCount !== 1) {
  throw new Error("concurrent retry left an invalid domain row count");
}

const sharedPhone = `+9198${String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, "0")}`;
const sharedPublicRequest = randomUUID();
const sharedManualRequest = randomUUID();
const [sharedPublicResult, sharedManualResult] = await Promise.all([
  service.rpc("create_booking_hold", {
    p_property_slug: "silver-oak-estate",
    p_check_in_date: date(8),
    p_customer_name: "Shared Identity Guest",
    p_customer_email: null,
    p_customer_phone: sharedPhone.replace(/(\+91)(\d{5})(\d+)/, "$1 $2 $3"),
    p_whatsapp: null,
    p_guest_count: 2,
    p_overnight_guest_count: 0,
    p_special_requests: null,
    p_hold_request_id: sharedPublicRequest,
    p_hold_token_nonce: randomUUID(),
    p_request_fingerprint_hash: `shared-phone-${randomUUID()}`,
    p_actor_identity_hash: "7777777777777777777777777777777777777777777777777777777777777777",
    p_fallback_hold_minutes: 10,
  }),
  adminA.rpc(
    "create_admin_manual_booking",
    manualArgs(date(10), sharedManualRequest, sharedPhone),
  ),
]);
if (sharedPublicResult.error || sharedManualResult.error) {
  throw sharedPublicResult.error ?? sharedManualResult.error;
}
const [{ data: sharedCustomers, error: sharedCustomerError }, {
  data: sharedBookings,
  error: sharedBookingError,
}] = await Promise.all([
  service.from("customers").select("id").eq("phone", sharedPhone),
  service
    .from("bookings")
    .select("id,customer_id,customer_phone_snapshot,source")
    .eq("customer_phone_snapshot", sharedPhone)
    .in("source", ["public_web", "admin_manual"]),
]);
if (sharedCustomerError || sharedBookingError) {
  throw sharedCustomerError ?? sharedBookingError;
}
if (
  sharedCustomers?.length !== 1
  || sharedBookings?.length !== 2
  || sharedBookings.some((booking) =>
    booking.customer_id !== sharedCustomers[0].id
    || booking.customer_phone_snapshot !== sharedPhone
  )
) {
  throw new Error("cross-workflow phone race did not reuse one canonical customer");
}
const sharedBookingIds = sharedBookings.map((booking) => booking.id);
const [{ count: sharedReservationCount }, { count: sharedPaymentCount }] = await Promise.all([
  service
    .from("inventory_reservations")
    .select("id", { count: "exact", head: true })
    .in("booking_id", sharedBookingIds),
  service
    .from("payments")
    .select("id", { count: "exact", head: true })
    .in("booking_id", sharedBookingIds),
]);
if (sharedReservationCount !== 2 || sharedPaymentCount !== 1) {
  throw new Error("cross-workflow phone race left partial domain rows");
}

console.log(
  "Manual booking concurrency PASS: inventory races produced one winner; exact retry produced one domain set; non-overlapping public/manual creation reused one canonical customer.",
);
