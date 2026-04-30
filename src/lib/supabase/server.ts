import { createClient } from "@supabase/supabase-js";
import {
  hasSupabaseConfig,
  publishableKey,
  supabaseUrl,
} from "@/lib/supabase/config";

export function createServerSupabaseClient() {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY configuration.",
    );
  }

  return createClient(supabaseUrl!, publishableKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
