import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import prisma from '../../src/lib/prisma';

test.describe('API Adversarial Phase 2 (Tier 5)', () => {
  let employeeId: string;
  let appId: string;
  let customerId: string;

  test.beforeAll(async () => {
    employeeId = process.env.TEST_EMPLOYEE_ID || '';
    
    const customer = await prisma.customer.create({
      data: {
        code: 'ADV_GEN2_' + Date.now() + Math.random().toString(36).substring(2, 7),
        fullName: 'Adversarial Gen2 Test',
        dob: new Date(),
        status: 'NEW',
      }
    });
    customerId = customer.id;
    const app = await prisma.nenkinApplication.create({
      data: {
        customerId: customer.id,
        status: 'DRAFT'
      }
    });
    appId = app.id;
  });

  test.afterAll(async () => {
    if (appId) {
      await prisma.nenkinApplication.deleteMany({ where: { id: appId } });
    }
    if (customerId) {
      await prisma.customer.deleteMany({ where: { id: customerId } });
    }
    await prisma.$disconnect();
  });

  test('generate-doc: prototype pollution on templateType yields 400', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appId, templateType: 'constructor' }
    });
    expect(res.status()).toBe(400); 
  });

  test('generate-doc: applicationId as object causes Prisma validation error', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: { contains: "foo" }, templateName: "LAN1_DATTAI" }
    });
    expect(res.status()).toBe(400);
  });

  test('generate-doc: templateName as array causes path.basename TypeError', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appId, templateName: ["LAN1_DATTAI"] }
    });
    expect(res.status()).toBe(400);
  });

  test('onboarding: ref as object causes Prisma validation error', async ({ request }) => {
    const res = await request.post('/api/onboarding', {
      data: { 
        fullName: "Test",
        ref: { contains: "admin" } 
      }
    });
    expect(res.status()).toBe(400);
  });

  test('onboarding: invalid dob causes Prisma validation error', async ({ request }) => {
    const res = await request.post('/api/onboarding', {
      data: { 
        fullName: "Test",
        dob: "Not a valid date"
      }
    });
    expect(res.status()).toBe(400);
  });
});
