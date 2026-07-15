import { createClient } from '@supabase/supabase-js';
import prisma from '../lib/prisma';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Checking Supabase Buckets ---');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error fetching buckets:', error);
  } else {
    buckets.forEach(b => console.log('Bucket:', b.name));
  }

  console.log('\n--- Checking Database ---');
  const countCustomers = await prisma.customer.count();
  console.log('Total customers in Postgres:', countCustomers);
  const countUsers = await prisma.user.count();
  console.log('Total users/staff:', countUsers);
  const countTaxOffices = await prisma.taxOffice.count();
  console.log('Total tax offices:', countTaxOffices);
  const countApplications = await prisma.nenkinApplication.count();
  console.log('Total applications:', countApplications);

  process.exit(0);
}

check();
