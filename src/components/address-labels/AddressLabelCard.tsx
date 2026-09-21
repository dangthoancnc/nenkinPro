'use client';

import React from 'react';

export type CustomerDisplayMode = 'inside' | 'outside' | 'code_only' | 'hidden';
export type LabelAlignMode = 'standard' | 'center_all' | 'left_all';

export interface AddressLabelData {
  id?: string;
  postalCode: string;
  address: string;
  recipientName: string;
  department?: string | null;
  phone?: string | null;
  honorific?: '御中' | '様' | '行' | 'none';
  typeTag?: string; // e.g. '【お届け先】', '【送付先】', '【申告書等提出先】', '【ご依頼主】'
  appCode?: string;
  customerName?: string;
  customerDisplayMode?: CustomerDisplayMode;
  alignMode?: LabelAlignMode;
}

export function cleanAddressString(rawAddress: string, postalCode?: string): string {
  if (!rawAddress) return '';
  let clean = rawAddress.trim();
  // Strip leading 〒 with optional postal code: "〒593-8511 ", "〒 593-8511", "593-8511 "
  clean = clean.replace(/^[〒\s]*\d{3}[-–\s]?\d{4}\s*/, '');
  clean = clean.replace(/^[〒\s]+/, '');
  if (postalCode) {
    const digits = postalCode.replace(/[^\d]/g, '');
    if (digits.length === 7) {
      const p1 = digits.slice(0, 3);
      const p2 = digits.slice(3);
      const re = new RegExp(`^[〒\\s]*${p1}[-–\\s]?${p2}\\s*`, 'i');
      clean = clean.replace(re, '');
    }
  }
  return clean.trim();
}

interface AddressLabelCardProps {
  data: AddressLabelData;
  layout: string;
}

