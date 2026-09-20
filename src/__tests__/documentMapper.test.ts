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

  it('mapTemplate3 correctly marks address_tax_mark based on taxAddressType', () => {
    // Default JUSHO
    const resJusho = mapTemplate3(baseInput);
    expect(resJusho.address_tax_mark).toBe('○');
    expect(resJusho.tax_residence_mark).toBe('');
    expect(resJusho.tax_business_mark).toBe('');

    // KYOSHO
    const resKyosho = mapTemplate3({
      ...baseInput,
      application: { ...baseInput.application, taxAddressType: 'KYOSHO' } as any
    });
    expect(resKyosho.address_tax_mark).toBe('');
    expect(resKyosho.tax_residence_mark).toBe('○');
    expect(resKyosho.tax_business_mark).toBe('');

    // JIGYOSHO
    const resJigyo = mapTemplate3({
      ...baseInput,
      application: { ...baseInput.application, taxAddressType: 'JIGYOSHO' } as any
    });
    expect(resJigyo.address_tax_mark).toBe('');
    expect(resKyosho.tax_residence_mark).toBe('○');
    expect(resJigyo.tax_business_mark).toBe('○');
  });

  it('mapTemplate1 maps bankBranchCity properly', () => {
    const inputWithBankCity = {
      ...baseInput,
      customer: {
        ...baseInput.customer,
        bankAccounts: [
          {
            purpose: 'FIRST_REFUND',
            bankCountry: 'VIETNAM',
            bankName: 'VCB',
            branchName: 'Bac Giang',
            bankBranchAddress: 'Song Khe',
            bankBranchCity: 'BAC NINH',
          }
        ]
      } as any
    };
    const result = mapTemplate1(inputWithBankCity);
    expect(result.bankBranchCity).toBe('BAC NINH');
    expect(result.bank1st_branchCity).toBe('BAC NINH');
  });
});
