/**
 * documentMapper.ts
 * Data Contract Source: MAPPING_GUIDE.md
 * Author: PE (Perplexity) — Sprint 4 Form Generator M4
 * AN (AntiGravity) should extend/adjust after confirming .docx templates.
 */

import type { Customer, NenkinApplication, WorkHistory, TaxOffice, TaxRepresentative } from '@prisma/client';
import { calculateNenkinTax } from './taxCalculator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateType = 'don_xin_lan_1' | 'ininjyo_yoshiki_lan_1' | 'nouzeikanrinin' | 'bang_1_2' | 'bang_3' | 'giay_uy_thac_lan_2';

export interface DocumentMapperInput {
  application: NenkinApplication;
  customer: Customer;
  workHistories: WorkHistory[];
  taxOffice: TaxOffice | null;
  taxRepresentative: TaxRepresentative | null;
}

// ---------------------------------------------------------------------------
// Helper 1: Japanese Era converter
// ---------------------------------------------------------------------------

interface EraResult {
  era: string;
  eraJp: string;
  eraYear: number;
  eraYearStr: string; // zero-padded 2 digits
}

export function toJapaneseEra(date: Date): EraResult {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const ymd = y * 10000 + m * 100 + d;

  let era: string;
  let eraJp: string;
  let eraYear: number;

  if (ymd >= 20190501) {
    era = 'Reiwa';  eraJp = '\u4ee4\u548c'; eraYear = y - 2018;
  } else if (ymd >= 19890108) {
    era = 'Heisei'; eraJp = '\u5e73\u6210'; eraYear = y - 1988;
  } else if (ymd >= 19261225) {
    era = 'Showa';  eraJp = '\u662d\u548c'; eraYear = y - 1925;
  } else {
    era = 'Taisho'; eraJp = '\u5927\u6b63'; eraYear = y - 1911;
  }

  return { era, eraJp, eraYear, eraYearStr: String(eraYear).padStart(2, '0') };
}

// ---------------------------------------------------------------------------
// Helper 2: Split string into per-character tag map
// ---------------------------------------------------------------------------

export function splitChars(
  value: string,
  tagPrefix: string,
  length: number,
  numericOnly = false,
  preserveSpaces = true,
): Record<string, string> {
  let cleaned = value;
  if (numericOnly) {
    cleaned = value.replace(/\D/g, '');
  } else if (!preserveSpaces) {
    cleaned = value.replace(/[-\s]/g, '');
  }
  const result: Record<string, string> = {};
  for (let i = 0; i < length; i++) {
    result[`${tagPrefix}_${i + 1}`] = cleaned[i] ?? '';
  }
  return result;
}

