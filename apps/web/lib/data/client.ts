/**
 * Eva & Adam — the one Supabase client.
 *
 * THIS FILE IS THE ONLY PLACE IN THE APP THAT MAY IMPORT `@supabase/supabase-js`.
 * Everything else goes through a named function in `lib/data/*`. That is not
 * tidiness; it is the thing that makes the security model checkable. Every
 * table in this database is RLS deny-all with zero policies, so the only key
 * that can read anything is the service role key, which bypasses RLS entirely.
 * A single client construction site means there is exactly one line to audit to
 * know that the key never leaves the server, and a grep for the package name
 * has exactly one legitimate hit.
 *
 * The deny-all posture is deliberate defence in depth: the anon key is
 * published in every browser that loads the app, and with no policies it grants
 * nothing at all. The trade is that authorisation is now entirely this app's
 * job. Every function in `lib/data/*` is running as a superuser over the whole
 * database — write them as if that is true, because it is.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Lazily constructed, then reused.
 *
 * Constructed on first use rather than at module scope so that importing a
 * data function does not open a connection pool in a code path that never
 * queries — a route that only reads a cookie should not pay for a client.
 */
let cached: SupabaseClient | undefined;

/**
 * The service-role client.
 *
 * Server-only, always. `lib/env.ts` throws if it is ever evaluated in a
 * browser, so an accidental client import fails loudly at build rather than
 * quietly shipping the key.
 */
export function db(): SupabaseClient {
  if (cached) return cached;

  cached = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // There is no Supabase Auth user here and there never will be in Phase
        // 1. Persisting or refreshing a session would be the client trying to
        // manage a login that does not exist.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { "x-application-name": "eva-adam-web" },
      },
    },
  );

  return cached;
}

/**
 * Reset the memoised client. Tests only.
 *
 * Exported because a test that stubs the environment needs the next `db()` call
 * to pick the new values up. Nothing in the app calls this.
 */
export function __resetDbForTests(): void {
  cached = undefined;
}
