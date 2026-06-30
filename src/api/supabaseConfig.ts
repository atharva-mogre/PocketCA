import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "🚨 SUPABASE CONFIGURATION ERROR 🚨\n" +
    "Missing Environment Variables. Please ensure your .env file exists in the root folder and contains:\n" +
    "VITE_SUPABASE_URL=...\n" +
    "VITE_SUPABASE_ANON_KEY=...\n\n" +
    "Current values found:\n" +
    `URL: ${supabaseUrl || 'UNDEFINED'}\n` +
    `KEY: ${supabaseAnonKey ? 'Found (Hidden)' : 'UNDEFINED'}`
  );
}

// Fallback to dummy so the app doesn't instantly crash, but will fail gracefully on network requests
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co', 
  supabaseAnonKey || 'dummy-anon-key'
);