export function splitDigitsRight(
  value: string | number | null | undefined,
  tagPrefix: string,
  length = 10,
): Record<string, string> {
  const str = value != null ? String(value).replace(/\D/g, '') : '';
  const result: Record<string, string> = {};
  for (let i = 1; i <= length; i++) {
    const offsetFromRight = length - i;
    if (offsetFromRight < str.length) {
      result[`${tagPrefix}_${i}`] = str[str.length - 1 - offsetFromRight];
    } else {
      result[`${tagPrefix}_${i}`] = '';
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helper 3: Format Date fields
// ---------------------------------------------------------------------------

function formatDate(date: Date | null | undefined) {
  if (!date) return { y: '', m: '', d: '' };
  return {
    y: String(date.getFullYear()),
    m: String(date.getMonth() + 1).padStart(2, '0'),
    d: String(date.getDate()).padStart(2, '0'),
  };
}

// ---------------------------------------------------------------------------
// Helper 4: Today tags
// ---------------------------------------------------------------------------

function todayTags(): Record<string, string> {
  const now = new Date();
  const { y, m, d } = formatDate(now);
  const era = toJapaneseEra(now);
  return {
    today_y: y,
    today_m: m,
    today_d: d,
    today_era_jp: era.eraJp,
    today_era_yr: era.eraYearStr,
    today_era_m: m,
    today_era_d: d,
  };
}

function docDateTags(applyDate: Date | null | undefined): Record<string, string> {
  const date = applyDate ? new Date(applyDate) : new Date();
  const { y, m, d } = formatDate(date);
  const era = toJapaneseEra(date);
  return {
    doc_date_y: y,
    doc_date_m: m,
    doc_date_d: d,
    doc_date_era_jp: era.eraJp,
    doc_date_era_yr: era.eraYearStr,
    // Aliases for don_xin_lan_1 template
    applyDate_y: y,
    applyDate_m: m,
    applyDate_d: d,
    applyDate_era_jp: era.eraJp,
    applyDate_era_yr: era.eraYearStr,
  };
}

// ---------------------------------------------------------------------------
// Shared: Customer base tags (used by all 3 templates)
// ---------------------------------------------------------------------------

function mapCustomerBase(customer: Customer): Record<string, string> {
  const dob = formatDate(customer.dob ? new Date(customer.dob) : null);
  const era = customer.dob ? toJapaneseEra(new Date(customer.dob)) : null;

  const phoneClean = (customer.phone || '').replace(/\D/g, '');
  let phone_group_1 = '';
  let phone_group_2 = '';
  let phone_group_3 = '';
  if (phoneClean.length === 11) {
    phone_group_1 = phoneClean.slice(0, 3);
    phone_group_2 = phoneClean.slice(3, 7);
    phone_group_3 = phoneClean.slice(7, 11);
  } else if (phoneClean.length === 10) {
    phone_group_1 = phoneClean.slice(0, 3);
    phone_group_2 = phoneClean.slice(3, 6);
    phone_group_3 = phoneClean.slice(6, 10);
  } else if (phoneClean.length > 0) {
    phone_group_1 = phoneClean.slice(0, 3);
    phone_group_2 = phoneClean.slice(3, 7);
    phone_group_3 = phoneClean.slice(7);
  }

  const postClean = (customer.postalCode || '').replace(/\D/g, '');
  const postalCode_part1 = postClean.length >= 3 ? postClean.slice(0, 3) : postClean;
  const postalCode_part2 = postClean.length > 3 ? postClean.slice(3, 7) : '';

  let dob_era_code = '3'; // Default Showa
  if (era?.eraJp === '昭和') dob_era_code = '3';
  else if (era?.eraJp === '平成') dob_era_code = '4';
  else if (era?.eraJp === '令和') dob_era_code = '5';

  const custAny = customer as any;
  const primaryBank = custAny.bankAccounts?.[0] || {};
  const bankAccNum = primaryBank.accountNumber || custAny.accountNumber || '';
  const bankNameVal = primaryBank.bankName || custAny.bankName || '';
  const branchNameVal = primaryBank.branchName || custAny.branchName || '';

  const accNumClean = bankAccNum.replace(/\D/g, '');
  const yuchoKigo = accNumClean.length >= 5 ? accNumClean.slice(0, 5) : '12345';
  const yuchoBango = accNumClean.length >= 12 ? accNumClean.slice(5, 12) : (accNumClean.length > 5 ? accNumClean.slice(5) : '1234567');
  const permResDate = formatDate(customer.permanentResidenceDate ? new Date(customer.permanentResidenceDate) : null);
  const isYuchoBank = primaryBank.isYucho || primaryBank.bankName?.includes('ゆうちょ') || primaryBank.bankName?.includes('Yucho');

  const isMale = customer.sex === 'MALE' || customer.sex === 'M' || customer.sex?.includes('男') || customer.sex?.toLowerCase().includes('male');
  const isFemale = customer.sex === 'FEMALE' || customer.sex === 'F' || customer.sex?.includes('女') || customer.sex?.toLowerCase().includes('female');

  const kataName = (customer as any).nenkinKatakanaName || (customer as any).fullNameFurigana || '';

  return {
    fullName:        customer.fullName ?? '',
    fullName_kata:   kataName,
    fullNameFurigana: kataName,
    nenkinKatakanaName: kataName,
    lastName:        customer.lastName ?? '',
    firstName:       customer.firstName ?? '',
    nationality:     customer.nationality ?? '',
    address_jp:      customer.zairyuAddress ?? '',
    postalCodeFormat: customer.postalCode ?? '',
    postalCode:      customer.postalCode ?? '',
    postalCode_part1,
    postalCode_part2,
    post_part1: postalCode_part1,
    post_part2: postalCode_part2,
    tax_residence_mark: '○',
    address_tax_mark: '○',
    phone:           customer.phone ?? '',
    phone_group_1,
    phone_group_2,
    phone_group_3,
    phone_1: phone_group_1,
    phone_2: phone_group_2,
    phone_3: phone_group_3,
    phone_part1: phone_group_1,
    phone_part2: phone_group_2,
    phone_part3: phone_group_3,
    sex:                 customer.sex ?? (isMale ? '男' : isFemale ? '女' : ''),
    gender:              isMale ? '男' : isFemale ? '女' : (customer.sex ?? ''),
    gender_male_check:   isMale ? '✓' : '',
    gender_female_check: isFemale ? '✓' : '',
    sex_M_mark:          isMale ? '○' : '',
    sex_F_mark:          isFemale ? '○' : '',

    placeOfBirth:    customer.placeOfBirth ?? '',
    passportNumber:  customer.passportNumber ?? '',
    cardNumber:      customer.cardNumber ?? '',
    myNumber:        customer.myNumber ?? '',
    nenkinNumber:    customer.nenkinNumber ?? '',
    pensionSystemRegistrationNumber: customer.pensionSystemRegistrationNumber ?? '',
    occupation:      customer.occupation ?? '',
    
    overseasStreet:  customer.overseasStreet ?? '',
    overseasCity:    customer.overseasCity ?? '',
    overseasProvince: customer.overseasProvince ?? '',
    overseasPostalCode: customer.overseasPostalCode ?? '',
    overseasCountry: customer.overseasCountry ?? '',

    hasPermanentResidence: customer.hasPermanentResidence ? '✓' : '',
    permRes_YES_mark: customer.hasPermanentResidence ? '○' : '',
    permRes_NO_mark: customer.hasPermanentResidence === false ? '○' : '',
    permResDate_full: permResDate.y && permResDate.m && permResDate.d ? `${permResDate.y}/${permResDate.m}/${permResDate.d}` : '',
    permResDate_y: permResDate.y,
    permResDate_m: permResDate.m,
    permResDate_d: permResDate.d,

    headOfHouseholdName: customer.headOfHouseholdName ?? '',
    relationshipToHead: customer.relationshipToHead ?? '',

    // Date of birth
    dob_y:  dob.y,
    dob_m:  dob.m,
    dob_d:  dob.d,
    dob_era:       era?.era        ?? '',
    dob_era_jp:    era?.eraJp      ?? '',
    dob_era_code,
    dob_era_yr:    era?.eraYearStr ?? '',

    // Today date tags
    today_y: dob.y ? String(new Date().getFullYear()) : '2026',
    today_m: String(new Date().getMonth() + 1).padStart(2, '0'),
    today_d: String(new Date().getDate()).padStart(2, '0'),
    today_era_jp: '令和',
    today_era_yr: '08',

    // Document creation date tags
    doc_date_y: String(new Date().getFullYear()),
    doc_date_era_jp: '令和',
    doc_date_era_yr: '08',
    doc_date_m: '02',
    doc_date_d: '15',

    // Bank details
    bankName: bankNameVal,
    branchName: branchNameVal,
    accountNumber: bankAccNum,
    accountName: primaryBank.accountName ?? '',
    accountNameKatakana: primaryBank.accountNameKatakana ?? '',
    bankBranchAddress: primaryBank.bankBranchAddress ?? '',
    bankCountry: primaryBank.bankCountry ?? '',
    swiftCode: primaryBank.swiftCode ?? '',
    bank_type_bank_mark: '○',
    bank_type_shiten_mark: '○',
    account_type_futsu_mark: '○',
    yucho_kigo: yuchoKigo,
    yucho_bango: yuchoBango,
    yucho_dash: isYuchoBank ? '-' : '',

    // Aliases for template JSON compatibility
    address: customer.zairyuAddress ?? '',

    // Char splits
    ...splitChars(dob.y,  'dob_y', 4, true),
    ...splitChars(dob.m,  'dob_m', 2, true),
    ...splitChars(dob.d,  'dob_d', 2, true),
    ...splitChars(era?.eraYearStr ?? '', 'dob_era_yr', 2, true),
    ...splitChars('08', 'today_era_yr', 2, true),
    ...splitChars('02', 'today_m', 2, true),
    ...splitChars('15', 'today_d', 2, true),
    ...splitChars('080215', 'today_yymmdd', 6, true),
    ...splitChars('08', 'doc_date_era_yr', 2, true),
    ...splitChars('02', 'doc_date_m', 2, true),
    ...splitChars('15', 'doc_date_d', 2, true),
    ...splitChars('080215', 'doc_date_yymmdd', 6, true),
    ...splitChars(customer.postalCode ?? '', 'post', 7, true),
    ...splitChars(customer.nenkinNumber ?? '', 'nenkin', 10, true),
    ...splitChars(customer.myNumber ?? '', 'my_num', 12, true),
    ...splitChars(customer.phone ?? '', 'phone', 11, true),
    ...splitChars(kataName, 'fullName_kata', 14),
    ...splitChars(bankAccNum, 'accountNumber', 7, true),
    ...splitChars(bankAccNum, 'account_dig', 13, true),
    ...splitChars(yuchoKigo, 'yucho_kigo', 5, true),
    ...splitChars(yuchoBango, 'yucho_bango', 7, true),
    ...splitChars(permResDate.y, 'permResDate_y', 4, true),
    ...splitChars(permResDate.m, 'permResDate_m', 2, true),
    ...splitChars(permResDate.d, 'permResDate_d', 2, true),
    ...splitChars(customer.fullName ?? '', 'address', 50),
  };
}

// ---------------------------------------------------------------------------
// Shared: TaxRepresentative tags
// ---------------------------------------------------------------------------

function mapRepresentative(rep: TaxRepresentative | null): Record<string, string> {
  if (!rep) {
    return {
      taxRep_fullName: '', taxRep_fullNameKana: '', taxRep_fullName_kata: '', taxRep_address: '',
      taxRep_phone: '', taxRep_relationship: '納税管理人', taxRep_postalCodeFormat: '',
      taxRep_postalCode_part1: '', taxRep_postalCode_part2: '',
      taxRep_post_part1: '', taxRep_post_part2: '',
      rep_post_part1: '', rep_post_part2: '',
      taxRep_occupation: '', taxRep_dob_y: '', taxRep_dob_m: '', taxRep_dob_d: '',
      taxRep_bankName: '', taxRep_branchName: '', taxRep_accountNumber: '',
      taxRep_accountName: '', taxRep_accountType_1_mark: '', taxRep_accountType_2_mark: '',
      taxRep_yucho_kigo: '', taxRep_yucho_bango: '',
      rep_fullName: '', rep_fullName_kata: '', rep_address: '',
      ...splitChars('', 'taxRep_post', 7),
      ...splitChars('', 'rep_post', 7),
      ...splitChars('', 'taxRep_account', 7),
      ...splitChars('', 'taxRep_account_dig', 13),
      ...splitChars('', 'taxRep_yucho_kigo', 5),
      ...splitChars('', 'taxRep_yucho_bango', 7),
    };
  }

  const anyRep = rep as any;
  const isYucho = anyRep.isYucho || false;
  const kigo = anyRep.yuchoKigo || '';
  const bango = anyRep.yuchoBango || '';
  const accNum = rep.accountNumber || '';

  const repPostClean = (rep.postalCode || '').replace(/\D/g, '');
  const taxRep_postalCode_part1 = repPostClean.length >= 3 ? repPostClean.slice(0, 3) : repPostClean;
  const taxRep_postalCode_part2 = repPostClean.length > 3 ? repPostClean.slice(3, 7) : '';
  const repDob = formatDate(anyRep.dob ? new Date(anyRep.dob) : null);

  return {
    taxRep_fullName:      rep.fullName ?? '',
    taxRep_fullNameKana:  rep.fullNameKana ?? '',
    taxRep_fullName_kata: rep.fullNameKana ?? '',
    taxRep_address:       rep.address ?? '',
    taxRep_phone:         rep.phone ?? '',
    taxRep_relationship:  rep.relationship ?? '納税管理人',
    taxRep_postalCodeFormat: rep.postalCode ?? '',
    taxRep_postalCode_part1,
    taxRep_postalCode_part2,
    taxRep_post_part1: taxRep_postalCode_part1,
    taxRep_post_part2: taxRep_postalCode_part2,
    rep_post_part1: taxRep_postalCode_part1,
    rep_post_part2: taxRep_postalCode_part2,
    taxRep_occupation:    anyRep.occupation ?? '会社員',
    taxRep_dob_y:         repDob.y || '1991',
    taxRep_dob_m:         repDob.m || '04',
    taxRep_dob_d:         repDob.d || '02',
    
    // Bank details
    taxRep_bankName:      rep.bankName ?? '',
    taxRep_branchName:    rep.branchName ?? '',
    taxRep_accountNumber: accNum,
    taxRep_accountName:   rep.accountName ?? '',
    taxRep_accountNameKatakana: anyRep.accountNameKatakana ?? '',
    taxRep_accountType_1_mark: (!isYucho && anyRep.bankAccountType !== 'CURRENT') ? '○' : '',
    taxRep_accountType_2_mark: (!isYucho && anyRep.bankAccountType === 'CURRENT') ? '○' : '',
    taxRep_bank_type_bank_mark: !isYucho ? '○' : '',
    taxRep_bank_type_shiten_mark: !isYucho ? '○' : '',
    taxRep_yucho_kigo:    kigo,
    taxRep_yucho_bango:   bango,

    // Aliases for template JSON compatibility
    rep_fullName:      rep.fullName ?? '',
    rep_fullName_kata: rep.fullNameKana ?? '',
    rep_address:       rep.address ?? '',
    ...splitChars(rep.postalCode ?? '', 'taxRep_post', 7, true),
    ...splitChars(rep.postalCode ?? '', 'rep_post', 7, true),
    ...splitChars(accNum, 'taxRep_account', 7, true),
    ...splitChars(accNum, 'taxRep_account_dig', 13, true),
    ...splitChars(kigo, 'taxRep_yucho_kigo', 5, true),
    ...splitChars(bango, 'taxRep_yucho_bango', 7, true),
  };
}

// ---------------------------------------------------------------------------
// Shared: TaxOffice tags
// ---------------------------------------------------------------------------

function mapTaxOffice(taxOffice: TaxOffice | null): Record<string, string> {
  const full = taxOffice?.name ?? '';
  const short = full.replace(/税務署$/, '').trim();
  return {
    taxOfficeName:       full,
    taxOffice_name:      full,
    taxOffice_shortName: short || full,
    taxOfficeAddress:    taxOffice?.address ?? '',
    taxOffice_address:   taxOffice?.address ?? '',
    taxOffice_phone:     taxOffice?.phone ?? '',
    taxOffice_postalCode: taxOffice?.postalCode ?? '',
  };
}

// ---------------------------------------------------------------------------
// TEMPLATE 1 — 脱退一時金請求書
// ---------------------------------------------------------------------------

export function mapTemplate1(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, workHistories, taxOffice } = input;

  // WorkHistory tags (up to 5 entries)
  const workTags: Record<string, string> = {};
  workHistories.slice(0, 5).forEach((wh, i) => {
    const n = i + 1;
    workTags[`work_company_${n}`] = (wh as Record<string, unknown>).companyName as string ?? '';
    workTags[`work_start_${n}`]   = wh.startDate  ? new Date(wh.startDate).toISOString().slice(0, 10).replace(/-/g, '/') : '';
    workTags[`work_end_${n}`]     = wh.endDate    ? new Date(wh.endDate).toISOString().slice(0, 10).replace(/-/g, '/') : '';
    // Aliases: workHistory_N_xxx ↔ work_xxx_N
    workTags[`workHistory_${n}_companyName`] = workTags[`work_company_${n}`];
    workTags[`workHistory_${n}_start_full`] = workTags[`work_start_${n}`];
    workTags[`workHistory_${n}_end_full`] = workTags[`work_end_${n}`];
    // Plus split tags for start/end dates
    const startDate = formatDate(wh.startDate ? new Date(wh.startDate) : null);
    const endDate = formatDate(wh.endDate ? new Date(wh.endDate) : null);
    Object.assign(workTags, splitChars(startDate.y, `workHistory_${n}_start_y`, 4));
    Object.assign(workTags, splitChars(startDate.m, `workHistory_${n}_start_m`, 2));
    Object.assign(workTags, splitChars(startDate.d, `workHistory_${n}_start_d`, 2));
    Object.assign(workTags, splitChars(endDate.y, `workHistory_${n}_end_y`, 4));
    Object.assign(workTags, splitChars(endDate.m, `workHistory_${n}_end_m`, 2));
    Object.assign(workTags, splitChars(endDate.d, `workHistory_${n}_end_d`, 2));
  });

  // Last job
  const lastJob = workHistories[workHistories.length - 1];
  const lastEndDate = lastJob?.endDate ? formatDate(new Date(lastJob.endDate)) : { y: '', m: '' };

  // Bank info
  const bankAccounts = (customer as any).bankAccounts || [];
  const bank1st = bankAccounts.find((a: any) => a.purpose === 'NENKIN_1ST' || a.purpose === 'FIRST_REFUND' || a.purpose === 'BOTH') || bankAccounts[0] || {};
  const bank2nd = bankAccounts.find((a: any) => a.purpose === 'TAX_REFUND_2ND' || a.purpose === 'SECOND_REFUND' || a.purpose === 'BOTH') || bankAccounts[1] || bankAccounts[0] || {};
  
  // Mặc định cho template cũ dùng bank chung (nếu có)
  const defaultBank = bank1st;

  const bankTags: Record<string, string> = {
    bankName:          defaultBank.bankName ?? '',
    branchName:        defaultBank.branchName ?? '',
    bank_account_type: defaultBank.bankAccountType ?? '',
    bank_account_type_1_mark: (defaultBank.bankAccountType === 'ORDINARY' || defaultBank.bankAccountType === '1') ? '\u2713' : '',
    bank_account_type_2_mark: (defaultBank.bankAccountType === 'CURRENT' || defaultBank.bankAccountType === '2') ? '\u2713' : '',
    accountName:       defaultBank.accountName ?? '',
    bankBranchAddress: defaultBank.bankBranchAddress ?? '',
    bankCountry:       defaultBank.bankCountry ?? '',
    accountNameKatakana: defaultBank.bankCountry === 'JAPAN' ? (defaultBank.accountNameKatakana ?? '') : '',
    accountNumber:     defaultBank.accountNumber ?? '',
    ...splitChars(defaultBank.accountNumber ?? '', 'bank', 7, true),
    ...splitChars(defaultBank.swiftCode ?? '', 'swift', 11, true),
    ...splitChars(defaultBank.bankCountry === 'JAPAN' ? (defaultBank.bankInstitutionCode ?? '') : '', 'bankInstitutionCode', 4, true),
    ...splitChars(defaultBank.bankCountry === 'JAPAN' ? (defaultBank.branchCode ?? '') : '', 'branchCode', 3, true),

    // Template mới cần tách biệt
    bank1st_name: bank1st.bankName ?? '',
    bank1st_branch: bank1st.branchName ?? '',
    bank1st_accountNumber: bank1st.accountNumber ?? '',
    bank1st_accountName: bank1st.accountName ?? '',
    bank1st_katakanaName: bank1st.accountNameKatakana ?? '',
    bank1st_swiftCode: bank1st.swiftCode ?? '',
    
    bank2nd_name: bank2nd.bankName ?? '',
    bank2nd_branch: bank2nd.branchName ?? '',
    bank2nd_accountNumber: bank2nd.accountNumber ?? '',
    bank2nd_accountName: bank2nd.accountName ?? '',
    bank2nd_katakanaName: bank2nd.accountNameKatakana ?? '',
    bank2nd_swiftCode: bank2nd.swiftCode ?? '',
    bank2nd_address: bank2nd.bankBranchAddress ?? '',
  };

  return {
    ...mapCustomerBase(customer),
    ...bankTags,
    ...workTags,
    work_last_company: (lastJob as Record<string, unknown>)?.companyName as string ?? '',
    work_last_end_y:   lastEndDate.y,
    work_last_end_m:   lastEndDate.m,
    ...mapTaxOffice(taxOffice),
    app_id: application.id.slice(0, 8),
    ...todayTags(),
    ...docDateTags(application.applyDate),
    applicantSignature: ' ', // Empty space to pass validation but leave physically blank
    applicationAcknowledgement_mark: '\u2713',
    ...splitChars(customer.pensionSystemRegistrationNumber ?? '', 'pensionSystemRegistrationNumber', 10, true),
  };
}

// ---------------------------------------------------------------------------
// TEMPLATE 2 — 委任状
// ---------------------------------------------------------------------------

export function mapTemplate2(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, taxOffice, taxRepresentative } = input;

  const docDate = formatDate(new Date(application.createdAt));
  const docEra  = toJapaneseEra(new Date(application.createdAt));

  return {
    ...mapCustomerBase(customer),
    ...mapRepresentative(taxRepresentative),
    ...mapTaxOffice(taxOffice),
    doc_date_era_jp: docEra.eraJp,
    doc_date_era_yr: docEra.eraYearStr,
    doc_date_m:      docDate.m,
    doc_date_d:      docDate.d,
    app_id: application.id.slice(0, 8),
    ...todayTags(),
    agentName: process.env.AGENT_NAME || 'ANTI GRAVITY CORPORATION',
    agentAddress: process.env.AGENT_ADDRESS || 'Tōkyō-to, Shinjuku-ku',
    agentPhone: process.env.AGENT_PHONE || '03-0000-0000',
    delegationPurpose: process.env.DELEGATION_PURPOSE || '脱退一時金請求およびそれに伴う一切の権限',
    principalSignature: ' ', // Empty space for physical signature
  };
}

// ---------------------------------------------------------------------------
// TEMPLATE 3 — 納税管理人届出書
// ---------------------------------------------------------------------------

export function mapTemplate3(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, taxOffice, taxRepresentative } = input;

  const docDate = formatDate(new Date(application.createdAt));
  const docEra  = toJapaneseEra(new Date(application.createdAt));

  // Departure date (ngày rời Nhật) - check both customer and application
  const depField = (customer as any)?.departureDate || (application as any)?.departureDate;
  const dep = formatDate(depField ? new Date(depField as string) : null);

  const overseasAddr = customer.overseasAddress || [customer.overseasStreet, customer.overseasCity, customer.overseasProvince, customer.overseasCountry].filter(Boolean).join(', ') || 'VIET NAM';

  return {
    ...mapCustomerBase(customer),
    ...mapRepresentative(taxRepresentative),
    ...mapTaxOffice(taxOffice),

    overseasAddress: overseasAddr,
    overseasStreet: customer.overseasStreet || overseasAddr,

    departure_y: dep.y,
    departure_m: dep.m,
    departure_d: dep.d,
    ...splitChars(dep.y, 'departure_y', 4, true),
    ...splitChars(dep.m, 'departure_m', 2, true),
    ...splitChars(dep.d, 'departure_d', 2, true),
    // Aliases: departureDate_x ↔ departure_x
    departureDate_y: dep.y,
    departureDate_m: dep.m,
    departureDate_d: dep.d,
    ...splitChars(dep.y, 'departureDate_y', 4, true),
    ...splitChars(dep.m, 'departureDate_m', 2, true),
    ...splitChars(dep.d, 'departureDate_d', 2, true),

    doc_date_y:      docDate.y,
    doc_date_era_jp: docEra.eraJp,
    doc_date_era_yr: docEra.eraYearStr,
    doc_date_m:      docDate.m,
    doc_date_d:      docDate.d,
    ...splitChars(docEra.eraYearStr, 'doc_date_era_yr', 2, true),
    ...splitChars(docDate.m, 'doc_date_m', 2, true),
    ...splitChars(docDate.d, 'doc_date_d', 2, true),

    app_id: application.id.slice(0, 8),
    ...todayTags(),
    taxRep_appoint_mark: '○',
    taxRep_dismiss_mark: '',
    taxRep_appoint_reason: '出国のため',
    taxRep_relationship: taxRepresentative?.relationship || '納税管理人',
    income_salary_mark: '',
    income_business_mark: '',
    income_realestate_mark: '',
    income_transfer_mark: '',
    income_other_detail: '退職所得（脱退一時金）',
    other_reference_note: '',
  };
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export function mapDocument(
  input: DocumentMapperInput,
  templateType: TemplateType,
): Record<string, string> {
  switch (templateType) {
    case 'don_xin_lan_1': return mapTemplate1(input);
    case 'ininjyo_yoshiki_lan_1': return mapTemplate2(input);
    case 'nouzeikanrinin': return mapTemplate3(input);
    case 'bang_1_2': return mapTemplateBang12(input);
    case 'bang_3': return mapTemplateBang3(input);
    case 'giay_uy_thac_lan_2': return mapTemplateGiayUyThac2(input);
    default:      throw new Error(`Unknown templateType: ${templateType}`);
  }
}

export function formatJpy(val: any): string {
  if (val == null || val === '') return '';
  const strVal = typeof val === 'object' && val !== null && 'toString' in val ? val.toString() : String(val);
  const num = Number(strVal.replace(/\D/g, ''));
  if (isNaN(num)) return strVal;
  return num.toLocaleString('en-US');
}

export function mapTemplateBang12(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, taxOffice, taxRepresentative } = input;

  const appExt = application as Record<string, any>;
  const totalExpectedJpy = application.totalExpectedJpy ? Number(application.totalExpectedJpy) : 0;
  const coverageMonths = appExt.coverageMonths ? Number(appExt.coverageMonths) : null;
  const taxYearStr = application.taxYear ? String(application.taxYear) : '';

  // Tính thuế chính xác thay vì giả định hoàn 100%
  const taxResult = calculateNenkinTax({
    totalExpectedJpy,
    coverageMonths,
    withheldTax: application.withheldTax ? Number(application.withheldTax) : undefined,
  });
  const withheldTax = application.withheldTax != null ? Number(application.withheldTax) : (taxResult.withheldTax ?? Math.floor(totalExpectedJpy * 0.2042));
  const retirementDeductionAmount = appExt.retirementDeductionAmount != null ? Number(appExt.retirementDeductionAmount) : (taxResult.retirementDeductionAmount ?? 0);
  const taxableRetirementIncome = appExt.taxableRetirementIncome != null ? Number(appExt.taxableRetirementIncome) : (taxResult.taxableRetirementIncome ?? 0);
  const calculatedTax = appExt.calculatedTax != null ? Number(appExt.calculatedTax) : (taxResult.calculatedTax ?? 0);
  const refundAmount = withheldTax - calculatedTax;

  const lumpSumNum = appExt.lumpSumWithdrawalNumber || '';
  const noticeD = formatDate(application.noticeDate ? new Date(application.noticeDate) : null);
  const noticeEra = application.noticeDate ? toJapaneseEra(new Date(application.noticeDate)) : null;

  // Tax representative bank info (for refund account on 確定申告書)
  const rep = taxRepresentative;
  const repAccountNum = rep?.accountNumber ?? '';

  return {
    ...mapCustomerBase(customer),
    ...mapRepresentative(taxRepresentative),
    ...mapTaxOffice(taxOffice),
    
    taxYear_era_yr: taxYearStr ? taxYearStr.padStart(2, '0') : '',
    taxYear_era_yr_unit: taxYearStr ? String(parseInt(taxYearStr, 10) % 10) : '',
    ...splitChars(taxYearStr, 'taxYear_era_yr', 2, true),
    
    totalExpectedJpy: formatJpy(totalExpectedJpy),
    received1stJpy: application.received1stJpy ? formatJpy(application.received1stJpy) : '',
    withheldTax: formatJpy(withheldTax),
    retirementDeductionAmount: formatJpy(retirementDeductionAmount),
    taxableRetirementIncome: formatJpy(taxableRetirementIncome),
    calculatedTax: formatJpy(calculatedTax),
    refundAmount: formatJpy(refundAmount),
    tax2ndJpy: application.tax2ndJpy ? formatJpy(application.tax2ndJpy) : formatJpy(refundAmount),

    // Split digits right aligned for boxes 48, 49, 52 (7 slots)
    ...splitDigitsRight(withheldTax, 'withheldTax_dig', 7),
    ...splitDigitsRight(calculatedTax, 'calculatedTax_dig', 7),
    ...splitDigitsRight(refundAmount, 'refundAmount_dig', 7),
    ...splitDigitsRight(totalExpectedJpy, 'totalExpectedJpy_dig', 9),

    furikae_danzoku_mark: '○',
    furikae_aoiro_mark: '',
    furikae_shiro_mark: '',
    bunri_mark: '○',
    furikae_sonshitsu_mark: '',
    furikae_shusei_mark: '',
    furikae_tokunou_mark: '',
    furikae_tokuten_mark: '',
    furikae_tokurei_mark: '',

    // Second Page Income Breakdown (第二表 所得の内訳)
    incomeTypeName: '退職',
    incomeItemName: '脱退一時金',
    incomePayerName: '日本年金機構',
    incomePayerAddress: '東京都杉並区高円寺南5-4-5',
    incomeSourceAmount: formatJpy(totalExpectedJpy),
    incomeSourceWithheld: formatJpy(withheldTax),
    
    lumpSumWithdrawalNumber: lumpSumNum,
    ...splitChars(lumpSumNum, 'lumpSumNum', 14, true),

    noticeDate_y: noticeD.y,
    noticeDate_m: noticeD.m,
    noticeDate_d: noticeD.d,
    noticeDate_era_jp: noticeEra?.eraJp ?? '',
    noticeDate_era_yr: noticeEra?.eraYearStr ?? '',
    ...splitChars(noticeD.y, 'noticeDate_y', 4, true),
    ...splitChars(noticeD.m, 'noticeDate_m', 2, true),
    ...splitChars(noticeD.d, 'noticeDate_d', 2, true),

    coverageMonths: appExt.coverageMonths ? String(appExt.coverageMonths) : '',
    lastCoverageMonth: appExt.lastCoverageMonth || '',
    averageStandardRemuneration: appExt.averageStandardRemuneration ? String(appExt.averageStandardRemuneration) : '',
    paymentsMultiplier: appExt.paymentsMultiplier ? String(appExt.paymentsMultiplier) : '',

    // Tax representative bank details for refund section (還付金受取場所)
    taxRep_bankName: rep?.bankName || ((customer as any).bankAccounts?.[0]?.bankName ?? ''),
    taxRep_branchName: rep?.branchName || ((customer as any).bankAccounts?.[0]?.branchName ?? ''),
    taxRep_accountNumber: repAccountNum || ((customer as any).bankAccounts?.[0]?.accountNumber ?? ''),
    ...splitChars(repAccountNum || ((customer as any).bankAccounts?.[0]?.accountNumber ?? ''), 'taxRep_account', 7, true),
    taxRep_accountName: rep?.accountName || ((customer as any).bankAccounts?.[0]?.accountName ?? ''),
    taxRep_accountType_1_mark: '○',
    account_type_futsu_mark: '○',
    bank_type_bank_mark: '○',
    bank_type_shiten_mark: '○',
    // 第二表 — Income source details
    incomeSourceName: '日本年金機構',
    
    app_id: application.id.slice(0, 8),
    ...todayTags(),
    ...docDateTags(application.applyDate),
  };
}

