import { createClient } from "@supabase/supabase-js";
import {
  hasSupabaseConfig,
  publishableKey,
  supabaseUrl,
} from "@/lib/supabase/config";

export function createBrowserSupabaseClient() {
  if (!hasSupabaseConfig()) {
    return createClient("https://placeholder.supabase.co", "public-anon-key");
  }

  return createClient(supabaseUrl!, publishableKey!);
}
