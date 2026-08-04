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
});

export const workspaceSchema = customerSchema.merge(applicationSchema);

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>;
