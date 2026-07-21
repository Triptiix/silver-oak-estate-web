import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type AdminRole = Database["public"]["Enums"]["admin_role"];

export type AuthenticatedAdmin = {
  id: string;
  authUserId: string;
  role: AdminRole;
  name: string;
  email: string;
};

export async function getActiveAdmin(): Promise<AuthenticatedAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership, error } = await supabase
    .from("admins")
    .select("id, auth_user_id, role, name, email")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !membership) {
    return null;
  }

  return {
    id: membership.id,
    authUserId: membership.auth_user_id,
    role: membership.role,
    name: membership.name,
    email: membership.email,
  };
}

export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getActiveAdmin();

  if (!admin) {
    redirect("/admin/login?error=unauthorized");
  }

  return admin;
}

export async function requireAdminRole(
  ...requiredRoles: readonly AdminRole[]
): Promise<AuthenticatedAdmin> {
  const admin = await requireAdmin();

  if (!requiredRoles.includes(admin.role)) {
    redirect("/admin/dashboard?error=forbidden");
  }

  return admin;
}
