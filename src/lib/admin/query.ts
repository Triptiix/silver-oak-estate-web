import { z } from "zod";
import type { AdminListQuery } from "./types";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const safeSearchPattern = /^[\p{L}\p{N}\s@.+_-]+$/u;
const bookingStatuses = new Set(["draft", "held", "payment_pending", "confirmed", "checked_in", "completed", "cancelled", "expired"]);
const paymentStatuses = new Set(["not_started", "order_created", "checkout_started", "pending", "authorized", "captured", "verified", "failed", "expired", "refund_pending", "reconciliation_required", "partially_refunded", "refunded"]);
const recoveryStates = new Set(["refund_pending", "reconciliation_required"]);
const notificationStatuses = new Set(["pending", "sent", "failed"]);

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdminListQuery(
  params: Record<string, string | string[] | undefined>,
): AdminListQuery {
  const page = z.coerce.number().int().min(1).catch(1).parse(one(params.page));
  const pageSize = z.coerce.number().int().min(1).max(50).catch(20).parse(one(params.pageSize));
  const rawSearch = one(params.search)?.trim().slice(0, 80);
  const search = rawSearch && safeSearchPattern.test(rawSearch) ? rawSearch : undefined;
  const checkInFrom = one(params.checkInFrom);
  const checkInTo = one(params.checkInTo);
  const bookingStatus = one(params.bookingStatus);
  const paymentStatus = one(params.paymentStatus);
  const recoveryState = one(params.recoveryState);
  const notificationStatus = one(params.notificationStatus);

  return {
    page,
    pageSize,
    search,
    bookingStatus: bookingStatus && bookingStatuses.has(bookingStatus) ? bookingStatus : undefined,
    paymentStatus: paymentStatus && paymentStatuses.has(paymentStatus) ? paymentStatus : undefined,
    recoveryState: recoveryState && recoveryStates.has(recoveryState) ? recoveryState : undefined,
    notificationStatus: notificationStatus && notificationStatuses.has(notificationStatus) ? notificationStatus : undefined,
    checkInFrom: checkInFrom && datePattern.test(checkInFrom) ? checkInFrom : undefined,
    checkInTo: checkInTo && datePattern.test(checkInTo) ? checkInTo : undefined,
    sort: one(params.sort) === "oldest" ? "oldest" : "newest",
  };
}
