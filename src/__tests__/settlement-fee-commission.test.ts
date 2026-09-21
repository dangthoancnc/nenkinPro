import { describe, it, expect } from 'vitest';
import { generateSettlementTemplates } from '../lib/settlementCalculator';
import { applicationSchema } from '../lib/validations/workspaceSchema';
import { completedSchema } from '../lib/validations/applicationSchema';

describe('Settlement Fee (5% L2) and Commission Calculation', () => {
  it('calculates 5% default fee of 2nd payment when serviceFeeJpy is omitted', () => {
    // Expected total 1,000,000 JPY -> withheld tax 20.42% = 204,200 JPY
    // 5% of 204,200 = 10,210 JPY
    const templates = generateSettlementTemplates({
      customerName: 'Nguyễn Văn A',
      customerCode: 'TEST001',
      totalExpectedJpy: 1000000,
      received2ndJpy: 204200,
      exchangeRate: 165,
    });

    expect(templates.template2nd).toContain('204,200 ¥');
    expect(templates.template2nd).toContain('10,210 ¥'); // 5% fee
    expect(templates.template2nd).toContain('193,990 ¥'); // 204,200 - 10,210
  });

  it('respects custom override fee and discounts when provided', () => {
    const templates = generateSettlementTemplates({
      customerName: 'Trần Thị B',
      customerCode: 'TEST002',
      received2ndJpy: 200000,
      serviceFeeJpy: 5000, // Custom discounted fee
      exchangeRate: 160,
    });

    expect(templates.template2nd).toContain('5,000 ¥');
    expect(templates.template2nd).toContain('195,000 ¥'); // 200,000 - 5,000
  });

  it('validates workspaceSchema applicationSchema with referralBonusJpy and referralDiscountJpy', () => {
    const parsed = applicationSchema.safeParse({
      serviceFeeJpy: 10000,
      exchangeRate: 165.5,
      serviceFeeVnd: 1655000,
      referralBonusJpy: 2000,
      referralDiscountJpy: 1000,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.referralBonusJpy).toBe(2000);
      expect(parsed.data.referralDiscountJpy).toBe(1000);
    }
  });

  it('validates completedSchema with referralBonusJpy', () => {
    const parsed = completedSchema.safeParse({
      fullName: 'Nguyễn Văn A',
      dob: '1995-01-01',
      address: 'Tokyo, Japan',
      zairyuFrontUrl: 'https://example.com/front.jpg',
      zairyuBackUrl: 'https://example.com/back.jpg',
      passportUrl: 'https://example.com/pass.jpg',
      nenkinBookUrl: 'https://example.com/book.jpg',
      applyDate: '2026-01-01',
      nenkinNumber: '1234567890',
      noticeDate: '2026-03-01',
      noticeImageUrl: 'https://example.com/notice.jpg',
      totalExpectedJpy: 1000000,
      received1stJpy: 800000,
      taxRepresentativeId: 'tax-rep-1',
      sent2ndDate: '2026-04-01',
      received2ndDate: '2026-09-20',
      received2ndJpy: 150000,
      tax2ndJpy: 150000,
      serviceFeeJpy: 7500,
      exchangeRate: 165,
      serviceFeeVnd: 1237500,
      referralBonusJpy: 2000,
    });

    expect(parsed.success).toBe(true);
  });
});
