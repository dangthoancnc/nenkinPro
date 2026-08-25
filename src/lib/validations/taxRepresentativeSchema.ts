import { z } from 'zod';

export const taxRepresentativeSchema = z.object({
  fullName:            z.string().min(1, 'Họ tên bắt buộc'),
  fullNameKana:        z.string().optional().nullable(),
  address:             z.string().min(1, 'Địa chỉ bắt buộc'),
  postalCode:          z.string().min(7, 'Mã bưu điện 7-8 ký tự').max(8),
  phone:               z.string().optional().nullable(),
  myNumber:            z.string().optional().nullable(),
  relationship:        z.string().optional().nullable(),
  occupation:          z.string().optional().nullable(),
  dob:                 z.string().optional().nullable(),
  
  bankName:            z.string().optional().nullable(),
  branchName:          z.string().optional().nullable(),
  accountNumber:       z.string().optional().nullable(),
  accountName:         z.string().optional().nullable(),
  accountNameKatakana: z.string().optional().nullable(),
  isYucho:             z.boolean().default(false),
  bankAccountType:     z.string().optional().nullable(),
  yuchoKigo:           z.string().optional().nullable(),
  yuchoBango:          z.string().optional().nullable(),
});

export type TaxRepresentativeInput = z.infer<typeof taxRepresentativeSchema>;

function nullify(v: string | null | undefined): string | null {
  return v?.trim() || null;
}

export function buildTaxRepData(body: TaxRepresentativeInput) {
  return {
    fullName:            body.fullName.trim(),
    fullNameKana:        nullify(body.fullNameKana),
    address:             body.address.trim(),
    postalCode:          body.postalCode.trim(),
    phone:               nullify(body.phone),
    myNumber:            nullify(body.myNumber),
    relationship:        nullify(body.relationship) || '納税管理人',
    occupation:          nullify(body.occupation) || '会社員',
    dob:                 body.dob ? new Date(body.dob) : null,
    
    bankName:            nullify(body.bankName),
    branchName:          nullify(body.branchName),
    accountNumber:       nullify(body.accountNumber),
    accountName:         nullify(body.accountName),
    accountNameKatakana: nullify(body.accountNameKatakana),
    isYucho:             Boolean(body.isYucho),
    bankAccountType:     nullify(body.bankAccountType) || 'ORDINARY',
    yuchoKigo:           nullify(body.yuchoKigo),
    yuchoBango:          nullify(body.yuchoBango),
  };
}
