import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Clearing database (keeping TaxOffice, BankDictionary, User, TaxRepresentative)...');
  
  // Truncate nenkin_customers with CASCADE to delete all dependent rows
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE nenkin_customers CASCADE;`);
  
  console.log('Database successfully cleaned.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
