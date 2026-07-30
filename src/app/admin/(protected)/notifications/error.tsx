"use client";

import { AdminRouteError } from "@/components/admin/admin-route-error";

export default function NotificationsError({ reset }: { reset: () => void }) {
  return (
    <AdminRouteError
      title="The notification outbox is temporarily unavailable"
      description="No recipient, booking or customer details were exposed. No notification was sent, resent or modified. Try the protected request again."
      reset={reset}
    />
  );
}
