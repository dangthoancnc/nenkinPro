import { describe, it, expect } from 'vitest';
import { calculateNenkinTax } from '../lib/taxCalculator';

describe('calculateNenkinTax', () => {
  it('returns nulls and lists missing inputs when totalExpectedJpy is missing', () => {
    const result = calculateNenkinTax({ totalExpectedJpy: null, workYears: 3 });
    expect(result.missingInputs).toContain('totalExpectedJpy');
    expect(result.calculatedTax).toBeNull();
    expect(result.refundAmount).toBeNull();
  });

  it('returns nulls and lists missing inputs when workYears is missing or 0', () => {
    const result0 = calculateNenkinTax({ totalExpectedJpy: 1000000, workYears: 0 });
    expect(result0.missingInputs).toContain('workYears');
    expect(result0.calculatedTax).toBeNull();
    
    const resultNull = calculateNenkinTax({ totalExpectedJpy: 1000000, workYears: null });
    expect(resultNull.missingInputs).toContain('workYears');
    expect(resultNull.calculatedTax).toBeNull();
  });

  it('handles negative or zero totalExpectedJpy by producing 0 taxable income', () => {
    const result = calculateNenkinTax({ totalExpectedJpy: -500, workYears: 2 });
    expect(result.missingInputs).toHaveLength(0);
    expect(result.taxableRetirementIncome).toBe(0);
    expect(result.calculatedTax).toBe(0);
  });

  it('calculates correctly for a valid input (Case 1)', () => {
    // 3.5 years -> rounded to 4 years -> deduction = 1.6M
    // expected = 2M -> taxable = (2M - 1.6M)/2 = 200,000
    // tax = 200,000 * 5% = 10,000. Final tax = 10,000 * 1.021 = 10,210
    const result = calculateNenkinTax({ totalExpectedJpy: 2000000, workYears: 3.5 });
    
    expect(result.retirementDeductionAmount).toBe(1600000);
    expect(result.taxableRetirementIncome).toBe(200000);
    expect(result.calculatedTax).toBe(10210);
    
    // Withheld = 2M * 0.2042 = 408400
    expect(result.withheldTax).toBe(408400);
    expect(result.refundAmount).toBe(408400 - 10210);
  });

  it('calculates correctly for high income (progress tax bracket)', () => {
    // 4 years -> deduction = 1.6M
    // expected = 10M -> taxable = (10M - 1.6M)/2 = 4.2M
    // Bracket: 3.3M to 6.95M -> 20% - 427,500
    // Tax = 4.2M * 0.2 - 427,500 = 840,000 - 427,500 = 412,500
    // Final tax = 412,500 * 1.021 = 421,162
    const result = calculateNenkinTax({ totalExpectedJpy: 10000000, workYears: 4 });
    expect(result.taxableRetirementIncome).toBe(4200000);
    expect(result.calculatedTax).toBe(421162);
  });
});
