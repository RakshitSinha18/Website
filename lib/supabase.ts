import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Browser Supabase client for auth + storing sign-ups / class bookings.
 *
 * The URL and publishable (anon) key are PUBLIC by design — they only allow
 * what your Row Level Security (RLS) policies permit (see supabase/schema.sql).
 *
 * Set these in .env.local (local) and as GitHub Actions secrets (deploy):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   (or _PUBLISHABLE_KEY)
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// Supabase renamed the browser key "anon" -> "publishable"; accept either name.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
