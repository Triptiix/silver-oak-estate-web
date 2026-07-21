"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const credentials = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    redirect("/admin/login?error=invalid_credentials");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword(
    credentials.data
  );

  if (signInError) {
    redirect("/admin/login?error=invalid_credentials");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=invalid_credentials");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("admins")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError || !membership) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  redirect("/admin/dashboard");
}
