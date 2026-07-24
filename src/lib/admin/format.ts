const IST_TIME_ZONE = "Asia/Kolkata";

export function formatAdminDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAdminDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatPaise(amountPaise: number, currency = "INR"): string {
  if (!Number.isSafeInteger(amountPaise)) {
    throw new Error("invalid_integer_paise");
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

export function maskName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 1) return "*";
  return `${trimmed[0]}${"*".repeat(Math.min(trimmed.length - 1, 6))}`;
}

export function maskEmail(value: string | null): string | null {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `***${digits.slice(-4)}` : "***";
}

export function notificationDelivery(
  status: string,
): Pick<import("./types").AdminNotificationItem, "deliveryLabel" | "deliveryNote"> {
  if (status === "sent") {
    return { deliveryLabel: "delivered", deliveryNote: "Provider delivery recorded." };
  }
  if (status === "failed") {
    return { deliveryLabel: "failed", deliveryNote: "Delivery attempt failed." };
  }
  return {
    deliveryLabel: "queued",
    deliveryNote: "Delivery not implemented in Phase 5A.",
  };
}
