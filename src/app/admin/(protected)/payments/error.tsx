"use client";

import { AdminRouteError } from "@/components/admin/admin-route-error";

export default function PaymentsError({ reset }: { reset: () => void }) {
  return (
    <AdminRouteError
      title="Payment attempts are temporarily unavailable"
      description="No payment, provider or customer details were exposed. No payment state was modified. Try the protected request again."
      reset={reset}
    />
  );
}
