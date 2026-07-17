import { describe, it, expect, vi } from 'vitest';
import { mapTemplateBang3, mapTemplate1, mapTemplate3 } from '../lib/documentMapper';
import type { DocumentMapperInput } from '../lib/documentMapper';

describe('documentMapper', () => {
  const baseInput: DocumentMapperInput = {
    application: {
      id: 'app-123',
      totalExpectedJpy: 2000000,
      taxYear: 8,
      status: 'DRAFT',
      // ...other required fields mock
    } as any,
    customer: {
      id: 'cust-123',
      departureDate: new Date('2026-05-10T00:00:00Z'),
    } as any,
    workHistories: [
      {
        id: 'work-1',
        companyName: 'Company A',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2026-01-01T00:00:00Z'), // 3 years
      } as any
    ],
    taxOffice: null,
    taxRepresentative: null
  };

  it('mapTemplateBang3 does not output undefined/null, but empty strings for missing tax fields', () => {
    const inputMissing = {
      ...baseInput,
      application: { ...baseInput.application, totalExpectedJpy: null } as any
    };
    const result = mapTemplateBang3(inputMissing);
    
    expect(result.taxableRetirementIncome).toBe('');
    expect(result.calculatedTax).toBe('');
    expect(result.totalExpectedJpy).toBe('');
  });

  it('mapTemplate1 has consistent aliases for work history', () => {
    const result = mapTemplate1(baseInput);
    expect(result['workHistory_1_companyName']).toBe('Company A');
    expect(result['work_company_1']).toBe('Company A');
    // Start date checks (it produces split values)
    expect(result['workHistory_1_start_y_1']).toBeDefined();
  });

  it('mapTemplate3 has consistent aliases for departure date', () => {
    const result = mapTemplate3(baseInput);
    expect(result['departureDate_y']).toBeDefined();
    expect(result['departure_y']).toBe(result['departureDate_y']);
  });

  it('injects today and doc_date tags properly', () => {
    const result = mapTemplate1(baseInput);
    expect(result['today_y']).toBeDefined();
    expect(result['doc_date_era_jp']).toBe('令和');
  });
});
