'use client';

import React from 'react';

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
  } = data;

  const formattedPostal = postalCode.startsWith('〒')
    ? postalCode
    : postalCode
    ? `〒 ${postalCode}`
    : '';

  // Density flags
  const is3Cols = layout.startsWith('3x');
  const isHighDensity = layout === '3x7' || layout === '3x8';

  return (
    <div
      className="w-full h-full box-border rounded-md border border-slate-700 print:border-black p-1.5 sm:p-2 bg-white flex flex-col justify-between overflow-hidden shadow-2xs print:shadow-none"
      style={{ boxSizing: 'border-box' }}
    >
      {/* ── TOP HEADER: POSTAL CODE & TYPE TAG / APP CODE ── */}
      <div className="flex items-center justify-between gap-1 border-b border-slate-300 print:border-black pb-0.5 shrink-0">
        <div className="flex items-center gap-1">
          <span
            className={`${
              isHighDensity ? 'text-[11px]' : is3Cols ? 'text-xs' : 'text-sm'
            } font-black text-slate-900 print:text-black font-mono tracking-tight`}
          >
            {formattedPostal || '〒 --- - ----'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[9px] print:text-[8.5px] font-bold text-slate-700 print:text-black truncate">
          {typeTag && (
            <span className="bg-slate-100 print:bg-transparent px-1 rounded text-slate-800 print:text-black font-black shrink-0">
              {typeTag}
            </span>
          )}
          {(appCode || customerName) && (
            <span className="text-slate-500 print:text-black truncate max-w-[90px] font-mono">
              {appCode || customerName}
            </span>
          )}
        </div>
      </div>

      {/* ── MIDDLE: FULL ADDRESS ── */}
      <div className="flex-1 my-0.5 flex flex-col justify-center min-h-0">
        <p
          className={`${
            isHighDensity
              ? 'text-[9.5px] leading-tight'
              : is3Cols
              ? 'text-[10.5px] leading-snug'
              : 'text-xs leading-normal'
          } font-medium text-slate-900 print:text-black line-clamp-2 select-all`}
        >
          {address || '(Chưa có địa chỉ)'}
        </p>
      </div>

      {/* ── RECIPIENT & DEPARTMENT (LETTERPACK STYLE) ── */}
      <div className="shrink-0 pt-0.5">
        <div className="flex items-baseline gap-1 flex-wrap">
          <span
            className={`${
              isHighDensity
                ? 'text-[11.5px]'
                : is3Cols
                ? 'text-[13px]'
                : 'text-sm'
            } font-black text-slate-900 print:text-black tracking-tight`}
          >
            {recipientName || '(Chưa có tên)'}
          </span>
          {honorific !== 'none' && (
            <span
              className={`${
                isHighDensity ? 'text-[9px]' : 'text-[10px]'
              } font-bold text-slate-800 print:text-black shrink-0`}
            >
              {honorific}
            </span>
          )}
        </div>
        {department && (
          <p
            className={`${
              isHighDensity ? 'text-[8.5px]' : 'text-[9px]'
            } text-slate-600 print:text-black font-semibold truncate leading-tight`}
          >
            {department}
          </p>
        )}
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
