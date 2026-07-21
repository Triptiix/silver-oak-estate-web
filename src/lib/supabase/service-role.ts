import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { envClient } from "../env/client";
import { envServer } from "../env/server";

export function createServiceRoleClient() {
  return createSupabaseClient(
    envClient.NEXT_PUBLIC_SUPABASE_URL,
    envServer.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
