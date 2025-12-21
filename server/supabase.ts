import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;
let _supabaseAnon: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
  }
  
  if (!_supabase) {
    _supabase = createClient(supabaseUrl!, supabaseServiceKey!);
  }
  
  return _supabase;
}

export function getSupabaseAnon(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase anon client is not configured.");
  }
  
  if (!_supabaseAnon) {
    _supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return _supabaseAnon;
}

if (!isSupabaseConfigured()) {
  console.warn("Warning: Supabase is not configured. Using in-memory storage fallback.");
  console.warn("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable database storage.");
}
