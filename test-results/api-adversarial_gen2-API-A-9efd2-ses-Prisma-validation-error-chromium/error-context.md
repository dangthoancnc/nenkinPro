# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\adversarial_gen2.spec.ts >> API Adversarial Phase 2 (Tier 5) >> onboarding: invalid dob causes Prisma validation error
- Location: e2e\api\adversarial_gen2.spec.ts:77:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import * as dotenv from 'dotenv';
  3  | dotenv.config({ path: '.env.local' });
  4  | dotenv.config({ path: '.env' });
  5  | import prisma from '../../src/lib/prisma';
  6  | 
  7  | test.describe('API Adversarial Phase 2 (Tier 5)', () => {
  8  |   let employeeId: string;
  9  |   let appId: string;
  10 |   let customerId: string;
  11 | 
  12 |   test.beforeAll(async () => {
  13 |     employeeId = process.env.TEST_EMPLOYEE_ID || '';
  14 |     
  15 |     const customer = await prisma.customer.create({
  16 |       data: {
  17 |         code: 'ADV_GEN2_' + Date.now() + Math.random().toString(36).substring(2, 7),
  18 |         fullName: 'Adversarial Gen2 Test',
  19 |         dob: new Date(),
  20 |         status: 'NEW',
  21 |       }
  22 |     });
  23 |     customerId = customer.id;
  24 |     const app = await prisma.nenkinApplication.create({
  25 |       data: {
  26 |         customerId: customer.id,
  27 |         status: 'DRAFT'
  28 |       }
  29 |     });
  30 |     appId = app.id;
  31 |   });
  32 | 
  33 |   test.afterAll(async () => {
  34 |     if (appId) {
  35 |       await prisma.nenkinApplication.deleteMany({ where: { id: appId } });
  36 |     }
  37 |     if (customerId) {
  38 |       await prisma.customer.deleteMany({ where: { id: customerId } });
  39 |     }
  40 |     await prisma.$disconnect();
  41 |   });
  42 | 
  43 |   test('generate-doc: prototype pollution on templateType yields 400', async ({ request }) => {
  44 |     const res = await request.post('/api/generate-doc', {
  45 |       headers: { Cookie: `employee_auth=${employeeId}` },
  46 |       data: { applicationId: appId, templateType: 'constructor' }
  47 |     });
  48 |     expect(res.status()).toBe(400); 
  49 |   });
  50 | 
  51 |   test('generate-doc: applicationId as object causes Prisma validation error', async ({ request }) => {
  52 |     const res = await request.post('/api/generate-doc', {
  53 |       headers: { Cookie: `employee_auth=${employeeId}` },
  54 |       data: { applicationId: { contains: "foo" }, templateName: "LAN1_DATTAI" }
  55 |     });
  56 |     expect(res.status()).toBe(400);
  57 |   });
  58 | 
  59 |   test('generate-doc: templateName as array causes path.basename TypeError', async ({ request }) => {
  60 |     const res = await request.post('/api/generate-doc', {
  61 |       headers: { Cookie: `employee_auth=${employeeId}` },
  62 |       data: { applicationId: appId, templateName: ["LAN1_DATTAI"] }
  63 |     });
  64 |     expect(res.status()).toBe(400);
  65 |   });
  66 | 
  67 |   test('onboarding: ref as object causes Prisma validation error', async ({ request }) => {
  68 |     const res = await request.post('/api/onboarding', {
  69 |       data: { 
  70 |         fullName: "Test",
  71 |         ref: { contains: "admin" } 
  72 |       }
  73 |     });
  74 |     expect(res.status()).toBe(400);
  75 |   });
  76 | 
  77 |   test('onboarding: invalid dob causes Prisma validation error', async ({ request }) => {
  78 |     const res = await request.post('/api/onboarding', {
  79 |       data: { 
  80 |         fullName: "Test",
  81 |         dob: "Not a valid date"
  82 |       }
  83 |     });
> 84 |     expect(res.status()).toBe(400);
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  85 |   });
  86 | });
  87 | 
```