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
): Record<string, string> {
  const cleaned = numericOnly ? value.replace(/\D/g, '') : value.replace(/[-\s]/g, '');
  const result: Record<string, string> = {};
  for (let i = 0; i < length; i++) {
    result[`${tagPrefix}_${i + 1}`] = cleaned[i] ?? '';
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
  };
}

// ---------------------------------------------------------------------------
// Shared: Customer base tags (used by all 3 templates)
// ---------------------------------------------------------------------------

function mapCustomerBase(customer: Customer): Record<string, string> {
  const dob = formatDate(customer.dob ? new Date(customer.dob) : null);
  const era = customer.dob ? toJapaneseEra(new Date(customer.dob)) : null;

  return {
    fullName:        customer.fullName ?? '',
    fullName_kata:   customer.fullNameFurigana ?? '',
    nationality:     customer.nationality ?? '',
    address_jp:      customer.zairyuAddress ?? '',
    phone:           customer.phone ?? '',
    gender:          customer.sex === 'MALE' ? '\u7537' : '\u5973',
    gender_male_check:   customer.sex === 'MALE'   ? '\u2713' : '',
    gender_female_check: customer.sex === 'FEMALE' ? '\u2713' : '',

    placeOfBirth:    customer.placeOfBirth ?? '',
    occupation:      customer.occupation ?? '',
    
    overseasStreet:  customer.overseasStreet ?? '',
    overseasCity:    customer.overseasCity ?? '',
    overseasProvince: customer.overseasProvince ?? '',
    overseasPostalCode: customer.overseasPostalCode ?? '',
    overseasCountry: customer.overseasCountry ?? '',

    hasPermanentResidence: customer.hasPermanentResidence ? '\u2713' : '',
    permRes_YES_mark: customer.hasPermanentResidence ? '\u2713' : '',
    permRes_NO_mark: customer.hasPermanentResidence === false ? '\u2713' : '',
    headOfHouseholdName: customer.headOfHouseholdName ?? '',
    relationshipToHead: customer.relationshipToHead ?? '',

    // Date of birth
    dob_y:  dob.y,
    dob_m:  dob.m,
    dob_d:  dob.d,
    dob_era:       era?.era        ?? '',
    dob_era_jp:    era?.eraJp      ?? '',
    dob_era_yr:    era?.eraYearStr ?? '',

    // Char splits
    ...splitChars(dob.y,  'dob_y', 4, true),
    ...splitChars(dob.m,  'dob_m', 2, true),
    ...splitChars(dob.d,  'dob_d', 2, true),
    ...splitChars(era?.eraYearStr ?? '', 'dob_era_yr', 2, true),
    ...splitChars(customer.postalCode ?? '', 'post', 7, true),
    ...splitChars(customer.nenkinNumber ?? '', 'nenkin', 10, true),
    ...splitChars(customer.myNumber ?? '', 'my_num', 12, true),
    ...splitChars(customer.fullName ?? '', 'address', 50),
  };
}

// ---------------------------------------------------------------------------
// Shared: TaxRepresentative tags
// ---------------------------------------------------------------------------

function mapRepresentative(rep: TaxRepresentative | null): Record<string, string> {
  if (!rep) {
    return {
      rep_fullName: '', rep_fullName_kata: '', rep_address: '',
      rep_phone: '', rep_relation: '',
      rep_dob_y: '', rep_dob_m: '', rep_dob_d: '',
      ...splitChars('', 'rep_post', 7),
    };
  }
  return {
    rep_fullName:      rep.fullName ?? '',
    rep_fullName_kata: rep.fullNameKana ?? '',
    rep_address:       rep.address ?? '',
    rep_phone:         rep.phone ?? '',
    rep_relation:      '納税管理人',
    rep_dob_y: '',
    rep_dob_m: '',
    rep_dob_d: '',
    ...splitChars(rep.postalCode ?? '', 'rep_post', 7, true),
  };
}

// ---------------------------------------------------------------------------
// Shared: TaxOffice tags
// ---------------------------------------------------------------------------

