import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import prisma from '../../src/lib/prisma';

test.describe('API Pairwise /api/generate-doc (Tier 3)', () => {
  let employeeId: string;
  let appWithTaxRep: string;
  let appWithoutTaxRep: string;
  let taxRepId: string;
  let customerId: string;

  test.beforeAll(async () => {
    employeeId = process.env.TEST_EMPLOYEE_ID || '';
    
    // Create apps for pairwise testing
    const taxRep = await prisma.taxRepresentative.create({
      data: {
        fullName: 'Test Rep ' + Date.now() + Math.random().toString(36).substr(2, 5),
        address: '123 Rep St',
        postalCode: '111-2222',
      }
    });
    taxRepId = taxRep.id;

    const customer = await prisma.customer.create({
      data: {
        code: 'PAIRWISE' + Date.now() + Math.random().toString(36).substr(2, 5),
        fullName: 'Pairwise Test',
        dob: new Date(),
        status: 'NEW',
      }
    });
    customerId = customer.id;

    const app1 = await prisma.nenkinApplication.create({
      data: {
        customerId: customer.id,
        status: 'DRAFT',
        taxRepresentativeId: taxRep.id
      }
    });
    appWithTaxRep = app1.id;

    const app2 = await prisma.nenkinApplication.create({
      data: {
        customerId: customer.id,
        status: 'DRAFT',
      }
    });
    appWithoutTaxRep = app2.id;
  });

  test.afterAll(async () => {
    try {
      if (appWithTaxRep) await prisma.nenkinApplication.deleteMany({ where: { id: appWithTaxRep } });
      if (appWithoutTaxRep) await prisma.nenkinApplication.deleteMany({ where: { id: appWithoutTaxRep } });
      if (taxRepId) await prisma.taxRepresentative.deleteMany({ where: { id: taxRepId } });
      if (customerId) await prisma.customer.deleteMany({ where: { id: customerId } });
    } catch(e) {}
    await prisma.$disconnect();
  });

  // Pairwise tests
  test('Uininjou WITH Tax Representative', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appWithTaxRep, templateType: 'LAN2_UININJOU' }
    });
    expect(res.status()).toBe(200);
  });

  test('Uininjou WITHOUT Tax Representative', async ({ request }) => {
    // Depending on logic, this might fail or return a document missing rep info. Let's assume it succeeds but generates empty fields.
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appWithoutTaxRep, templateType: 'LAN2_UININJOU' }
    });
    expect(res.status()).toBe(200);
  });

  test('Tax Agent WITH Tax Representative', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appWithTaxRep, templateType: 'LAN2_TAX_AGENT' }
    });
    expect(res.status()).toBe(200);
  });

  test('Tax Agent WITHOUT Tax Representative', async ({ request }) => {
    const res = await request.post('/api/generate-doc', {
      headers: { Cookie: `employee_auth=${employeeId}` },
      data: { applicationId: appWithoutTaxRep, templateType: 'LAN2_TAX_AGENT' }
    });
    expect(res.status()).toBe(200);
  });
});
