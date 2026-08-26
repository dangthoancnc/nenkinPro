'use client';

import React from 'react';
import { AddressLabelCard, AddressLabelData } from './AddressLabelCard';

export type LabelLayoutType = '3x6' | '3x7' | '3x8' | '2x6' | '2x7';

export const LAYOUT_CONFIGS: Record<
  LabelLayoutType,
  {
    name: string;
    description: string;
    perPage: number;
    cols: number;
    rows: number;
    tag: string;
    slotWidthMm: number;
    slotHeightMm: number;
    gapXMm: number;
    gapYMm: number;
    frameWidthMm: number;
    frameHeightMm: number;
  }
> = {
  '3x6': {
    name: '18 Tem / Trang (3 cột × 6 hàng)',
    description: 'Chuẩn LetterPack · Khung 65 × 44.5mm · Căn lề đều 100%',
    perPage: 18,
    cols: 3,
    rows: 6,
    tag: 'Khuyên dùng LetterPack',
    slotWidthMm: 70, // 210 / 3
    slotHeightMm: 49.5, // 297 / 6
    gapXMm: 5,
    gapYMm: 5,
    frameWidthMm: 65,
    frameHeightMm: 44.5,
  },
  '3x7': {
    name: '21 Tem / Trang (3 cột × 7 hàng)',
    description: 'LetterPack Mini · Khung 65 × 38mm · Tiết kiệm giấy cao',
    perPage: 21,
    cols: 3,
    rows: 7,
    tag: 'Tiết kiệm',
    slotWidthMm: 70,
    slotHeightMm: 42.428,
    gapXMm: 5,
    gapYMm: 4.428,
    frameWidthMm: 65,
    frameHeightMm: 38,
  },
  '3x8': {
    name: '24 Tem / Trang (3 cột × 8 hàng)',
    description: 'Chuẩn Decal A-One 24面 · Khung 65 × 33mm · Siêu nhỏ gọn',
    perPage: 24,
    cols: 3,
    rows: 8,
    tag: 'Mật độ cao',
    slotWidthMm: 70,
    slotHeightMm: 37.125,
    gapXMm: 5,
    gapYMm: 4.125,
    frameWidthMm: 65,
    frameHeightMm: 33,
  },
  '2x6': {
    name: '12 Tem / Trang (2 cột × 6 hàng)',
    description: 'Phong bì tiêu chuẩn · Khung 99 × 44.5mm',
    perPage: 12,
    cols: 2,
    rows: 6,
    tag: 'Phong bì vừa',
    slotWidthMm: 105,
    slotHeightMm: 49.5,
    gapXMm: 6,
    gapYMm: 5,
    frameWidthMm: 99,
    frameHeightMm: 44.5,
  },
  '2x7': {
    name: '14 Tem / Trang (2 cột × 7 hàng)',
    description: 'Phong bì thanh mảnh · Khung 99 × 38mm',
    perPage: 14,
    cols: 2,
    rows: 7,
    tag: 'Phong bì dài',
    slotWidthMm: 105,
    slotHeightMm: 42.428,
    gapXMm: 6,
    gapYMm: 4.428,
    frameWidthMm: 99,
    frameHeightMm: 38,
  },
};

interface AddressLabelSheetProps {
  labels: AddressLabelData[];
  layout: LabelLayoutType;
  showCutLines?: boolean;
}

export const AddressLabelSheet: React.FC<AddressLabelSheetProps> = ({
  labels,
  layout,
  showCutLines = true,
}) => {
  const config = LAYOUT_CONFIGS[layout] || LAYOUT_CONFIGS['3x6'];
  const perPage = config.perPage;

  // Chunk labels into pages
  const pages: AddressLabelData[][] = [];
  for (let i = 0; i < labels.length; i += perPage) {
    pages.push(labels.slice(i, i + perPage));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  // Margin formula:
  // MarginLeft = MarginRight = gapX / 2 => MarginLeft + MarginRight = gapX (Distance between 2 adjacent frames)
  // MarginTop = MarginBottom = gapY / 2 => MarginTop + MarginBottom = gapY (Distance between 2 vertical frames)
  const padXMm = config.gapXMm / 2;
  const padYMm = config.gapYMm / 2;

  return (
    <div className="label-sheet-container w-full flex flex-col items-center gap-8 print:gap-0 print:block">
      {pages.map((pageLabels, pageIndex) => (
        <div
          key={pageIndex}
          className="label-sheet-page relative bg-white shadow-xl print:shadow-none mx-auto box-border overflow-hidden print:overflow-visible print:page-break-after-always"
          style={{
            width: '210mm',
            height: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Header indicator in screen preview mode (hidden in print) */}
          <div className="print:hidden absolute top-1 right-2 text-[9px] font-bold text-slate-400 z-10 bg-white/90 px-1 rounded">
            Trang {pageIndex + 1} / {pages.length} ({pageLabels.length} tem) · Khổ A4
          </div>

          {/* 
            Grid container occupying exact A4 dimensions: 210mm x 297mm.
            Each slot has width = 210mm / cols, height = 297mm / rows.
            Inside each slot, padding is padYMm on top/bottom, padXMm on left/right.
            This mathematically guarantees:
            - Left margin = padXMm, Right margin = padXMm => Left + Right = gapX
            - Gap between adjacent label frames = padXMm + padXMm = gapX
            - Top margin = padYMm, Bottom margin = padYMm => Top + Bottom = gapY
            - Gap between vertical label frames = padYMm + padYMm = gapY
          */}
          <div
            className="w-full h-full grid"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, ${config.slotWidthMm}mm)`,
              gridTemplateRows: `repeat(${config.rows}, ${config.slotHeightMm}mm)`,
              width: '210mm',
              height: '297mm',
            }}
          >
            {Array.from({ length: perPage }).map((_, slotIndex) => {
              const labelData = pageLabels[slotIndex];
              return (
                <div
                  key={slotIndex}
                  className={`w-full h-full box-border relative ${
                    showCutLines
                      ? 'border-r border-b border-dashed border-slate-300 print:border-slate-300'
                      : ''
                  }`}
                  style={{
                    paddingTop: `${padYMm}mm`,
                    paddingBottom: `${padYMm}mm`,
                    paddingLeft: `${padXMm}mm`,
                    paddingRight: `${padXMm}mm`,
                    boxSizing: 'border-box',
                  }}
                >
                  {labelData ? (
                    <AddressLabelCard data={labelData} layout={layout} />
                  ) : (
                    <div className="w-full h-full rounded-md border border-dashed border-slate-200 print:border-transparent flex items-center justify-center text-slate-300 print:text-transparent text-[10px]">
                      <span className="print:hidden">（Ô trống）</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
