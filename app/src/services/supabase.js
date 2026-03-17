import { createClient } from '@supabase/supabase-js'

// In production, proxy through own domain so Supabase URL is never exposed in browser.
// Vercel rewrites /supabase/* → https://szcvfcemgspfsfrcmqzb.supabase.co/*
const supabaseUrl = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_URL
  : `${window.location.origin}/supabase`

export const supabase = createClient(
  supabaseUrl,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