function mapTaxOffice(taxOffice: TaxOffice | null): Record<string, string> {
  return {
    taxOfficeName:    taxOffice?.name    ?? '',
    taxOfficeAddress: taxOffice?.address ?? '',
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
  const bankTags: Record<string, string> = {
    bankName:          customer.bankName ?? '',
    branchName:        customer.branchName ?? '',
    bank_account_type: '', // To be filled if we have it
    accountName:       customer.accountName ?? '',
    bankBranchAddress: customer.bankBranchAddress ?? '',
    bankBranchCity:    customer.bankBranchCity ?? '',
    bankCountry:       customer.bankCountry ?? '',
    accountNameKatakana: customer.accountNameKatakana ?? '',
    accountNumber:     customer.accountNumber ?? '',
    ...splitChars(customer.accountNumber ?? '', 'bank', 7, true),
    ...splitChars(customer.swiftCode ?? '', 'swift', 11, true),
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
  };
}

// ---------------------------------------------------------------------------
// TEMPLATE 3 — 納税管理人届出書
// ---------------------------------------------------------------------------

export function mapTemplate3(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, taxOffice, taxRepresentative } = input;

  const docDate = formatDate(new Date(application.createdAt));
  const docEra  = toJapaneseEra(new Date(application.createdAt));

  // Departure date (ngày rời Nhật)
  const depField = (application as Record<string, unknown>).departureDate;
  const dep = formatDate(depField ? new Date(depField as string) : null);

  return {
    ...mapCustomerBase(customer),
    ...mapRepresentative(taxRepresentative),
    ...mapTaxOffice(taxOffice),

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

    doc_date_era_jp: docEra.eraJp,
    doc_date_era_yr: docEra.eraYearStr,
    doc_date_m:      docDate.m,
    doc_date_d:      docDate.d,
    app_id: application.id.slice(0, 8),
    ...todayTags(),
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

export function mapTemplateBang12(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, taxOffice, taxRepresentative, workHistories } = input;

  const totalExpectedJpy = application.totalExpectedJpy ? Number(application.totalExpectedJpy) : 0;
  const withheldTax = application.withheldTax ? Number(application.withheldTax) : Math.floor(totalExpectedJpy * 0.2042);
  // calculatedTax will come from bang3; for bang12 we still output refund = withheld - 0
  const refundAmount = withheldTax;

  const taxYearStr = application.taxYear ? String(application.taxYear) : '';

  return {
    ...mapCustomerBase(customer),
    ...mapRepresentative(taxRepresentative),
    ...mapTaxOffice(taxOffice),
    
    taxYear_era_yr: taxYearStr,
    ...splitChars(taxYearStr, 'taxYear_era_yr', 2, true),
    
    totalExpectedJpy: String(totalExpectedJpy),
    withheldTax: String(withheldTax),
    refundAmount: String(refundAmount),
    
    app_id: application.id.slice(0, 8),
    ...todayTags(),
    ...docDateTags(application.applyDate),
  };
}

export function mapTemplateBang3(input: DocumentMapperInput): Record<string, string> {
  const { application, customer, taxOffice, workHistories } = input;

  const totalExpectedJpy = application.totalExpectedJpy ? Number(application.totalExpectedJpy) : null;

  // Calculate work years
  let totalDays = 0;
  workHistories.forEach(wh => {
    if (wh.startDate && wh.endDate) {
      const start = new Date(wh.startDate);
      const end = new Date(wh.endDate);
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (days > 0) totalDays += days;
    }
  });
  const workYears = totalDays > 0 ? totalDays / 365.25 : null;

  const taxResult = calculateNenkinTax({
    totalExpectedJpy,
    workYears
  });

  const taxYearStr = application.taxYear ? String(application.taxYear) : '';

  return {
    ...mapCustomerBase(customer),
    ...mapTaxOffice(taxOffice),

    taxYear_era_yr: taxYearStr,
    ...splitChars(taxYearStr, 'taxYear_era_yr', 2, true),

    totalExpectedJpy: taxResult.missingInputs.includes('totalExpectedJpy') ? '' : String(totalExpectedJpy),
    withheldTax: taxResult.withheldTax == null ? '' : String(taxResult.withheldTax),
    retirementDeductionAmount: taxResult.retirementDeductionAmount == null ? '' : String(taxResult.retirementDeductionAmount),
    taxableRetirementIncome: taxResult.taxableRetirementIncome == null ? '' : String(taxResult.taxableRetirementIncome),
    calculatedTax: taxResult.calculatedTax == null ? '' : String(taxResult.calculatedTax),
    refundAmount: taxResult.refundAmount == null ? '' : String(taxResult.refundAmount),
    
    app_id: application.id.slice(0, 8),
    ...todayTags(),
    ...docDateTags(application.applyDate),
  };
}

export function mapTemplateGiayUyThac2(input: DocumentMapperInput): Record<string, string> {
  return mapTemplate3(input);
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
    fullName_kata: customer.fullNameFurigana || '',
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
    rep_fullName: rep.fullName || '',
    rep_fullName_kata: rep.fullNameKana || '',
    rep_address: rep.address || '',
    rep_postalCode: rep.postalCode || '',
    rep_phone: rep.phone || '',
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

