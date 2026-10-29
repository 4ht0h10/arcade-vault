// Supabase client for Server Components, Server Actions and Route Handlers.
// Reads cookies(), so with cacheComponents callers must sit behind <Suspense>
// and never inside a plain "use cache" scope.

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url) throw new Error("Missing env var NEXT_PUBLIC_SUPABASE_URL");
  if (!key)
    throw new Error("Missing env var NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore until a proxy refreshes the session (auth spec).
        }
      },
    },
  });
}
