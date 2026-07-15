/**
 * documentMapper.ts
 * Data Contract Source: MAPPING_GUIDE.md
 * Author: PE (Perplexity) — Sprint 4 Form Generator M4
 * AN (AntiGravity) should extend/adjust after confirming .docx templates.
 */

import type { Customer, NenkinApplication, WorkHistory, TaxOffice, TaxRepresentative } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateType = 'form1' | 'form2' | 'form3';

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

// ---------------------------------------------------------------------------
// Shared: Customer base tags (used by all 3 templates)
// ---------------------------------------------------------------------------

function mapCustomerBase(customer: Customer): Record<string, string> {
  const dob = formatDate(customer.dateOfBirth ? new Date(customer.dateOfBirth) : null);
  const era = customer.dateOfBirth ? toJapaneseEra(new Date(customer.dateOfBirth)) : null;

  return {
    fullName:        customer.fullName ?? '',
    fullName_kata:   (customer as Record<string, unknown>).fullNameKata as string ?? '',
    nationality:     (customer as Record<string, unknown>).nationality as string ?? '',
    address_jp:      (customer as Record<string, unknown>).addressJp as string ?? '',
    phone:           customer.phone ?? '',
    gender:          customer.gender === 'MALE' ? '\u7537' : '\u5973',
    gender_male_check:   customer.gender === 'MALE'   ? '\u2713' : '',
    gender_female_check: customer.gender === 'FEMALE' ? '\u2713' : '',

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
    ...splitChars((customer as Record<string, unknown>).nenkinNumber as string ?? '', 'nenkin', 10, true),
    ...splitChars((customer as Record<string, unknown>).myNumber as string ?? '', 'my_num', 12, true),
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
  const dob = formatDate((rep as Record<string, unknown>).dateOfBirth ? new Date((rep as Record<string, unknown>).dateOfBirth as string) : null);
  return {
    rep_fullName:      (rep as Record<string, unknown>).fullName as string ?? '',
    rep_fullName_kata: (rep as Record<string, unknown>).fullNameKata as string ?? '',
    rep_address:       (rep as Record<string, unknown>).address as string ?? '',
    rep_phone:         (rep as Record<string, unknown>).phone as string ?? '',
    rep_relation:      (rep as Record<string, unknown>).relation as string ?? '',
    rep_dob_y: dob.y,
    rep_dob_m: dob.m,
    rep_dob_d: dob.d,
    ...splitChars((rep as Record<string, unknown>).postalCode as string ?? '', 'rep_post', 7, true),
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
  });

  // Last job
  const lastJob = workHistories[workHistories.length - 1];
  const lastEndDate = lastJob?.endDate ? formatDate(new Date(lastJob.endDate)) : { y: '', m: '' };

  // Bank info
  const bankTags: Record<string, string> = {
    bank_name:         (customer as Record<string, unknown>).bankName as string ?? '',
    bank_branch:       (customer as Record<string, unknown>).bankBranch as string ?? '',
    bank_account_type: (customer as Record<string, unknown>).bankAccountType as string ?? '',
    bank_account_name: (customer as Record<string, unknown>).bankAccountName as string ?? '',
    ...splitChars((customer as Record<string, unknown>).bankAccountNumber as string ?? '', 'bank', 7, true),
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
    case 'form1': return mapTemplate1(input);
    case 'form2': return mapTemplate2(input);
    case 'form3': return mapTemplate3(input);
    default:      throw new Error(`Unknown templateType: ${templateType}`);
  }
}
