"use client";

import { AdminRouteError } from "@/components/admin/admin-route-error";

export default function RecoveryError({ reset }: { reset: () => void }) {
  return (
    <AdminRouteError
      title="The recovery queue is temporarily unavailable"
      description="No payment, provider or customer details were exposed. No payment, booking or reservation state was modified. Try the protected request again."
      reset={reset}
    />
  );
}
