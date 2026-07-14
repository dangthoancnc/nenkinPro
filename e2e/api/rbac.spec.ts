import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../src/lib/auth/password';

const prisma = new PrismaClient();

test.describe('SEC-002: Session, RBAC, and Cross-owner access', () => {
  let adminCookie: string;
  let collab1Cookie: string;
  let collab2Cookie: string;
  
  let adminId: string;
  let collab1Id: string;
  let collab2Id: string;
  let customer2Id: string;
  let app2Id: string;

  test.beforeAll(async ({ request }) => {
    // 1. Setup test users in DB
    const p1 = await hashPassword('password123');
    
    const admin = await prisma.user.create({
      data: { email: `admin_e2e_${Date.now()}@test.com`, password: p1, name: 'Admin E2E', role: 'ADMIN', staffCode: `A_${Date.now()}` }
    });
    adminId = admin.id;

    const collab1 = await prisma.user.create({
      data: { email: `collab1_e2e_${Date.now()}@test.com`, password: p1, name: 'Collab 1 E2E', role: 'COLLABORATOR', staffCode: `C1_${Date.now()}` }
    });
    collab1Id = collab1.id;

    const collab2 = await prisma.user.create({
      data: { email: `collab2_e2e_${Date.now()}@test.com`, password: p1, name: 'Collab 2 E2E', role: 'COLLABORATOR', staffCode: `C2_${Date.now()}` }
    });
    collab2Id = collab2.id;

    const c2 = await prisma.customer.create({
      data: { code: `KH_E2E_${Date.now()}`, fullName: 'Customer E2E Collab 2', createdById: collab2.id }
    });
    customer2Id = c2.id;

    const app2 = await prisma.nenkinApplication.create({
      data: { customerId: c2.id, status: 'DRAFT' }
    });
    app2Id = app2.id;

    // 2. Perform logins to get cookies
    const loginAndGetCookie = async (email: string) => {
      const res = await request.post('/api/auth/employee/login', {
        data: { email, password: 'password123' }
      });
      const cookieHeader = res.headers()['set-cookie'];
      const match = cookieHeader?.match(/nenkin_staff_session=([^;]+)/);
      return match ? match[1] : '';
    };

    adminCookie = await loginAndGetCookie(admin.email);
    collab1Cookie = await loginAndGetCookie(collab1.email);
    collab2Cookie = await loginAndGetCookie(collab2.email);
  });

  test.afterAll(async () => {
    await prisma.nenkinApplication.deleteMany({ where: { id: app2Id } });
    await prisma.customer.deleteMany({ where: { id: customer2Id } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, collab1Id, collab2Id] } } });
  });

  test('Cross-owner Customer Access (403)', async ({ request }) => {
    // Collab 1 accessing Collab 2's customer should fail with 403
    const resForbidden = await request.get(`/api/customers/${customer2Id}`, {
      headers: { Cookie: `nenkin_staff_session=${collab1Cookie}` }
    });
    expect(resForbidden.status()).toBe(403);

    // Collab 2 accessing own customer should succeed (200)
    const resAllowed = await request.get(`/api/customers/${customer2Id}`, {
      headers: { Cookie: `nenkin_staff_session=${collab2Cookie}` }
    });
    expect(resAllowed.status()).toBe(200);

    // Admin accessing any customer should succeed (200)
    const resAdmin = await request.get(`/api/customers/${customer2Id}`, {
      headers: { Cookie: `nenkin_staff_session=${adminCookie}` }
    });
    expect(resAdmin.status()).toBe(200);
  });

  test('Cross-owner Application/Doc Generation (403)', async ({ request }) => {
    // Collab 1 accessing App 2 should fail
    const resForbidden = await request.get(`/api/applications/${app2Id}`, {
      headers: { Cookie: `nenkin_staff_session=${collab1Cookie}` }
    });
    expect(resForbidden.status()).toBe(403);

    // Collab 2 accessing App 2 should succeed
    const resAllowed = await request.get(`/api/applications/${app2Id}`, {
      headers: { Cookie: `nenkin_staff_session=${collab2Cookie}` }
    });
    expect(resAllowed.status()).toBe(200);
  });

  test('Admin Exclusivity (HR routes 403 for Collaborator)', async ({ request }) => {
    // Collab 1 accessing HR staffs should fail
    const resForbidden = await request.get('/api/hr/staffs', {
      headers: { Cookie: `nenkin_staff_session=${collab1Cookie}` }
    });
    expect(resForbidden.status()).toBe(403);

    // Admin accessing HR staffs should succeed
    const resAllowed = await request.get('/api/hr/staffs', {
      headers: { Cookie: `nenkin_staff_session=${adminCookie}` }
    });
    expect(resAllowed.status()).toBe(200);
  });

  test('Session Expiry/Revoke & Token Absence in JSON', async ({ request }) => {
    const res = await request.post('/api/auth/employee/login', {
      data: { email: `collab1_e2e_${Date.now()}@test.com`.replace(/[^a-zA-Z0-9@.]/g, ''), password: 'invalid' } // Just to test bad login
    });
    const data = await res.json();
    
    // Check that JSON response doesn't contain tokens or passwords
    expect(data.token).toBeUndefined();
    expect(data.password).toBeUndefined();
    
    // Revocation test (Logout)
    const resLogout = await request.post('/api/auth/employee/logout', {
      headers: { Cookie: `nenkin_staff_session=${collab1Cookie}` }
    });
    expect(resLogout.status()).toBe(200);

    // Access after logout should be 401
    const resAfterLogout = await request.get('/api/auth/employee/me', {
      headers: { Cookie: `nenkin_staff_session=${collab1Cookie}` }
    });
    expect(resAfterLogout.status()).toBe(401);
  });
});
