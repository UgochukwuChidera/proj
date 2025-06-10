
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Configuration error: NEXT_PUBLIC_SUPABASE_URL is not defined. Please ensure it is set in your .env file.");
}
if (supabaseUrl === 'your-supabase-url') {
  throw new Error("Configuration error: NEXT_PUBLIC_SUPABASE_URL is still set to the placeholder 'your-supabase-url'. Please update your .env file with your actual Supabase project URL.");
}

if (!supabaseAnonKey) {
  throw new Error("Configuration error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Please ensure it is set in your .env file.");
}
if (supabaseAnonKey === 'your-supabase-anon-key') {
  throw new Error("Configuration error: NEXT_PUBLIC_SUPABASE_ANON_KEY is still set to the placeholder 'your-supabase-anon-key'. Please update your .env file with your actual Supabase anon key.");
}

try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error(`Configuration error: The value provided for NEXT_PUBLIC_SUPABASE_URL ('${supabaseUrl}') is not a valid URL. Please check your .env file.`);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

