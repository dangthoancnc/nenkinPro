import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function globalTeardown() {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  try {
    console.log('Cleaning up DB after E2E tests...');
    await prisma.nenkinApplication.deleteMany({ where: { customer: { code: { startsWith: 'TEST-CUST-' } } } });
    await prisma.customer.deleteMany({ where: { code: { startsWith: 'TEST-CUST-' } } });
    await prisma.taxOffice.deleteMany({ where: { name: 'Test Tax Office' } });
    await prisma.taxRepresentative.deleteMany({ where: { fullName: 'Test Rep' } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-employee-' } } });
    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Error in globalTeardown:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
