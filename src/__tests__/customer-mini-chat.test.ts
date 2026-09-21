import { describe, it, expect } from 'vitest';

describe('Customer Mini Chat System Tests', () => {
  it('should validate customer support message payload structure', () => {
    const payload = {
      conversationId: 'conv-12345',
      customerId: 'cust-67890',
      content: 'Chào chuyên viên, tôi muốn hỏi về tình trạng hồ sơ',
      attachments: [],
    };

    expect(payload.conversationId).toBeDefined();
    expect(payload.customerId).toBeDefined();
    expect(payload.content.trim().length).toBeGreaterThan(0);
    expect(Array.isArray(payload.attachments)).toBe(true);
  });

  it('should format sender names correctly based on role', () => {
    const formatSender = (isStaff: boolean, staffName?: string, customerName?: string) => {
      if (isStaff) {
        return staffName || 'Chuyên viên VietNenkin';
      }
      return customerName || 'Bạn';
    };

    expect(formatSender(false, undefined, 'THAN VAN TUAN')).toBe('THAN VAN TUAN');
    expect(formatSender(true, 'Nguyễn Văn A')).toBe('Nguyễn Văn A');
    expect(formatSender(true)).toBe('Chuyên viên VietNenkin');
  });

  it('should handle image attachments correctly', () => {
    const isImageAttachment = (att: { url: string; type?: string }) => {
      return (att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url)) ?? false;
    };

    expect(isImageAttachment({ url: 'https://example.com/doc.jpg', type: 'image/jpeg' })).toBe(true);
    expect(isImageAttachment({ url: 'https://example.com/doc.png' })).toBe(true);
    expect(isImageAttachment({ url: 'https://example.com/contract.pdf', type: 'application/pdf' })).toBe(false);
  });

  it('should validate docked window dimension states', () => {
    const getWindowDimensions = (isMinimized: boolean, isMaximized: boolean) => {
      if (isMinimized) return { state: 'minimized', width: 280, height: 44 };
      if (isMaximized) return { state: 'maximized', width: 680, height: 740 };
      return { state: 'standard', width: 400, height: 520 };
    };

    expect(getWindowDimensions(true, false)).toEqual({ state: 'minimized', width: 280, height: 44 });
    expect(getWindowDimensions(false, false)).toEqual({ state: 'standard', width: 400, height: 520 });
    expect(getWindowDimensions(false, true)).toEqual({ state: 'maximized', width: 680, height: 740 });
  });
});
