const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DIRECT_URL || "postgresql://postgres.nwaxlfuztnismocuuoyc:T03h11oan1987@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres",
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, "fullName" FROM "Customer" LIMIT 5');
  console.log(res.rows);
  await client.end();
}

run().catch(console.error);