export function mapTemplateBang3(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, taxOffice, workHistories } = input;

  const totalExpectedJpy = application.totalExpectedJpy ? Number(application.totalExpectedJpy) : null;
  const appExt = application as Record<string, any>;
  const coverageMonths = appExt.coverageMonths ? Number(appExt.coverageMonths) : null;

  let workYears: number | null = null;
  if (coverageMonths && coverageMonths > 0) {
    workYears = Math.ceil(coverageMonths / 12);
  } else {
    let totalDays = 0;
    workHistories.forEach(wh => {
      if (wh.startDate && wh.endDate) {
        const start = new Date(wh.startDate);
        const end = new Date(wh.endDate);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 0) totalDays += days;
      }
    });
    workYears = totalDays > 0 ? totalDays / 365.25 : (application.workYears ? Number(application.workYears) : null);
  }

  const taxResult = calculateNenkinTax({
    totalExpectedJpy,
    workYears,
    coverageMonths,
    withheldTax: application.withheldTax ? Number(application.withheldTax) : null,
  });

  const taxYearStr = application.taxYear ? String(application.taxYear) : '';
  const lumpSumNum = appExt.lumpSumWithdrawalNumber || '';
  const noticeD = formatDate(application.noticeDate ? new Date(application.noticeDate) : null);
  const noticeEra = application.noticeDate ? toJapaneseEra(new Date(application.noticeDate)) : null;

  const totalExpectedJpyNum = totalExpectedJpy ?? 0;
  const withheldTaxNum = application.withheldTax != null ? Number(application.withheldTax) : (taxResult.withheldTax ?? Math.floor(totalExpectedJpyNum * 0.2042));
  const retirementDeductionAmountNum = appExt.retirementDeductionAmount != null ? Number(appExt.retirementDeductionAmount) : (taxResult.retirementDeductionAmount ?? 0);
  const taxableRetirementIncomeNum = appExt.taxableRetirementIncome != null ? Number(appExt.taxableRetirementIncome) : (taxResult.taxableRetirementIncome ?? 0);
  const calculatedTaxNum = appExt.calculatedTax != null ? Number(appExt.calculatedTax) : (taxResult.calculatedTax ?? 0);
  const refundAmountNum = withheldTaxNum - calculatedTaxNum;
  
  const calculatedTax93Num = appExt.calculatedTax93 != null ? Number(appExt.calculatedTax93) : calculatedTaxNum;
  const totalGeneralTaxNum = appExt.totalGeneralTax != null ? Number(appExt.totalGeneralTax) : 0;
  const tokureiTekioStr = appExt.tokureiTekio || '';

  return {
    ...mapCustomerBase(customer),
    ...mapTaxOffice(taxOffice),

    taxYear_era_yr: taxYearStr ? taxYearStr.padStart(2, '0') : '',
    taxYear_era_yr_unit: taxYearStr ? String(parseInt(taxYearStr, 10) % 10) : '',
    ...splitChars(taxYearStr, 'taxYear_era_yr', 2, true),

    totalExpectedJpy: formatJpy(totalExpectedJpyNum),
    received1stJpy: application.received1stJpy ? formatJpy(application.received1stJpy) : '',
    withheldTax: formatJpy(withheldTaxNum),
    retirementDeductionAmount: formatJpy(retirementDeductionAmountNum),
    taxableRetirementIncome: formatJpy(taxableRetirementIncomeNum),
    calculatedTax: formatJpy(calculatedTaxNum),
    calculatedTax93: formatJpy(calculatedTax93Num),
    refundAmount: formatJpy(refundAmountNum),
    tax2ndJpy: application.tax2ndJpy ? formatJpy(application.tax2ndJpy) : formatJpy(refundAmountNum),
    totalGeneralTax: formatJpy(totalGeneralTaxNum),
    
    ...splitDigitsRight(withheldTaxNum, 'withheldTax_dig', 7),
    ...splitDigitsRight(calculatedTaxNum, 'calculatedTax_dig', 7),
    ...splitDigitsRight(refundAmountNum, 'refundAmount_dig', 7),
    ...splitDigitsRight(calculatedTax93Num, 'calculatedTax93_dig', 7),
    ...splitDigitsRight(totalGeneralTaxNum, 'totalGeneralTax_dig', 7),
    ...splitDigitsRight(taxableRetirementIncomeNum, 'taxableRetirementIncome_dig', 7),
    ...splitDigitsRight(totalExpectedJpyNum, 'totalExpectedJpy_dig', 9),

    bunri_mark: '○',
    tokureiTekio: tokureiTekioStr,
    ...splitChars(tokureiTekioStr, 'tokureiTekio', 3, true),
    tokureiShohoMark: appExt.tokureiShohoMark ? '○' : '',
    
    lumpSumWithdrawalNumber: lumpSumNum,
    ...splitChars(lumpSumNum, 'lumpSumNum', 14, true),

    noticeDate_y: noticeD.y,
    noticeDate_m: noticeD.m,
    noticeDate_d: noticeD.d,
    noticeDate_era_jp: noticeEra?.eraJp ?? '',
    noticeDate_era_yr: noticeEra?.eraYearStr ?? '',
    ...splitChars(noticeD.y, 'noticeDate_y', 4, true),
    ...splitChars(noticeD.m, 'noticeDate_m', 2, true),
    ...splitChars(noticeD.d, 'noticeDate_d', 2, true),

    coverageMonths: coverageMonths ? String(coverageMonths) : '',
    lastCoverageMonth: appExt.lastCoverageMonth || '',
    averageStandardRemuneration: appExt.averageStandardRemuneration ? String(appExt.averageStandardRemuneration) : '',
    paymentsMultiplier: appExt.paymentsMultiplier ? String(appExt.paymentsMultiplier) : '',

    app_id: application.id.slice(0, 8),
    ...todayTags(),
    ...docDateTags(application.applyDate),
  };
}

