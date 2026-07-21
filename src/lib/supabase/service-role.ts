import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { envClient } from "../env/client";
import { envServer } from "../env/server";
import type { Database } from "@/types/database.types";

export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
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
