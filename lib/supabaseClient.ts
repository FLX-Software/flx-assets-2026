console.log('📦 Loading supabaseClient.ts...');

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment check:', {
  VITE_SUPABASE_URL: supabaseUrl || '❌ MISSING',
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ PRESENT' : '❌ MISSING',
});

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

console.log('✅ Creating Supabase client...');

// cache: 'no-store' verhindert, dass Browser/SW alte API-Antworten liefern
// („zweite Aktion funktioniert nicht“-Bug nach erstem Aufruf)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
  },
});

export { supabase, supabaseUrl, supabaseAnonKey };
console.log('✅ Supabase client created successfully');