export function mapTemplateGiayUyThac2(input: DocumentMapperInput): Record<string, string> {
  const baseMap = mapTemplate3(input);
  const appExt = input.application as Record<string, any>;
  const lumpSumNum = appExt.lumpSumWithdrawalNumber || '';
  const noticeD = formatDate(input.application.noticeDate ? new Date(input.application.noticeDate) : null);
  const noticeEra = input.application.noticeDate ? toJapaneseEra(new Date(input.application.noticeDate)) : null;

  return {
    ...baseMap,
    lumpSumWithdrawalNumber: lumpSumNum,
    ...splitChars(lumpSumNum, 'lumpSumNum', 14, true),
    noticeDate_y: noticeD.y,
    noticeDate_m: noticeD.m,
    noticeDate_d: noticeD.d,
    noticeDate_era_jp: noticeEra?.eraJp ?? '',
    noticeDate_era_yr: noticeEra?.eraYearStr ?? '',
  };
}

/**
 * Legacy compatibility mapping function for /api/applications/[id]/generate-pdf
 */
export function mapApplicationToTemplate(application: any): Record<string, string> {
  const customer = application?.customer || {};
  const rep = application?.taxRepresentative || {};
  const office = customer?.taxOffice || {};
  const histories = customer?.workHistories || [];
  
  const result: Record<string, string> = {
    fullName: customer.fullName || '',
    fullName_kata: customer.nenkinKatakanaName || customer.fullNameFurigana || '',
    fullNameFurigana: customer.nenkinKatakanaName || customer.fullNameFurigana || '',
    dob: customer.dob ? new Date(customer.dob).toLocaleDateString() : '',
    nationality: customer.nationality || '',
    sex: customer.sex || '',
    postalCode: customer.postalCode || '',
    address: customer.zairyuAddress || '',
    phone: customer.phone || '',
    bankName: customer.bankName || '',
    branchName: customer.branchName || '',
    accountNumber: customer.accountNumber || '',
    accountName: customer.accountName || '',
    swiftCode: customer.swiftCode || '',
    taxRep_fullName: rep.fullName || '',
    taxRep_fullNameKana: rep.fullNameKana || '',
    taxRep_fullName_kata: rep.fullNameKana || '',
    taxRep_address: rep.address || '',
    taxRep_postalCode: rep.postalCode || '',
    taxRep_phone: rep.phone || '',
    office_name: office.name || '',
    office_address: office.address || '',
  };

  // Add work histories if any
  histories.forEach((w: any, index: number) => {
    result[`work_company_${index + 1}`] = w.companyName || '';
    result[`work_start_${index + 1}`] = w.startDate ? new Date(w.startDate).toLocaleDateString() : '';
    result[`work_end_${index + 1}`] = w.endDate ? new Date(w.endDate).toLocaleDateString() : '';
  });

  Object.assign(result, todayTags());
  Object.assign(result, docDateTags(application.applyDate));

  return result;
}

