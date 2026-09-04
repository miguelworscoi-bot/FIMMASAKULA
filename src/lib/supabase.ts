import { createClient } from '@supabase/supabase-js';

// Vite only exposes VITE_-prefixed vars to client code. vite.config.ts maps the
// project's real Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL, etc.)
// into import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at build time.
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as Record<string, any>).env : undefined;

const rawUrl = metaEnv?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = metaEnv?.VITE_SUPABASE_ANON_KEY;

if (!rawUrl || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY) are set for the project.',
  );
}

// Normalize URL to remove trailing /rest/v1/ if passed, as @supabase/supabase-js appends it internally
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
