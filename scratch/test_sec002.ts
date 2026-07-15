import { validateSession, createSession } from '../src/lib/auth/session';
import { requireCustomerAccess, requireRole, requireApplicationAccess } from '../src/lib/auth/authorization';
import prisma from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth/password';

async function run() {
  console.log("Creating test users...");
  const p1 = await hashPassword('password123');
  
  // Create an ADMIN and a COLLABORATOR
  const admin = await prisma.user.create({
    data: { email: `admin_${Date.now()}@test.com`, password: p1, name: 'Admin', role: 'ADMIN', staffCode: 'AD_TEST' }
  });
  const collab1 = await prisma.user.create({
    data: { email: `collab1_${Date.now()}@test.com`, password: p1, name: 'Collab 1', role: 'COLLABORATOR', staffCode: 'COL_1' }
  });
  const collab2 = await prisma.user.create({
    data: { email: `collab2_${Date.now()}@test.com`, password: p1, name: 'Collab 2', role: 'COLLABORATOR', staffCode: 'COL_2' }
  });

  // Create customers
  const c1 = await prisma.customer.create({
    data: {
      code: `KH_TEST1_${Date.now()}`,
      fullName: 'Customer Collab 1',
      createdById: collab1.id
    }
  });

  const c2 = await prisma.customer.create({
    data: {
      code: `KH_TEST2_${Date.now()}`,
      fullName: 'Customer Collab 2',
      createdById: collab2.id
    }
  });

  // Create Application
  const app2 = await prisma.nenkinApplication.create({
    data: {
      customerId: c2.id,
      status: 'DRAFT'
    }
  });

  console.log("Mocking getSessionCookie globally for testing...");
  const mockTokens: Record<string, string> = {};
  
  mockTokens[admin.id] = await createSession(admin.id);
  mockTokens[collab1.id] = await createSession(collab1.id);
  mockTokens[collab2.id] = await createSession(collab2.id);

  const cookiesMod = require('../src/lib/auth/cookies');
  let currentToken = '';
  cookiesMod.getSessionCookie = async () => currentToken;

  console.log("\n--- Test 1: Cross-Owner Customer Access ---");
  currentToken = mockTokens[collab1.id];
  let res = await requireCustomerAccess(c2.id);
  console.assert(res.error?.status === 403, "Expected 403 Forbidden for Collab 1 accessing Collab 2's customer");
  console.log("Pass: Cross-owner customer access blocked");

  currentToken = mockTokens[collab2.id];
  res = await requireCustomerAccess(c2.id);
  console.assert(res.customer?.id === c2.id, "Expected success for Collab 2 accessing own customer");
  console.log("Pass: Own customer access allowed");

  currentToken = mockTokens[admin.id];
  res = await requireCustomerAccess(c2.id);
  console.assert(res.customer?.id === c2.id, "Expected success for Admin accessing any customer");
  console.log("Pass: Admin customer access allowed");

  console.log("\n--- Test 2: Cross-Owner App Access (Doc Gen) ---");
  currentToken = mockTokens[collab1.id];
  let appRes = await requireApplicationAccess(app2.id);
  console.assert(appRes.error?.status === 403, "Expected 403 Forbidden for Collab 1 accessing App 2");
  console.log("Pass: Cross-owner app access blocked");

  currentToken = mockTokens[collab2.id];
  appRes = await requireApplicationAccess(app2.id);
  console.assert(appRes.application?.id === app2.id, "Expected success for Collab 2 accessing own App");
  console.log("Pass: Own app access allowed");

  console.log("\n--- Test 3: Admin Exclusivity (HR routes) ---");
  currentToken = mockTokens[collab1.id];
  let roleRes = await requireRole(['ADMIN']);
  console.assert(roleRes.error?.status === 403, "Expected 403 Forbidden for Collab 1 accessing Admin route");
  console.log("Pass: Collab admin access blocked");

  currentToken = mockTokens[admin.id];
  roleRes = await requireRole(['ADMIN']);
  console.assert(roleRes.user?.id === admin.id, "Expected success for Admin accessing Admin route");
  console.log("Pass: Admin access allowed");

  console.log("\nAll tests passed!");
}

run().catch(console.error).finally(() => process.exit(0));
