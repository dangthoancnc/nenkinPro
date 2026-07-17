export interface TaxCalculationInput {
  totalExpectedJpy: number | null | undefined;
  workYears: number | null | undefined;
}

export interface TaxCalculationResult {
  withheldTax: number | null;
  retirementDeductionAmount: number | null;
  taxableRetirementIncome: number | null;
  calculatedTax: number | null;
  refundAmount: number | null;
  missingInputs: string[];
}

export function calculateNenkinTax(input: TaxCalculationInput): TaxCalculationResult {
  const missingInputs: string[] = [];
  
  if (input.totalExpectedJpy == null || isNaN(input.totalExpectedJpy)) {
    missingInputs.push('totalExpectedJpy');
  }
  
  if (input.workYears == null || isNaN(input.workYears) || input.workYears <= 0) {
    missingInputs.push('workYears');
  }

  // Nếu thiếu đầu vào, return result kèm missingInputs và values = null
  if (missingInputs.length > 0) {
    return {
      withheldTax: null,
      retirementDeductionAmount: null,
      taxableRetirementIncome: null,
      calculatedTax: null,
      refundAmount: null,
      missingInputs
    };
  }

  const expected = input.totalExpectedJpy as number;
  const years = input.workYears as number;

  // Thuế đã khấu trừ (mặc định 20.42%)
  const withheldTax = Math.floor(expected * 0.2042);

  // Mức giảm trừ hưu trí (Retirement Deduction)
  // Tính theo luật: 40 vạn yên × số năm làm việc (tối thiểu 1 năm, làm tròn lên)
  const retirementDeductionAmount = Math.max(1, Math.ceil(years)) * 400000;

  // Thu nhập chịu thuế hưu trí (Taxable Retirement Income)
  // Theo luật hưu trí Nhật: (Thu nhập - Giảm trừ) × 1/2
  // Nếu < 0 thì = 0
  const taxableRetirementIncome = Math.floor(Math.max(0, expected - retirementDeductionAmount) / 2);
  
  // Thuế suất lũy tiến
  let calculatedTax: number;
  if (taxableRetirementIncome <= 1_950_000) {
    calculatedTax = Math.floor(taxableRetirementIncome * 0.05);
  } else if (taxableRetirementIncome <= 3_300_000) {
    calculatedTax = Math.floor(taxableRetirementIncome * 0.10 - 97_500);
  } else if (taxableRetirementIncome <= 6_950_000) {
    calculatedTax = Math.floor(taxableRetirementIncome * 0.20 - 427_500);
  } else if (taxableRetirementIncome <= 9_000_000) {
    calculatedTax = Math.floor(taxableRetirementIncome * 0.23 - 636_000);
  } else if (taxableRetirementIncome <= 17_999_000) {
    calculatedTax = Math.floor(taxableRetirementIncome * 0.33 - 1_536_000);
  } else if (taxableRetirementIncome <= 39_999_000) {
    calculatedTax = Math.floor(taxableRetirementIncome * 0.40 - 2_796_000);
  } else {
    calculatedTax = Math.floor(taxableRetirementIncome * 0.45 - 4_796_000);
  }

  // Thuế phục hồi (Reconstruction income tax) = calculatedTax * 2.1%
  // Cần cộng thêm 2.1% thuế phục hồi vào calculatedTax
  const finalCalculatedTax = Math.floor(calculatedTax * 1021 / 1000);

  const refundAmount = withheldTax - finalCalculatedTax;

  return {
    withheldTax,
    retirementDeductionAmount,
    taxableRetirementIncome,
    calculatedTax: finalCalculatedTax,
    refundAmount,
    missingInputs
  };
}
