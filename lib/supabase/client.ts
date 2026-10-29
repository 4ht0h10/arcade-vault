// Supabase client for Client Components (browser).
// Env vars are read with literal process.env access so Next inlines them.

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url) throw new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL");
  if (!key)
    throw new Error("Missing env var NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  return createBrowserClient(url, key);
}
