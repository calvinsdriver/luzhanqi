import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Browser client using only the anon key. It is only ever pointed at `game_events` (a
 * payload-free change signal) - every other gameplay table has zero anon grants, so this
 * client structurally cannot read hidden piece data even if misused.
 */
export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}
