import { z } from 'zod';
import { customerSchema } from './customerSchema';

export const applicationSchema = z.object({
  status: z.string().nullable().optional(),
  applyDate: z.string().nullable().optional(),
  sent1stDate: z.string().nullable().optional(),
  received1stDate: z.string().nullable().optional(),
  sent2ndDate: z.string().nullable().optional(),
  received2ndDate: z.string().nullable().optional(),
  totalExpectedJpy: z.union([z.string(), z.number()]).nullable().optional(),
  received1stJpy: z.union([z.string(), z.number()]).nullable().optional(),
  received2ndJpy: z.union([z.string(), z.number()]).nullable().optional(),
  serviceFeeJpy: z.union([z.string(), z.number()]).nullable().optional(),
  exchangeRate: z.union([z.string(), z.number()]).nullable().optional(),
  serviceFeeVnd: z.union([z.string(), z.number()]).nullable().optional(),
  tax2ndJpy: z.union([z.string(), z.number()]).nullable().optional(),
  noticeDate: z.string().nullable().optional(),
  noticeImageUrl: z.string().nullable().optional(),
  withheldTax: z.union([z.string(), z.number()]).nullable().optional(),
  coverageMonths: z.union([z.string(), z.number()]).nullable().optional(),
  lastCoverageMonth: z.string().nullable().optional(),
  paymentsMultiplier: z.union([z.string(), z.number()]).nullable().optional(),
  averageStandardRemuneration: z.union([z.string(), z.number()]).nullable().optional(),
  lumpSumWithdrawalNumber: z.string().nullable().optional(),
  revisionNote: z.string().nullable().optional(),
  isReturnedToJapan: z.coerce.boolean().nullable().optional(),
  
  // --- Bảng 3 Overrides ---
  tokureiTekio: z.string().nullable().optional(),
  tokureiShohoMark: z.coerce.boolean().nullable().optional(),
  calculatedTax: z.union([z.string(), z.number()]).nullable().optional(),
  calculatedTax93: z.union([z.string(), z.number()]).nullable().optional(),
  totalGeneralTax: z.union([z.string(), z.number()]).nullable().optional(),
  taxableRetirementIncome: z.union([z.string(), z.number()]).nullable().optional(),
  retirementDeductionAmount: z.union([z.string(), z.number()]).nullable().optional(),
  taxRepresentativeId: z.string().nullable().optional(),

  // --- Nội dung ủy quyền Lần 1 (委任内容) ---
  delegateClaim: z.coerce.boolean().nullable().optional(),
  delegatePeriod: z.coerce.boolean().nullable().optional(),
  delegateEstimate: z.coerce.boolean().nullable().optional(),
  delegateReissue: z.coerce.boolean().nullable().optional(),
  delegateOther: z.coerce.boolean().nullable().optional(),
  delegateOtherText: z.string().nullable().optional(),
});

export const workspaceSchema = customerSchema.merge(applicationSchema);

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>;
