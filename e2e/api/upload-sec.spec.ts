import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma: PrismaClient;

test.beforeAll(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe('SEC-005 Document Upload API Security', () => {
  test.afterEach(async () => {
    await prisma.ocrResult.deleteMany({});
    await prisma.nenkinApplication.deleteMany({});
    await prisma.customer.deleteMany({});
  });

  test('[TC-01] Cho phép upload tệp JPEG hợp lệ', async ({ request }) => {
    // Fake a valid JPEG using magic bytes FF D8 FF E0
    const fakeJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const response = await request.post('/api/ocr', {
      multipart: {
        source: 'onboarding',
        documentType: 'zairyuFront',
        action: 'upload',
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: fakeJpeg
        }
      }
    });

    // 200 OK
    const data = await response.json();
    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    // Ensure path has format: anonymous/zairyuFront/[timestamp]_[uuid].jpg
    expect(data.publicUrl).toMatch(/anonymous\/zairyuFront\/\d+_[0-9a-f-]+\.jpg/);
  });

  test('[TC-02] Chặn tệp văn bản mạo danh .jpg', async ({ request }) => {
    // Fake file with .jpg extension but text content
    const textBuffer = Buffer.from('this is not an image');
    const response = await request.post('/api/ocr', {
      multipart: {
        source: 'onboarding',
        documentType: 'zairyuFront',
        action: 'upload',
        file: {
          name: 'malicious.jpg',
          mimeType: 'image/jpeg',
          buffer: textBuffer
        }
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Định dạng tệp không hợp lệ');
  });

  test('[TC-03] Chặn tệp vượt quá 5MB', async ({ request }) => {
    // Create a 6MB dummy buffer (bypassing full payload by using a simple large buffer)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    const response = await request.post('/api/ocr', {
      multipart: {
        source: 'onboarding',
        documentType: 'zairyuFront',
        action: 'upload',
        file: {
          name: 'large.jpg',
          mimeType: 'image/jpeg',
          buffer: largeBuffer
        }
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Kích thước tệp tin vượt quá 5MB');
  });

  test('[TC-05] Ngăn chặn Path Traversal qua documentType', async ({ request }) => {
    const fakeJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const response = await request.post('/api/ocr', {
      multipart: {
        source: 'onboarding',
        documentType: '../../etc/passwd',
        action: 'upload',
        file: {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          buffer: fakeJpeg
        }
      }
    });

    // Bị chặn vì không nằm trong whitelist
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Loại tài liệu không hợp lệ');
  });

  test('[TC-04] Spam upload liên tục (Rate Limit)', async ({ request }) => {
    const fakeJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    let lastStatus = 200;
    
    // Max is 20, so 21st should fail
    for (let i = 0; i < 22; i++) {
      const response = await request.post('/api/ocr', {
        multipart: {
          source: 'onboarding',
          documentType: 'zairyuFront',
          action: 'upload',
          file: {
            name: `spam${i}.jpg`,
            mimeType: 'image/jpeg',
            buffer: fakeJpeg
          }
        }
      });
      lastStatus = response.status();
      if (lastStatus === 429) break;
    }

    expect(lastStatus).toBe(429);
  });
});
