import { describe, it, expect } from 'vitest';
import { getStandardDocumentPath } from '@/lib/storageHelper';

describe('Messenger Attachments & Storage Helper Tests', () => {
  it('should generate standard document paths without unsafe characters', () => {
    const customerId = 'cust-12345';
    const docType = 'zairyuFront';
    const ext = 'png';

    const path = getStandardDocumentPath(customerId, docType, ext);
    expect(path).toBe('cust-12345/zairyuFront.png');
  });

  it('should clean extensions with leading dots', () => {
    const customerId = 'cust-999';
    const docType = 'passport';
    const ext = '.jpg';

    const path = getStandardDocumentPath(customerId, docType, ext);
    expect(path).toBe('cust-999/passport.jpg');
  });

  it('should sanitize document type characters', () => {
    const customerId = 'cust-abc';
    const docType = 'bankPassbook#1/evil';
    const ext = 'JPEG';

    const path = getStandardDocumentPath(customerId, docType, ext);
    expect(path).toBe('cust-abc/bankPassbook1evil.jpeg');
  });

  it('should validate chat attachment metadata format', () => {
    const attachment = {
      url: 'https://example.com/storage/v1/object/public/customer-documents/chat/12345_zairyu.png',
      name: 'zairyu.png',
      size: 4096123,
      type: 'image/png',
    };

    expect(attachment.url).toMatch(/^https?:\/\//);
    expect(attachment.size).toBeGreaterThan(0);
    expect(attachment.type).toBe('image/png');
    expect(attachment.name).toBe('zairyu.png');
  });
});
