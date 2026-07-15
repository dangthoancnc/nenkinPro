import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function globalSetup() {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const user = await prisma.user.create({
      data: {
        email: `test-employee-${Date.now()}@example.com`,
        password: 'password',
        name: 'Test Employee'
      }
    });

    const taxOffice = await prisma.taxOffice.create({
      data: {
        name: 'Test Tax Office',
        address: '123 Test St',
        postalCode: '100-0001',
      }
    });

    const taxRepresentative = await prisma.taxRepresentative.create({
      data: {
        fullName: 'Test Rep',
        address: '456 Rep St',
        postalCode: '200-0002',
      }
    });

    const customer = await prisma.customer.create({
      data: {
        code: `TEST-CUST-${Date.now()}`,
        fullName: 'Test Customer',
        dob: new Date('1990-01-01'),
        postalCode: '300-0003',
        taxOfficeId: taxOffice.id,
        myNumber: '123456789012',
        nenkinNumber: '9876543210'
      }
    });

    const application = await prisma.nenkinApplication.create({
      data: {
        customerId: customer.id,
        taxRepresentativeId: taxRepresentative.id,
      }
    });

    process.env.TEST_APP_ID = application.id;
    process.env.TEST_EMPLOYEE_ID = user.id;
    console.log('Seeded DB for E2E tests. TEST_APP_ID:', process.env.TEST_APP_ID);
    console.log('TEST_EMPLOYEE_ID:', process.env.TEST_EMPLOYEE_ID);
  } catch (error) {
    console.error('Error in globalSetup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