export const AddressLabelCard: React.FC<AddressLabelCardProps> = ({
  data,
  layout,
}) => {
  const {
    postalCode = '',
    address = '',
    recipientName = '',
    department = '',
    phone = '',
    honorific = '御中',
    typeTag = '',
    appCode = '',
    customerName = '',
    customerDisplayMode = 'inside',
    alignMode = 'standard',
  } = data;

  const formattedPostal = postalCode.startsWith('〒')
    ? postalCode
    : postalCode
    ? `〒 ${postalCode}`
    : '';

  const cleanedAddress = cleanAddressString(address, postalCode);

  // Density and type flags
  const is3Cols = layout.startsWith('3x');
  const isHighDensity = layout === '3x7' || layout === '3x8';
  const hasCustomerBanner =
    customerDisplayMode === 'inside' && Boolean(customerName || appCode);
  const isIndividual =
    honorific === '様' ||
    honorific === '行' ||
    (honorific === 'none' &&
      !recipientName.includes('税務署') &&
      !recipientName.includes('機構') &&
      !recipientName.includes('センター'));

  return (
    <div
      className="w-full h-full box-border rounded-md border border-slate-700 print:border-black p-1.5 bg-white flex flex-col overflow-hidden shadow-2xs print:shadow-none"
      style={{ boxSizing: 'border-box' }}
    >
      {/* ── TOP HEADER: POSTAL CODE & TYPE / SUBMISSION TAG ── */}
      <div className="flex items-center justify-between gap-1 border-b border-slate-300 print:border-black pb-0.5 shrink-0 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`${
              isHighDensity ? 'text-[11px]' : is3Cols ? 'text-xs' : 'text-sm'
            } font-black text-slate-900 print:text-black font-mono tracking-tight`}
          >
            {formattedPostal || '〒 --- - ----'}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1 text-[9px] print:text-[8px] font-bold text-slate-700 print:text-black min-w-0 max-w-[65%] truncate">
          {customerDisplayMode === 'code_only' ? (
            <>
              {typeTag && (
                <span className="bg-slate-100 print:bg-transparent px-1 rounded text-slate-800 print:text-black font-black shrink-0">
                  {typeTag}
                </span>
              )}
              {appCode && (
                <span className="text-slate-600 print:text-black font-mono font-bold bg-slate-50 px-1 rounded border border-slate-200 print:border-none">
                  {appCode}
                </span>
              )}
            </>
          ) : (
            typeTag && (
              <span className="bg-slate-100 print:bg-transparent px-1 rounded text-slate-800 print:text-black font-black shrink-0">
                {typeTag}
              </span>
            )
          )}
        </div>
      </div>

      {/* ── CUSTOMER / APPLICANT BANNER (FULL WIDTH, PREVENTS TRUNCATION) ── */}
      {customerDisplayMode === 'inside' && (customerName || appCode) && (
        <div className="w-full bg-slate-100/90 print:bg-slate-50 border border-slate-200/90 print:border-slate-300 rounded px-1.5 py-0.5 mt-1 mb-0.5 flex items-center justify-between gap-1 shrink-0 text-[8.5px] print:text-[8px] leading-tight">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-teal-800 print:text-black font-black shrink-0 text-[8px]">
              【申告者】
            </span>
            <span className="font-bold text-slate-900 print:text-black truncate uppercase tracking-tight">
              {customerName || '(Chưa có tên)'}
            </span>
          </div>
          {appCode && (
            <span className="font-mono font-bold text-slate-600 print:text-black text-[8px] shrink-0 bg-white print:bg-transparent px-1 rounded border border-slate-200 print:border-none">
              {appCode}
            </span>
          )}
        </div>
      )}

      {/* ── MIDDLE: ADDRESS & RECIPIENT GROUP (BALANCED & HARMONIOUS) ── */}
      <div
        className={`flex-1 min-h-0 flex flex-col ${
          hasCustomerBanner
            ? 'justify-center py-0.5'
            : 'justify-between py-1 sm:py-1.5'
        }`}
      >
        {/* Cleaned Address */}
        <div
          className={`min-w-0 pt-0.5 ${
            alignMode === 'center_all' ? 'text-center' : 'text-left'
          }`}
        >
          <p
            className={`${
              isHighDensity
                ? 'text-[9px] leading-tight'
                : is3Cols
                ? 'text-[10.5px] leading-snug'
                : 'text-[11.5px] leading-normal'
            } font-medium text-slate-800 print:text-black select-all line-clamp-2`}
          >
            {cleanedAddress || '(Chưa có địa chỉ)'}
          </p>
        </div>

        {/* Recipient Name & Department / Furigana */}
        <div
          className={`min-w-0 pt-1 pb-0.5 flex flex-col ${
            alignMode === 'center_all' || (alignMode === 'standard' && isIndividual)
              ? 'items-center text-center'
              : 'items-start text-left'
          }`}
        >
          <div
            className={`leading-snug flex items-baseline flex-wrap gap-y-0.5 ${
              alignMode === 'center_all' || (alignMode === 'standard' && isIndividual)
                ? 'justify-center'
                : 'justify-start'
            }`}
          >
            <span
              className={`${
                isIndividual
                  ? isHighDensity
                    ? 'text-[12.5px]'
                    : is3Cols
                    ? 'text-[14.5px] sm:text-[15px]'
                    : 'text-base sm:text-[16.5px]'
                  : isHighDensity
                  ? 'text-[10.5px]'
                  : recipientName.length > 14
                  ? 'text-[11.5px]'
                  : is3Cols
                  ? 'text-[12.5px]'
                  : 'text-[13.5px]'
              } font-black text-slate-900 print:text-black tracking-wide inline`}
            >
              {recipientName || '(Chưa có tên)'}
            </span>
            {honorific !== 'none' && (
              <span
                className={`${
                  isIndividual
                    ? isHighDensity
                      ? 'text-[10px] ml-1.5'
                      : 'text-xs ml-2'
                    : isHighDensity
                    ? 'text-[8.5px] ml-1'
                    : 'text-[9.5px] ml-1.5'
                } font-bold text-slate-800 print:text-black inline-block shrink-0`}
              >
                {honorific}
              </span>
            )}
          </div>
          {department && (
            <p
              className={`${
                isIndividual
                  ? isHighDensity
                    ? 'text-[8.5px]'
                    : 'text-[9.5px] font-medium text-slate-500 print:text-slate-700'
                  : isHighDensity
                  ? 'text-[8px]'
                  : 'text-[8.5px] font-semibold text-slate-600 print:text-black'
              } tracking-wide truncate leading-tight mt-0.5`}
            >
              {department}
            </p>
          )}
        </div>
      </div>

      {/* ── BOTTOM: PHONE NUMBER ── */}
      {phone && (
        <div className="pt-0.5 border-t border-slate-200 print:border-slate-300 flex items-center justify-between text-[8px] print:text-[8px] text-slate-600 print:text-black shrink-0 font-mono">
          <span>
            <strong className="font-bold">TEL:</strong> {phone}
          </span>
        </div>
      )}
    </div>
  );
};
