import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Dùng Service Role Key thay vì Anon Key, CHỈ sử dụng ở server-side
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Signed URLs might fail if RLS blocks Anon Key.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '', {
  auth: {
    persistSession: false, // Server-side client, no need to persist
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
