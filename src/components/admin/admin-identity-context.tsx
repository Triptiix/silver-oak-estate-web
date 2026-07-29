"use client";

import { createContext, useContext } from "react";

export type SafeAdminRole = "operations" | "admin" | "super_admin";

export type SafeAdminIdentity = {
  name: string;
  role: SafeAdminRole;
};

const AdminIdentityContext = createContext<SafeAdminIdentity | null>(null);

export function AdminIdentityProvider({
  admin,
  children,
}: {
  admin: SafeAdminIdentity;
  children: React.ReactNode;
}) {
  return (
    <AdminIdentityContext.Provider value={admin}>
      {children}
    </AdminIdentityContext.Provider>
  );
}

export function useAdminIdentity() {
  const admin = useContext(AdminIdentityContext);

  if (!admin) {
    throw new Error("Admin identity is unavailable outside the protected layout.");
  }

  return admin;
}

export function formatAdminRole(role: SafeAdminRole) {
  if (role === "super_admin") return "Super admin";
  if (role === "admin") return "Admin";
  return "Operations";
}

export function AdminIdentitySummary() {
  const admin = useAdminIdentity();

  return (
    <div className="min-w-0 text-left lg:text-right">
      <p className="truncate text-sm font-semibold">{admin.name}</p>
      <p className="text-xs text-[var(--muted-foreground)]">
        {formatAdminRole(admin.role)}
      </p>
    </div>
  );
}
