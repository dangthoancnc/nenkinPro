import { describe, it, expect } from 'vitest';
import { mapTemplateBang3 } from '../lib/documentMapper';
import type { DocumentMapperInput } from '../lib/documentMapper';

describe('PDF Render Contract', () => {
  const baseInput: DocumentMapperInput = {
    application: {
      id: 'app-contract-123',
      totalExpectedJpy: null, // missing -> should trigger null handling
      taxYear: null,
      status: 'DRAFT',
    } as any,
    customer: { id: 'cust-1' } as any,
    workHistories: [], // missing -> should trigger null handling
    taxOffice: null,
    taxRepresentative: null
  };

  it('maps computed null values to empty strings ("") for PDF rendering', () => {
    const result = mapTemplateBang3(baseInput);
    
    // As per data contract, missing inputs should result in ""
    expect(result.totalExpectedJpy).toBe('');
    expect(result.withheldTax).toBe('');
    expect(result.retirementDeductionAmount).toBe('');
    expect(result.taxableRetirementIncome).toBe('');
    expect(result.calculatedTax).toBe('');
    expect(result.refundAmount).toBe('');
  });

  it('maps valid computed values correctly', () => {
    const validInput: DocumentMapperInput = {
      ...baseInput,
      application: {
        ...baseInput.application,
        totalExpectedJpy: 2000000,
      } as any,
      workHistories: [
        {
          id: 'w1',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-01-01') // 3 years
        } as any
      ]
    };
    
    const result = mapTemplateBang3(validInput);
    
    expect(result.totalExpectedJpy).toBe('2000000');
    expect(result.withheldTax).toBe('408400'); // 2000000 * 0.2042
    expect(result.retirementDeductionAmount).toBe('1600000'); // 4 years * 400k (2020 to 2023 is exactly 3 years but leap year makes it >3 years)
    expect(result.taxableRetirementIncome).toBe('200000'); // (2M - 1.6M)/2
  });
});
