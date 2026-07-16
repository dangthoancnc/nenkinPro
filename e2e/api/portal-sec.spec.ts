import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';

let prisma: PrismaClient;
let supabaseAdmin: ReturnType<typeof createClient>;

// We use the same connection setup as global-setup.ts
test.beforeAll(async () => {
  supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });

  // Ensure bucket and test file exist
  const { error: bucketError } = await supabaseAdmin.storage.createBucket('nenkin-documents', { public: false });
  // Ignore error if bucket already exists
  if (bucketError && !bucketError.message.includes('already exists') && !bucketError.message.includes('row-level security policy')) {
    // Optionally log or handle it, but wait for upload verification
  }

  const { data, error: uploadError } = await supabaseAdmin.storage.from('nenkin-documents').upload('test-zairyu.jpg', Buffer.from('test'), { upsert: true });
  
  if (uploadError) {
    throw new Error(`Failed to upload test file: ${uploadError.message}`);
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe('Portal Security Tests (SEC-003 & SEC-004)', () => {
  let customerId: string;
  let staffCode: string;
  let customerCode: string;
  
  test.beforeEach(async () => {
    // 1. Tạo một TaxOffice và TaxRepresentative giả nếu cần thiết
    const taxOffice = await prisma.taxOffice.create({
      data: {
        name: 'Test Sec Office',
        address: '123 Sec St',
        postalCode: '100-0001',
      }
    });
    
    // 2. Tạo một User (Staff) giả để lấy staffCode
    const myStaffCode = `STF${Date.now()}`;
    const staff = await prisma.user.create({
      data: {
        email: `sec-staff-${Date.now()}@example.com`,
        password: 'password',
        name: 'Sec Staff',
        staffCode: myStaffCode,
      }
    });
    staffCode = myStaffCode;
    
    // 3. Chuẩn bị customerCode cho register
    customerCode = `SEC-CUST-${Date.now()}`;
  });

  test.afterEach(async () => {
    // Clean up sessions first
    const testCustomers = await prisma.customer.findMany({
      where: { cardNumber: customerCode }
    });
    for (const c of testCustomers) {
      await prisma.customerSession.deleteMany({
        where: { customerId: c.id }
      });
    }
    // Cleanup the customer
    await prisma.customer.deleteMany({
      where: { cardNumber: customerCode }
    });
    
    await prisma.user.deleteMany({ where: { staffCode: staffCode } });
    await prisma.taxOffice.deleteMany({ where: { name: 'Test Sec Office' } });
  });
  test('[TC-01] Đăng ký thành công (Onboarding)', async ({ request }) => {
    const res = await request.post('/api/portal/auth/register', {
      data: {
        action: 'register',
        cardNumber: customerCode,
        fullName: 'Test Sec Customer',
        staffCode,
        passwordPin: '123456'
      }
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Kiểm tra cookie nenkin_customer_session
    const cookies = res.headers()['set-cookie'];
    expect(cookies).toContain('nenkin_customer_session=');
    expect(cookies).toContain('HttpOnly');
    
    // Kiểm tra PIN đã được băm Argon2 trong DB
    const dbCustomer = await prisma.customer.findFirst({ where: { cardNumber: customerCode } });
    expect(dbCustomer?.passwordPin).toMatch(/^\$argon2/);
    expect(dbCustomer?.pinResetRequired).toBe(false);
  });

  test('[TC-02] Đăng nhập & Chống Brute-force', async ({ request }) => {
    // Đầu tiên, đăng ký để có mã PIN
    await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });

    // Thử sai PIN 5 lần
    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/portal/auth/login', {
        data: { action: 'login', cardNumber: customerCode, passwordPin: '000000' }
      });
      expect(res.status()).toBe(401);
    }

    // Lần 6 phải trả về 429
    const resBlocked = await request.post('/api/portal/auth/login', {
      data: { action: 'login', cardNumber: customerCode, passwordPin: '000000' }
    });
    expect(resBlocked.status()).toBe(429);
  });

  test('[TC-03] Chặn khách cũ chưa reset PIN', async ({ request }) => {
    // Đăng ký trước
    await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });
    
    // Set pinResetRequired = true
    await prisma.customer.updateMany({
      where: { cardNumber: customerCode },
      data: { pinResetRequired: true }
    });

    // Cố tình đăng nhập bằng mã PIN hợp lệ
    const res = await request.post('/api/portal/auth/login', {
      data: { action: 'login', cardNumber: customerCode, passwordPin: '123456' }
    });
    expect(res.status()).toBe(403);
    const data = await res.json();
    expect(data.requireReset).toBe(true);
  });

  test('[TC-04] Đăng nhập thành công & Hủy Session cũ (Single Active Session)', async ({ request }) => {
    // Đăng ký trước
    const regRes = await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });
    
    const dbCustomer = await prisma.customer.findFirst({ where: { cardNumber: customerCode } });
    const customerIdLocal = dbCustomer!.id;

    // Kiểm tra có 1 session trong DB
    const sessionsBefore = await prisma.customerSession.findMany({ where: { customerId: customerIdLocal } });
    expect(sessionsBefore.length).toBe(1);
    expect(sessionsBefore[0].revokedAt).toBeNull();

    // Đăng nhập thiết bị thứ 2
    const loginRes = await request.post('/api/portal/auth/login', {
      data: { action: 'login', cardNumber: customerCode, passwordPin: '123456' }
    });
    expect(loginRes.status()).toBe(200);

    // Session cũ bị revoke, session mới tạo ra
    const sessionsAfter = await prisma.customerSession.findMany({ 
      where: { customerId: customerIdLocal },
      orderBy: { createdAt: 'desc' }
    });
    expect(sessionsAfter.length).toBe(2);
    // Session cũ nhất bị revoke
    const oldSession = sessionsAfter.find(s => s.id === sessionsBefore[0].id);
    expect(oldSession?.revokedAt).not.toBeNull();
    // Session mới nhất vẫn active
    const newSession = sessionsAfter.find(s => s.id !== sessionsBefore[0].id);
    expect(newSession?.revokedAt).toBeNull();
  });

  test('[TC-05] Data Policy của Endpoint /me', async ({ request }) => {
    await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });

    await prisma.customer.updateMany({
      where: { cardNumber: customerCode },
      data: { zairyuFrontUrl: '/storage/v1/object/public/nenkin-documents/test-zairyu.jpg' }
    });

    const res = await request.get('/api/portal/auth/me');
    expect(res.status()).toBe(200);
    const data = await res.json();
    
    const customerDto = data.customer;
    // Không chứa dữ liệu nhạy cảm
    expect(customerDto.myNumber).toBeUndefined();
    expect(customerDto.nenkinNumber).toBeUndefined();
    expect(customerDto.passwordPin).toBeUndefined();
    expect(customerDto.zairyuFrontUrl).toBeUndefined();
    
    // Kiểm tra cờ boolean uploadedDocuments
    expect(customerDto.uploadedDocuments).toBeDefined();
    expect(customerDto.uploadedDocuments.zairyuFront).toBe(true);
    expect(customerDto.uploadedDocuments.passport).toBe(false);
  });

  test('[TC-06] Lấy Signed URL Hợp lệ', async ({ request }) => {
    await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });

    await prisma.customer.updateMany({
      where: { cardNumber: customerCode },
      data: { zairyuFrontUrl: '/storage/v1/object/public/nenkin-documents/test-zairyu.jpg' }
    });

    const res = await request.get('/api/portal/documents/zairyuFront/signed-url');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.signedUrl).toContain('token=');
  });

  test('[TC-07] Chặn Path Traversal/Injection', async ({ request }) => {
    await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });

    const res = await request.get('/api/portal/documents/invalidColumnName/signed-url');
    expect(res.status()).toBe(400);
  });

  test('[TC-08] Cross-owner ngăn chặn truy cập chéo', async ({ request }) => {
    // Đăng ký
    await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });

    // Thử lấy document mà customer này không có file (passportUrl)
    const res = await request.get('/api/portal/documents/passport/signed-url');
    expect(res.status()).toBe(404);
  });

  test('[TC-09] Đăng xuất & Vô hiệu hóa Token', async ({ request }) => {
    await request.post('/api/portal/auth/register', {
      data: { action: 'register', cardNumber: customerCode, fullName: 'Test Sec Customer', staffCode, passwordPin: '123456' }
    });

    const logoutRes = await request.post('/api/portal/auth/logout');
    expect(logoutRes.status()).toBe(200);
    
    // Check DB session is revoked
    const dbCustomer = await prisma.customer.findFirst({ where: { cardNumber: customerCode } });
    const sessions = await prisma.customerSession.findMany({ where: { customerId: dbCustomer?.id } });
    expect(sessions[sessions.length - 1].revokedAt).not.toBeNull();

    // Call /me should fail
    const meRes = await request.get('/api/portal/auth/me');
    expect(meRes.status()).toBe(401);
  });
});
