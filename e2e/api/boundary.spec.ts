import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import prisma from '../../src/lib/prisma';

test.describe('API Boundary /api/generate-doc (Tier 2)', () => {
  let employeeId: string;
  let boundaryAppId: string;
  let customerId: string;

  test.beforeAll(async () => {
    employeeId = process.env.TEST_EMPLOYEE_ID || '';
    
    // Create an application with missing/boundary data (no postalCode, no bank, empty DOB)
    const user = await prisma.user.findFirst();
    const customer = await prisma.customer.create({
      data: {
        code: 'BNDRY' + Date.now() + Math.random().toString(36).substr(2, 5),
        fullName: 'Boundary Test',
        dob: new Date(),
        status: 'NEW',
        // Deliberately missing postalCode and bank info
      }
    });
    customerId = customer.id;
    const app = await prisma.nenkinApplication.create({
      data: {
        customerId: customer.id,
        status: 'DRAFT'
      }
    });
    boundaryAppId = app.id;
  });

  test.afterAll(async () => {
    if (boundaryAppId) {
      await prisma.nenkinApplication.deleteMany({ where: { id: boundaryAppId } });
    }
    if (customerId) {
      await prisma.customer.deleteMany({ where: { id: customerId } });
    }
    await prisma.$disconnect();
  });

  test('should gracefully handle application with missing postal code and bank info without crashing', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: boundaryAppId, templateType: 'LAN1_DATTAI' }
    });
    // It should generate the doc normally, just with empty variables for those fields
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  test('Invalid applicationId yields 404', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: '00000000-0000-0000-0000-000000000000', templateType: 'LAN1_DATTAI' }
    });
    expect(res.status()).toBe(404);
  });

  test('Invalid templateType yields 400', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: boundaryAppId, templateType: 'INVALID_TEMPLATE_TYPE' }
    });
    expect(res.status()).toBe(400);
  });
});
