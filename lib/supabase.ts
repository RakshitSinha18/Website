import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Browser-safe Supabase client for storing session / course sign-ups.
 *
 * The URL and anon key are PUBLIC by design — the anon key only allows what
 * your Row Level Security (RLS) policies permit. For this site we allow anonymous
 * INSERTs into `session_bookings` and nothing else (see supabase/schema.sql).
 *
 * Set these in .env.local (local) and as GitHub Actions secrets (deploy):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// Supabase renamed the browser key "anon" -> "publishable"; accept either name.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
