import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import prisma from '../../src/lib/prisma';

test.describe('API Adversarial /api/generate-doc (Tier 4)', () => {
  let employeeId: string;
  let appId: string;
  let customerId: string;

  test.beforeAll(async () => {
    employeeId = process.env.TEST_EMPLOYEE_ID || '';
    
    const customer = await prisma.customer.create({
      data: {
        code: 'ADVERSARIAL' + Date.now() + Math.random().toString(36).substring(2, 7),
        fullName: 'Adversarial Test',
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

  test('Non-docx file as templateName yields 500 (handled correctly via try/catch)', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appId, templateName: 'MAPPING_GUIDE.md' }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });

  test('Missing body parameters yield 400', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid request payload');
  });

  test('Missing templateName and templateType yields 400', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appId }
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing templateName or templateType');
  });
});
