import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service-role key, which bypasses RLS. Every
 * gameplay table (games/seats/pieces/moves) is locked down with zero anon/authenticated
 * grants, so this is the only client in the codebase that may ever touch them. Never import
 * this file from a "use client" component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  return cached;
}
