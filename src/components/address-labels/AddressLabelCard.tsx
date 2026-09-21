'use client';

import React from 'react';

export type CustomerDisplayMode = 'inside' | 'outside' | 'code_only' | 'hidden';

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
  } = data;

  const formattedPostal = postalCode.startsWith('〒')
    ? postalCode
    : postalCode
    ? `〒 ${postalCode}`
    : '';

  const cleanedAddress = cleanAddressString(address, postalCode);

  // Density flags
  const is3Cols = layout.startsWith('3x');
  const isHighDensity = layout === '3x7' || layout === '3x8';

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

      {/* ── MIDDLE: ADDRESS & RECIPIENT GROUP (CONSISTENT SPACING) ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-center py-0.5">
        {/* Cleaned Address (No duplicate postal code) */}
        <p
          className={`${
            isHighDensity
              ? 'text-[9px] leading-tight mb-0.5'
              : is3Cols
              ? 'text-[10px] leading-snug mb-1'
              : 'text-[11px] leading-normal mb-1.5'
          } font-medium text-slate-800 print:text-black line-clamp-2 select-all`}
        >
          {cleanedAddress || '(Chưa có địa chỉ)'}
        </p>

        {/* Recipient Name & Department (Protected against orphan honorific wrapping) */}
        <div className="leading-snug">
          <span
            className={`${
              isHighDensity
                ? 'text-[10.5px]'
                : recipientName.length > 14
                ? 'text-[11.5px]'
                : is3Cols
                ? 'text-[12.5px]'
                : 'text-[13.5px]'
            } font-black text-slate-900 print:text-black tracking-tight inline`}
          >
            {recipientName || '(Chưa có tên)'}
          </span>
          {honorific !== 'none' && (
            <span
              className={`${
                isHighDensity ? 'text-[8.5px]' : 'text-[9.5px]'
              } font-bold text-slate-800 print:text-black ml-1.5 inline-block shrink-0`}
            >
              {honorific}
            </span>
          )}
          {department && (
            <p
              className={`${
                isHighDensity ? 'text-[8px]' : 'text-[8.5px]'
              } text-slate-600 print:text-black font-semibold truncate leading-tight mt-0.5`}
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
