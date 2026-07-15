import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: bucketData, error: bucketError } = await supabaseAdmin.storage.createBucket('nenkin-documents', { public: false });
  console.log('Bucket Create:', bucketData, bucketError);
  
  const { data, error } = await supabaseAdmin.storage.from('nenkin-documents').upload('test-zairyu.jpg', Buffer.from('test'), { upsert: true });
  console.log('Upload:', data, error);
}

run();
