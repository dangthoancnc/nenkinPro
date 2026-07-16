require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true }
  });
  console.log('--- Staff Accounts ---');
  users.forEach(u => console.log(`Email: ${u.email} | Password: password`));

  const portals = await prisma.portalAccount.findMany({
    include: { customer: true }
  });
  console.log('\n--- Customer Portal Accounts ---');
  portals.forEach(p => console.log(`Card Number: ${p.cardNumber} | PIN/Password: ${p.passwordPin || '(Not set / Registered)'} | Customer: ${p.customer?.fullName}`));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
