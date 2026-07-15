import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import prisma from '../../src/lib/prisma';

test.describe('Adversarial Test Engineer 1 - Phase 2 Coverage Hardening', () => {
  let employeeId: string;
  let appId: string;
  let customerId: string;
  let existingCardNumber = 'TESTCARD' + Date.now();

  test.beforeAll(async () => {
    employeeId = process.env.TEST_EMPLOYEE_ID || '12345678-1234-1234-1234-123456789012';
    
    const customer = await prisma.customer.create({
      data: {
        code: 'ADVG1-' + Date.now().toString().substring(5),
        fullName: 'Adversarial Gen 1',
        dob: new Date(),
        status: 'NEW',
        cardNumber: existingCardNumber
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

  test('generate-doc: Type confusion on templateName causes 500 internal server error', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { 
        applicationId: appId, 
        templateName: ["test.docx"] 
      }
    });
    expect(res.status()).toBe(400);
  });

  test('onboarding: Type confusion on ref field causes Prisma findUnique error and 500', async ({ request }) => {
    const res = await request.post('/api/onboarding', {
      data: { 
        fullName: 'Test Ref Injection',
        ref: { "contains": "A" } 
      }
    });
    expect(res.status()).toBe(400);
  });

  test('onboarding: Invalid dob string causes unhandled Invalid Date 500 error', async ({ request }) => {
    const res = await request.post('/api/onboarding', {
      data: { 
        fullName: 'Test Invalid Date',
        dob: 'invalid-date-string' 
      }
    });
    expect(res.status()).toBe(400);
  });

  test('onboarding: Duplicate cardNumber causes unhandled P2002 to leak as 500 instead of 400', async ({ request }) => {
    const res = await request.post('/api/onboarding', {
      data: { 
        fullName: 'Test Dup Card',
        cardNumber: existingCardNumber 
      }
    });
    expect(res.status()).toBe(400);
  });

  test('generate-doc: path traversal to non-docx file bypasses facade and causes PizZip 500 error', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { 
        applicationId: appId, 
        templateName: "extracted_fields.txt" 
      }
    });
    expect(res.status()).toBe(400);
  });
});

