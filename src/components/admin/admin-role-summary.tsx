"use client";

import {
  formatAdminRole,
  useAdminIdentity,
} from "./admin-identity-context";

const operationsCapabilities = [
  "Create maintenance blocks",
  "Release maintenance blocks",
  "Create manual bookings",
  "Access protected operational views",
];

const adminCapabilities = [
  "Create owner and maintenance blocks",
  "Release owner and maintenance blocks",
  "Create manual bookings",
  "Verify eligible manual-payment observations",
  "Access protected operational views",
];

export function AdminRoleSummary() {
  const admin = useAdminIdentity();
  const elevated = admin.role === "admin" || admin.role === "super_admin";
  const capabilities = elevated ? adminCapabilities : operationsCapabilities;

  return (
    <section
      aria-labelledby="role-capability-heading"
      className="rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        Current role · {formatAdminRole(admin.role)}
      </p>
      <h2 id="role-capability-heading" className="mt-2 text-xl font-bold">
        Your operational capabilities
      </h2>
      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {capabilities.map((capability) => (
          <li key={capability} className="flex gap-2">
            <span aria-hidden="true" className="text-[var(--success)]">●</span>
            <span>{capability}</span>
          </li>
        ))}
      </ul>
      {!elevated ? (
        <p className="mt-4 rounded-lg bg-[var(--accent)] p-3 text-sm">
          Owner blocks and manual-payment verification require an admin or
          super-admin.
        </p>
      ) : null}
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        Interface visibility is not the authorization boundary. Every operation
        is independently enforced by the server and database.
      </p>
    </section>
  );
}
