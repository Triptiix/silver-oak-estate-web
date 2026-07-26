import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/types/database.types";
import { maskEmail, maskName, maskPhone, notificationDelivery } from "./format";
import { orderAdminTimeline } from "./timeline";
import type {
  AdminBookingDetail,
  AdminBookingListItem,
  AdminListQuery,
  AdminNotificationItem,
  AdminPageResult,
  AdminPaymentItem,
} from "./types";

type UnknownRow = Record<string, unknown>;
type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type NotificationStatus = Database["public"]["Enums"]["notification_status"];

function asRows(value: unknown): UnknownRow[] {
  return Array.isArray(value) ? value as UnknownRow[] : [];
}

function asRow(value: unknown): UnknownRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] as UnknownRow | undefined) ?? null : value as UnknownRow;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function integer(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("invalid_integer_data");
  return parsed;
}

function pageResult<T>(items: T[], query: AdminListQuery, total: number): AdminPageResult<T> {
  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

function newest(rows: UnknownRow[]): UnknownRow | null {
  return [...rows].sort(
    (a, b) => Date.parse(text(b.created_at)) - Date.parse(text(a.created_at)),
  )[0] ?? null;
}

function mapPayment(row: UnknownRow): AdminPaymentItem {
  const booking = asRow(row.bookings);
  return {
    bookingReference: text(booking?.booking_reference),
    provider: text(row.provider),
    providerOrderId: nullableText(row.provider_order_id),
    providerPaymentId: nullableText(row.provider_payment_id),
    amountPaise: integer(row.amount_paise),
    currency: text(row.currency),
    status: text(row.status),
    verificationSource: nullableText(row.verification_source),
    recoveryReason: nullableText(row.recovery_reason),
    failureCode: nullableText(row.failure_code),
    orderCreatedAt: nullableText(row.order_created_at),
    checkoutStartedAt: nullableText(row.checkout_started_at),
    authorizedAt: nullableText(row.authorized_at),
    capturedAt: nullableText(row.captured_at),
    verifiedAt: nullableText(row.verified_at),
    recoveryRequiredAt: nullableText(row.recovery_required_at),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
    providerEventId: nullableText(row.last_provider_event_id),
  };
}

function mapNotification(row: UnknownRow): AdminNotificationItem {
  const booking = asRow(row.bookings);
  const status = text(row.status);
  return {
    bookingReference: nullableText(booking?.booking_reference),
    channel: text(row.channel),
    templateKey: text(row.template_key),
    recipientMasked: nullableText(row.recipient_masked),
    status,
    ...notificationDelivery(status),
    attemptCount: integer(row.attempt_count),
    createdAt: text(row.created_at),
    sentAt: nullableText(row.sent_at),
  };
}

const paymentFields = [
  "id", "provider", "provider_order_id", "provider_payment_id", "amount_paise", "currency",
  "status", "verification_source", "recovery_reason", "failure_code",
  "order_created_at", "checkout_started_at", "authorized_at", "captured_at",
  "verified_at", "recovery_required_at", "created_at", "updated_at",
  "last_provider_event_id",
].join(",");

export async function listAdminBookings(
  query: AdminListQuery,
): Promise<AdminPageResult<AdminBookingListItem>> {
  const client = createServiceRoleClient();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const paymentRelation = query.paymentStatus || query.recoveryState
    ? "payments!inner(provider,status,recovery_reason,created_at)"
    : "payments(provider,status,recovery_reason,created_at)";
  let request = client
    .from("bookings")
    .select(
      `booking_reference,customer_name_snapshot,customer_email_snapshot,customer_phone_snapshot,check_in_at,check_out_at,booking_status,advance_amount_paise,created_at,updated_at,inventory_reservations(status,reservation_type,expires_at,created_at),${paymentRelation}`,
      { count: "exact" },
    );

  if (query.bookingReference) request = request.eq("booking_reference", query.bookingReference);
  if (query.bookingStatus) request = request.eq("booking_status", query.bookingStatus as BookingStatus);
  if (query.checkInFrom) request = request.gte("check_in_at", `${query.checkInFrom}T00:00:00+05:30`);
  if (query.checkInTo) request = request.lt("check_in_at", `${query.checkInTo}T23:59:59.999+05:30`);
  if (query.paymentStatus) request = request.eq("payments.status", query.paymentStatus as PaymentStatus);
  if (query.recoveryState) request = request.eq("payments.status", query.recoveryState as PaymentStatus);

  const { data, count, error } = await request
    .order("created_at", { ascending: query.sort === "oldest" })
    .range(from, to);
  if (error) throw new Error("admin_booking_list_failed");

  const items = asRows(data).map((row) => {
    const reservation = newest(asRows(row.inventory_reservations));
    const payment = newest(asRows(row.payments));
    const paymentStatus = nullableText(payment?.status);
    return {
      bookingReference: text(row.booking_reference),
      checkInAt: text(row.check_in_at),
      checkOutAt: text(row.check_out_at),
      customerNameMasked: maskName(text(row.customer_name_snapshot)),
      customerEmailMasked: maskEmail(nullableText(row.customer_email_snapshot)),
      customerPhoneMasked: maskPhone(text(row.customer_phone_snapshot)),
      bookingStatus: text(row.booking_status),
      holdExpiresAt: nullableText(reservation?.expires_at),
      reservationStatus: nullableText(reservation?.status),
      reservationType: nullableText(reservation?.reservation_type),
      advanceAmountPaise: integer(row.advance_amount_paise),
      paymentProvider: nullableText(payment?.provider),
      paymentStatus,
      recoveryState: paymentStatus === "refund_pending" || paymentStatus === "reconciliation_required"
        ? paymentStatus
        : null,
      createdAt: text(row.created_at),
      updatedAt: text(row.updated_at),
    };
  });
  return pageResult(items, query, count ?? items.length);
}

export async function listAdminPayments(
  query: AdminListQuery,
  recoveryOnly = false,
): Promise<AdminPageResult<AdminPaymentItem>> {
  const client = createServiceRoleClient();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  let request = client
    .from("payments")
    .select(`${paymentFields},bookings!inner(booking_reference)`, { count: "exact" });
  if (recoveryOnly) request = request.in("status", ["refund_pending", "reconciliation_required"]);
  if (query.paymentStatus) request = request.eq("status", query.paymentStatus as PaymentStatus);
  if (query.recoveryState) request = request.eq("status", query.recoveryState as PaymentStatus);
  if (query.bookingReference) request = request.eq("bookings.booking_reference", query.bookingReference);
  const { data, count, error } = await request
    .order("created_at", { ascending: query.sort === "oldest" })
    .range(from, to);
  if (error) throw new Error("admin_payment_list_failed");
  const items = asRows(data).map(mapPayment);
  return pageResult(items, query, count ?? items.length);
}

export async function listAdminNotifications(
  query: AdminListQuery,
): Promise<AdminPageResult<AdminNotificationItem>> {
  const client = createServiceRoleClient();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const bookingRelation = query.bookingReference
    ? "bookings!inner(booking_reference)"
    : "bookings(booking_reference)";
  let request = client
    .from("notification_events")
    .select(
      `channel,template_key,recipient_masked,status,attempt_count,created_at,sent_at,${bookingRelation}`,
      { count: "exact" },
    );
  if (query.notificationStatus) request = request.eq("status", query.notificationStatus as NotificationStatus);
  if (query.bookingReference) request = request.eq("bookings.booking_reference", query.bookingReference);
  const { data, count, error } = await request
    .order("created_at", { ascending: query.sort === "oldest" })
    .range(from, to);
  if (error) throw new Error("admin_notification_list_failed");
  const items = asRows(data).map(mapNotification);
  return pageResult(items, query, count ?? items.length);
}

export async function getAdminBookingDetail(
  bookingReference: string,
): Promise<AdminBookingDetail | null> {
  const client = createServiceRoleClient();
  const { data: rawBooking, error } = await client
    .from("bookings")
    .select("id,booking_reference,customer_name_snapshot,customer_email_snapshot,customer_phone_snapshot,check_in_at,check_out_at,booking_status,total_amount_paise,advance_amount_paise,balance_amount_paise,guest_count,overnight_guest_count,created_at,updated_at")
    .eq("booking_reference", bookingReference)
    .maybeSingle();
  if (error) throw new Error("admin_booking_detail_failed");
  if (!rawBooking) return null;

  const booking = rawBooking as UnknownRow;
  const bookingId = text(booking.id);
  const [reservationsResult, paymentsResult, eventsResult, notificationsResult] = await Promise.all([
    client.from("inventory_reservations").select("id,status,reservation_type,expires_at,created_at,updated_at").eq("booking_id", bookingId).order("created_at"),
    client.from("payments").select(paymentFields).eq("booking_id", bookingId).order("created_at"),
    client.from("booking_events").select("id,event_type,previous_state,new_state,created_at").eq("booking_id", bookingId).order("created_at"),
    client.from("notification_events").select("id,channel,template_key,recipient_masked,status,attempt_count,created_at,sent_at").eq("booking_id", bookingId).order("created_at"),
  ]);
  if ([reservationsResult, paymentsResult, eventsResult, notificationsResult].some((result) => result.error)) {
    throw new Error("admin_booking_detail_failed");
  }

  const reservations = asRows(reservationsResult.data);
  const payments = asRows(paymentsResult.data).map((row) =>
    mapPayment({ ...row, bookings: { booking_reference: bookingReference } }),
  );
  const notifications = asRows(notificationsResult.data).map((row) =>
    mapNotification({ ...row, bookings: { booking_reference: bookingReference } }),
  );
  const latestReservation = newest(reservations);
  const latestPayment = payments.at(-1) ?? null;
  const now = Date.now();
  const holdEligible = booking.booking_status === "held"
    && latestReservation?.reservation_type === "temporary_hold"
    && latestReservation?.status === "active"
    && Date.parse(text(latestReservation.expires_at)) > now;

  const paymentTimeline = payments.flatMap((payment, index) => {
    const paymentId = text(asRows(paymentsResult.data)[index]?.id);
    const milestones: Array<[string, string | null]> = [
      ["Provider order attached", payment.orderCreatedAt],
      ["Checkout started", payment.checkoutStartedAt],
      ["Payment authorized", payment.authorizedAt],
      ["Payment captured", payment.capturedAt],
      ["Payment verified", payment.verifiedAt],
      ["Recovery required", payment.recoveryRequiredAt],
    ];
    return [
      { kind: "payment" as const, label: "Payment attempt created", state: payment.status, occurredAt: payment.createdAt, sourcePriority: 2, typePriority: 0, orderingId: paymentId },
      ...milestones
        .filter((entry): entry is [string, string] => entry[1] !== null)
        .map(([label, occurredAt], typePriority) => ({ kind: "payment" as const, label, state: payment.status, occurredAt, sourcePriority: 2, typePriority: typePriority + 1, orderingId: paymentId })),
    ];
  });

  const timeline = orderAdminTimeline([
    { kind: "booking" as const, label: "Booking created", state: text(booking.booking_status), occurredAt: text(booking.created_at), sourcePriority: 0, typePriority: 0, orderingId: bookingId },
    ...reservations.flatMap((row) => [
      { kind: "reservation" as const, label: "Reservation created", state: text(row.reservation_type), occurredAt: text(row.created_at), sourcePriority: 1, typePriority: 0, orderingId: text(row.id) },
      ...(row.updated_at !== row.created_at
        ? [{ kind: "reservation" as const, label: "Reservation updated", state: text(row.status), occurredAt: text(row.updated_at), sourcePriority: 1, typePriority: 1, orderingId: text(row.id) }]
        : []),
    ]),
    ...paymentTimeline,
    ...asRows(eventsResult.data).map((row) => ({
      kind: "audit" as const,
      label: text(row.event_type).replaceAll("_", " "),
      state: nullableText(row.new_state) ?? nullableText(row.previous_state),
      occurredAt: text(row.created_at), sourcePriority: 3, typePriority: 0, orderingId: text(row.id),
    })),
    ...notifications.map((notification) => ({
      kind: "notification" as const,
      label: `Notification ${notification.deliveryLabel}`,
      state: notification.templateKey,
      occurredAt: notification.sentAt ?? notification.createdAt, sourcePriority: 4, typePriority: 0, orderingId: text(asRows(notificationsResult.data)[notifications.indexOf(notification)]?.id),
    })),
  ]);

  const reservationStatus = nullableText(latestReservation?.status);
  const reservationType = nullableText(latestReservation?.reservation_type);
  return {
    booking: {
      bookingReference,
      checkInAt: text(booking.check_in_at),
      checkOutAt: text(booking.check_out_at),
      customerNameMasked: maskName(text(booking.customer_name_snapshot)),
      customerEmailMasked: maskEmail(nullableText(booking.customer_email_snapshot)),
      customerPhoneMasked: maskPhone(text(booking.customer_phone_snapshot)),
      bookingStatus: text(booking.booking_status),
      holdExpiresAt: nullableText(latestReservation?.expires_at),
      reservationStatus,
      reservationType,
      advanceAmountPaise: integer(booking.advance_amount_paise),
      totalAmountPaise: integer(booking.total_amount_paise),
      balanceAmountPaise: integer(booking.balance_amount_paise),
      guestCount: integer(booking.guest_count),
      overnightGuestCount: booking.overnight_guest_count === null ? null : integer(booking.overnight_guest_count),
      paymentProvider: latestPayment?.provider ?? null,
      paymentStatus: latestPayment?.status ?? null,
      recoveryState: latestPayment && ["refund_pending", "reconciliation_required"].includes(latestPayment.status)
        ? latestPayment.status
        : null,
      createdAt: text(booking.created_at),
      updatedAt: text(booking.updated_at),
    },
    holdEligible,
    authoritativeReservationExists: Boolean(latestReservation),
    inventoryConverted: reservationType === "confirmed_booking" && reservationStatus === "active",
    moneyCaptured: Boolean(latestPayment?.capturedAt),
    moneyVerified: Boolean(latestPayment?.verifiedAt),
    interventionRequired: Boolean(
      latestPayment && ["refund_pending", "reconciliation_required"].includes(latestPayment.status),
    ),
    payments,
    notifications,
    timeline,
  };
}
