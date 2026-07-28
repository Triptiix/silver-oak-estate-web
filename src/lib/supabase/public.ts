import "server-only";

import { createClient } from "@supabase/supabase-js";

import { envClient } from "@/lib/env/client";
import type { Database } from "@/types/database.types";

export function createPublicSupabaseClient() {
  return createClient<Database>(
    envClient.NEXT_PUBLIC_SUPABASE_URL,
    envClient.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
