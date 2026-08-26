/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2, FileImage, Download } from 'lucide-react';
import { PrintContainer, PrintField, ImagePrintContainer, A4_W, A4_H } from '@/components/PrintOverlay';
import dynamic from 'next/dynamic';
const PdfMapperClient = dynamic(() => import('@/app/admin/pdf-mapper/PdfMapperClient'), { ssr: false });

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  initialTemplate?: string;
  initialTab?: string;
}

const TEMPLATE_TO_TAB: Record<string, string> = {
  don_xin_lan_1: 'lan1_donxin',
  ininjyo_yoshiki_lan_1: 'lan1_uyquyen',
  bang_1_2: 'lan2_donxin_12',
  bang_3: 'lan2_donxin_3',
  nouzeikanrinin: 'lan2_nouzeikanrinin',
};

const DOCUMENT_TYPES = [
  // ── LẦN 1 ────────────────────────────
  {
    id: 'lan1_tonghop',
    name: 'TỔNG HỢP (LẦN 1)',
    category: 'LẦN 1',
    pages: [
      { templateName: 'don_xin_lan_1', pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 0, fallbackType: 'lan1_p1' },
      { templateName: 'don_xin_lan_1', pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 1, fallbackType: 'lan1_p2' },
      { templateName: 'ininjyo_yoshiki_lan_1', pdfFile: '/forms/ininjyo_yoshiki_lan_1.pdf', pageNumber: 0, fallbackType: 'lan1_uyquyen' },
      { isImage: true, imageKey: 'zairyu' },
      { isImage: true, imageKey: 'passport' },
      { isImage: true, imageKey: 'nenkinBook' },
      { isImage: true, imageKey: 'bank_first' },
      { isImage: true, imageKey: 'departureStamp' },
    ]
  },
  {
    id: 'lan1_donxin',
    name: '1. Đơn xin Nenkin (Lần 1)',
    category: 'LẦN 1',
    pages: [
      { templateName: 'don_xin_lan_1', pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 0, fallbackType: 'lan1_p1' },
      { templateName: 'don_xin_lan_1', pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 1, fallbackType: 'lan1_p2' }
    ]
  },
  {
    id: 'lan1_uyquyen',
    name: '2. Giấy ủy quyền (Lần 1)',
    category: 'LẦN 1',
    pages: [
      { templateName: 'ininjyo_yoshiki_lan_1', pdfFile: '/forms/ininjyo_yoshiki_lan_1.pdf', pageNumber: 0, fallbackType: 'lan1_uyquyen' }
    ]
  },
  {
    id: 'lan1_zairyu',
    name: '3. Thẻ ngoại kiều (Mặt trước + sau)',
    category: 'LẦN 1',
    pages: [
      { isImage: true, imageKey: 'zairyu' }
    ]
  },
  {
    id: 'lan1_passport',
    name: '4. Ảnh hộ chiếu',
    category: 'LẦN 1',
    pages: [
      { isImage: true, imageKey: 'passport' }
    ]
  },
  {
    id: 'lan1_nenkin_book',
    name: '5. Sổ Nenkin (Sổ hưu trí)',
    category: 'LẦN 1',
    pages: [
      { isImage: true, imageKey: 'nenkinBook' }
    ]
  },
  {
    id: 'lan1_bank',
    name: '6. Tài liệu ngân hàng nhận Nenkin (Lần 1)',
    category: 'LẦN 1',
    pages: [
      { isImage: true, imageKey: 'bank_first' }
    ]
  },
  {
    id: 'lan1_departure',
    name: '7. Dấu xuất cảnh',
    category: 'LẦN 1',
    pages: [
      { isImage: true, imageKey: 'departureStamp' }
    ]
  },

  // ── LẦN 2 ────────────────────────────
  {
    id: 'lan2_tonghop',
    name: 'TỔNG HỢP (LẦN 2)',
    category: 'LẦN 2',
    pages: [
      { templateName: 'nouzeikanrinin', pdfFile: '/forms/nouzeikanrinin.pdf', pageNumber: 0, fallbackType: 'lan2_nouzeikanrinin' },
      { templateName: 'bang_1_2', pdfFile: '/forms/bang_1_2.pdf', pageNumber: 0, fallbackType: 'lan2_donxin1' },
      { templateName: 'bang_1_2', pdfFile: '/forms/bang_1_2.pdf', pageNumber: 1, fallbackType: 'lan2_donxin2' },
      { templateName: 'bang_3', pdfFile: '/forms/bang_3.pdf', pageNumber: 0, fallbackType: 'lan2_donxin3' },
      { isImage: true, imageKey: 'zairyu' },
      { isImage: true, imageKey: 'passport' },
      { isImage: true, imageKey: 'nenkinBook' },
      { isImage: true, imageKey: 'bank_second' },
      { isImage: true, imageKey: 'departureStamp' },
    ]
  },
  {
    id: 'lan2_donxin_12',
    name: '1. Đơn xin Lần 2 (Tờ 1, 2)',
    category: 'LẦN 2',
    pages: [
      { templateName: 'bang_1_2', pdfFile: '/forms/bang_1_2.pdf', pageNumber: 0, fallbackType: 'lan2_donxin1' },
      { templateName: 'bang_1_2', pdfFile: '/forms/bang_1_2.pdf', pageNumber: 1, fallbackType: 'lan2_donxin2' }
    ]
  },
  {
    id: 'lan2_donxin_3',
    name: '2. Đơn xin Lần 2 (Tờ 3)',
    category: 'LẦN 2',
    pages: [
      { templateName: 'bang_3', pdfFile: '/forms/bang_3.pdf', pageNumber: 0, fallbackType: 'lan2_donxin3' }
    ]
  },
  {
    id: 'lan2_nouzeikanrinin',
    name: '3. Đại diện thuế (Lần 2)',
    category: 'LẦN 2',
    pages: [
      { templateName: 'nouzeikanrinin', pdfFile: '/forms/nouzeikanrinin.pdf', pageNumber: 0, fallbackType: 'lan2_nouzeikanrinin' }
    ]
  },
  {
    id: 'lan2_zairyu',
    name: '4. Thẻ ngoại kiều (Mặt trước + sau)',
    category: 'LẦN 2',
    pages: [
      { isImage: true, imageKey: 'zairyu' }
    ]
  },
  {
    id: 'lan2_passport',
    name: '5. Ảnh hộ chiếu',
    category: 'LẦN 2',
    pages: [
      { isImage: true, imageKey: 'passport' }
    ]
  },
  {
    id: 'lan2_nenkin_book',
    name: '6. Sổ Nenkin (Lần 2)',
    category: 'LẦN 2',
    pages: [
      { isImage: true, imageKey: 'nenkinBook' }
    ]
  },
  {
    id: 'lan2_bank',
    name: '7. Tài liệu ngân hàng (Lần 2)',
    category: 'LẦN 2',
    pages: [
      { isImage: true, imageKey: 'bank_second' }
    ]
  },
  {
    id: 'lan2_departure',
    name: '8. Dấu xuất cảnh (Lần 2)',
    category: 'LẦN 2',
    pages: [
      { isImage: true, imageKey: 'departureStamp' }
    ]
  }
];

export default function PrintModal({ isOpen, onClose, id, initialTemplate, initialTab }: PrintModalProps) {
  const [appData, setAppData] = useState<any | null>(null);
  const [allConfigs, setAllConfigs] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (initialTab) return initialTab;
    if (initialTemplate && TEMPLATE_TO_TAB[initialTemplate]) return TEMPLATE_TO_TAB[initialTemplate];
    return DOCUMENT_TYPES[0].id;
  });
  const [zoomWidth, setZoomWidth] = useState<number>(800);
  const [isLayoutMode, setIsLayoutMode] = useState(false);

  useEffect(() => {
    if (!isOpen || !id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/applications/${id}`).then((r) => r.json()),
      fetch('/api/templates/mapping?template=all', { cache: 'no-store' })
        .then((r) => r.json())
        .then((res) => (res.success ? res.data : {})),
    ])
      .then(([appRes, configs]) => {
        setAppData(appRes);
        setAllConfigs(configs);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching print data:', err);
        setLoading(false);
      });
  }, [isOpen, id]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center max-w-xs w-full">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-slate-700 font-bold text-sm">Đang tải biểu mẫu & tọa độ...</p>
        </div>
      </div>
    );
  }

  if (!appData) return null;

  const customer = appData.customer || {};
  const rep = appData.taxRepresentative || {};
  const mappedData = appData.mappedData || {};

  const cleanStr = (str: string | null | undefined) => str?.replace(/[\s-]/g, '') || '';
  const cleanPost = (str: string | null | undefined) => str?.replace(/-/g, '') || '';
  
  const getEraNumber = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const ymd = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    if (ymd >= 20190501) return '5';
    if (ymd >= 19890108) return '4';
    if (ymd >= 19261225) return '3';
    return '';
  };

  const resolveImages = (key: string): string[][] => {
    switch (key) {
      case 'zairyu':
        if (customer.zairyuFrontUrl || customer.zairyuBackUrl) {
          return [[customer.zairyuFrontUrl, customer.zairyuBackUrl].filter(Boolean) as string[]];
        }
        return [];
      case 'passport':
        if (customer.passportUrl) return [[customer.passportUrl]];
        return [];
      case 'nenkinBook':
        if (customer.nenkinBookUrl) return [[customer.nenkinBookUrl]];
        return [];
      case 'departureStamp':
        if (customer.departureStampUrl) return [[customer.departureStampUrl]];
        return [];
      case 'bank_first': {
        const banks = customer.bankAccounts || [];
        const fBank = banks.find((b: any) => b.purpose === 'FIRST_REFUND' || b.purpose === 'BOTH') || banks[0];
        if (fBank && fBank.bankPassbookUrls && fBank.bankPassbookUrls.length > 0) {
          return fBank.bankPassbookUrls.filter(Boolean).map((url: string) => [url]);
        }
        if (customer.bankPassbookUrl) return [[customer.bankPassbookUrl]];
        return [];
      }
      case 'bank_second': {
        const banks = customer.bankAccounts || [];
        const sBank = banks.find((b: any) => b.purpose === 'SECOND_REFUND' || b.purpose === 'BOTH') || banks[0];
        if (sBank && sBank.bankPassbookUrls && sBank.bankPassbookUrls.length > 0) {
          return sBank.bankPassbookUrls.filter(Boolean).map((url: string) => [url]);
        }
        if (customer.bankPassbookUrl) return [[customer.bankPassbookUrl]];
        return [];
      }
      default:
        return [];
    }
  };

  const getValueForTag = (tagId: string, coord: any): string => {
    const baseKey = tagId.split('#')[0];
    
    if (baseKey.startsWith('static_')) {
      return coord.value || '';
    }

    if (mappedData[tagId] !== undefined && mappedData[tagId] !== '') {
      return mappedData[tagId];
    }

    if (mappedData[baseKey] !== undefined && mappedData[baseKey] !== '') {
      return mappedData[baseKey];
    }

    // Common aliases
    const aliases: Record<string, string[]> = {
      // Bank aliases
      bank_name: ['bankName', 'bank_first_name', 'taxRep_bankName'],
      bank_branch: ['branchName', 'bank_first_branch', 'taxRep_branchName'],
      bank_account_type: ['bankAccountType'],
      swift: ['swiftCode', 'bank1st_swiftCode'],
      swiftCode: ['swift', 'bank1st_swiftCode'],
      bankName: ['bank_name', 'taxRep_bankName'],
      branchName: ['bank_branch', 'taxRep_branchName'],
      accountNumber: ['taxRep_accountNumber'],
      taxRep_bankName: ['bankName', 'bank_name'],
      taxRep_branchName: ['branchName', 'bank_branch'],
      taxRep_accountNumber: ['accountNumber'],
      taxRep_accountName: ['accountName'],
      taxRep_accountType_1_mark: ['account_type_futsu_mark'],
      account_type_futsu_mark: ['taxRep_accountType_1_mark'],
      taxRep_accountType_2_mark: ['account_type_toza_mark'],
      bank_type_bank_mark: ['taxRep_bank_type_bank_mark'],
      bank_type_shiten_mark: ['taxRep_bank_type_shiten_mark'],
      // Income aliases
      incomeSourceAmount: ['totalExpectedJpy', 'income_amount'],
      totalExpectedJpy: ['incomeSourceAmount'],
      incomeSourceWithheld: ['withheldTax', 'tax2ndJpy'],
      withheldTax: ['incomeSourceWithheld'],
      // Postal code aliases
      postalCodeFormat: ['postalCode', 'post'],
      postalCode: ['postalCodeFormat', 'post'],
      taxRep_postalCodeFormat: ['taxRep_postalCode', 'taxRep_post', 'rep_post'],
      taxRep_postalCode: ['taxRep_postalCodeFormat', 'taxRep_post', 'rep_post'],
      // My Number & Nenkin aliases
      myNumber: ['my_num'],
      nenkinNumber: ['nenkin'],
      // Address aliases
      address_jp: ['address', 'zairyuAddress'],
      address: ['address_jp', 'zairyuAddress'],
      zairyuAddress: ['address_jp', 'address'],
      // Representative aliases (rep_* ↔ taxRep_*)
      rep_fullName: ['taxRep_fullName'],
      rep_fullName_kata: ['taxRep_fullName_kata', 'taxRep_fullNameKana'],
      rep_address: ['taxRep_address'],
      taxRep_fullName: ['rep_fullName', 'taxRep_fullNameKana'],
      taxRep_address: ['rep_address'],
      taxRep_phone: ['rep_phone'],
      // Office aliases
      taxOfficeName: ['taxOffice_name', 'office_name', 'taxOffice_shortName'],
      taxOffice_name: ['taxOfficeName', 'taxOffice_shortName', 'office_name'],
      taxOffice_shortName: ['taxOfficeName', 'taxOffice_name', 'office_name'],
      taxOfficeAddress: ['office_address', 'taxOffice_address'],
      taxOffice_address: ['taxOfficeAddress', 'office_address'],
      // Furigana aliases
      fullNameFurigana: ['fullName_kata'],
      fullName_kata: ['fullNameFurigana'],
      // Sex checkmarks
      sex_M_mark: ['gender_male_check', 'gender_male_check_mark'],
      sex_F_mark: ['gender_female_check', 'gender_female_check_mark'],
      gender_male_check_mark: ['sex_M_mark', 'gender_male_check'],
      gender_female_check_mark: ['sex_F_mark', 'gender_female_check'],
    };

    const list = aliases[baseKey] || aliases[tagId];
    if (list) {
      for (const a of list) {
        if (mappedData[a] !== undefined && mappedData[a] !== '') return mappedData[a];
      }
    }

    // Dynamic aliases for indexed split tags (e.g. rep_post_3 → taxRep_post_3, bank_5 → accountNumber_5)
    const splitAliases: [RegExp, string][] = [
      [/^rep_post_(\d+)$/, 'taxRep_post_$1'],
      [/^taxRep_post_(\d+)$/, 'rep_post_$1'],
      [/^bank_(\d+)$/, 'accountNumber_$1'],
      [/^accountNumber_(\d+)$/, 'bank_$1'],
      [/^taxRep_account_(\d+)$/, 'taxRep_account_dig_$1'],
      [/^taxRep_account_dig_(\d+)$/, 'taxRep_account_$1'],
      [/^post_(\d+)$/, 'postalCode_dig_$1'],
      [/^postalCode_dig_(\d+)$/, 'post_$1'],
    ];
    for (const [pattern, replacement] of splitAliases) {
      const match = baseKey.match(pattern);
      if (match) {
        const aliasKey = baseKey.replace(pattern, replacement);
        if (mappedData[aliasKey] !== undefined && mappedData[aliasKey] !== '') return mappedData[aliasKey];
      }
    }

    // Fallback: try coord.value for static text
    if (coord?.value !== undefined) return coord.value;

    return '';
  };

  // Fallback fields removed — all rendering now uses JSON template configs from /public/templates/

  const renderPageFields = (templateName: string, pageNumber: number, fallbackType: string, pageWidth: number = A4_W, pageHeight: number = A4_H) => {
    const config = allConfigs[templateName];
    if (config && Object.keys(config).length > 0) {
      const pageEntries = Object.entries(config).filter(([_, coord]) => coord.page === pageNumber);
      if (pageEntries.length > 0) {
        return (
          <>
            {pageEntries.map(([tagId, coord]) => {
              const xPercent = (coord.x / pageWidth) * 100;
              const yPercent = ((pageHeight - coord.y) / pageHeight) * 100;
              const baseKey = tagId.split('#')[0];

              if (coord.type === 'line' || baseKey.startsWith('line_')) {
                return (
                  <PrintField
                    key={tagId}
                    x={xPercent}
                    y={yPercent}
                    type="line"
                    width={coord.width}
                    thickness={coord.thickness}
                    pageWidth={pageWidth}
                    pageHeight={pageHeight}
                  />
                );
              }

              if (coord.type === 'circle' || baseKey.startsWith('circle_')) {
                const isStatic = baseKey.startsWith('static_') || baseKey.startsWith('circle_');
                const val = getValueForTag(tagId, coord);
                if (isStatic || val === 'true' || val === '○' || val === '1' || !!val) {
                  return (
                    <PrintField
                      key={tagId}
                      x={xPercent}
                      y={yPercent}
                      type="circle"
                      width={coord.width || 20}
                      height={coord.height || 20}
                      thickness={coord.thickness || 1}
                      pageWidth={pageWidth}
                      pageHeight={pageHeight}
                    />
                  );
                }
                return null;
              }

              const textValue = getValueForTag(tagId, coord);
              if (!textValue) return null;

              const monetaryKeys = [
                'totalExpectedJpy', 'received1stJpy', 'received2ndJpy', 'withheldTax',
                'retirementDeductionAmount', 'taxableRetirementIncome', 'calculatedTax',
                'refundAmount', 'tax2ndJpy', 'incomeSourceAmount', 'incomeSourceWithheld',
                'serviceFeeJpy', 'averageStandardRemuneration'
              ];
              let formattedTextValue = textValue;
              if (monetaryKeys.includes(baseKey) && formattedTextValue) {
                const numStr = String(formattedTextValue).replace(/\D/g, '');
                if (numStr) {
                  formattedTextValue = Number(numStr).toLocaleString('en-US');
                }
              }

              return (
                <PrintField
                  key={tagId}
                  x={xPercent}
                  y={yPercent}
                  value={formattedTextValue}
                  size={coord.size || 12}
                  width={coord.width}
                  height={coord.height}
                  align={coord.align}
                  fontWeight={coord.fontWeight}
                  pageWidth={pageWidth}
                  pageHeight={pageHeight}
                />
              );
            })}
          </>
        );
      }
    }

    // No template config found — show placeholder
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold shadow">
          ⚠️ Chưa có cấu hình tọa độ cho biểu mẫu này. Vui lòng thiết lập tại /admin/pdf-mapper
        </div>
      </div>
    );
  };

  const activeDoc = DOCUMENT_TYPES.find(d => d.id === activeTab) || DOCUMENT_TYPES[0];

  if (isLayoutMode) {
    const firstTemplate = activeDoc.pages.find(p => p.templateName)?.templateName;
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col h-screen overflow-hidden">
        <PdfMapperClient 
          inlineAppId={id} 
          inlineTemplate={firstTemplate} 
          onClose={() => setIsLayoutMode(false)} 
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-sm flex flex-col h-screen print:p-0 print:bg-white print:h-auto print:static overflow-hidden">
      
      {/* ── TOP CONTROLLER BAR ── */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shrink-0 print:hidden border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">Xem trước & In Hồ sơ</h2>
            <p className="text-[10px] text-slate-400">Khách hàng: <strong className="text-white">{customer.fullName}</strong> ({customer.code || id.slice(0, 8)})</p>
          </div>
        </div>

        {/* Zoom & Action buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5 select-none">
            <button
              type="button"
              onClick={() => setZoomWidth(w => Math.max(400, w - 80))}
              className="w-6 h-6 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="text-[10px] font-bold text-slate-300 px-1 min-w-[36px] text-center font-mono">
              {Math.round((zoomWidth / 800) * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomWidth(w => Math.min(1300, w + 80))}
              className="w-6 h-6 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded flex items-center justify-center transition-colors"
            >
              +
            </button>
            <div className="h-3 w-[1px] bg-slate-700 mx-0.5" />
            <button
              type="button"
              onClick={() => setZoomWidth(800)}
              className="text-[9px] font-semibold text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-1.5 py-0.5 rounded transition-colors"
            >
              Vừa khít
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const url = `/api/applications/${id}/export-bundle?stage=all`;
              window.open(url, '_blank');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Tải PDF Trọn bộ
          </button>

          {activeDoc.pages.some(p => p.templateName) && (
            <button
              type="button"
              onClick={() => {
                setIsLayoutMode(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-md shadow-amber-600/20 transition-colors"
              title="Mở PDF Mapper với dữ liệu hồ sơ này"
            >
              <FileImage className="w-3.5 h-3.5" />
              Tùy chỉnh Tọa độ
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            In Tài Liệu Đang Chọn
          </button>
        </div>
      </div>

      {/* ── TWO-PANE MAIN CONTAINER ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* ── LEFT SIDEBAR: DOCUMENT CATEGORY LIST ── */}
        <div className="w-72 bg-slate-900/90 border-r border-slate-800 p-3 overflow-y-auto shrink-0 print:hidden flex flex-col gap-3">
          
          {/* Category Group 1: HỒ SƠ LẦN 1 */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/70 p-2.5">
            <h4 className="font-bold text-[10px] uppercase tracking-wider mb-2 text-indigo-400 border-b border-slate-700/80 pb-1 flex items-center gap-1.5">
              <span>📄</span> HỒ SƠ LẦN 1
            </h4>
            <div className="flex flex-col gap-1">
              {DOCUMENT_TYPES.filter(d => d.id === 'lan1_tonghop' || d.category === 'LẦN 1').map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setActiveTab(doc.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === doc.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  {doc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category Group 2: HỒ SƠ LẦN 2 */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700/70 p-2.5">
            <h4 className="font-bold text-[10px] uppercase tracking-wider mb-2 text-amber-400 border-b border-slate-700/80 pb-1 flex items-center gap-1.5">
              <span>📋</span> HỒ SƠ LẦN 2
            </h4>
            <div className="flex flex-col gap-1">
              {DOCUMENT_TYPES.filter(d => d.id === 'lan2_tonghop' || d.category === 'LẦN 2').map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setActiveTab(doc.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === doc.id
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  {doc.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT MAIN CANVAS: PRINT PREVIEW ── */}
        <div className="flex-1 min-w-0 bg-slate-950/40 p-4 md:p-6 overflow-y-auto overflow-x-auto flex justify-center print:p-0 print:bg-white print:overflow-visible" id="print-modal-content">
          <div 
            style={{ width: `${zoomWidth}px`, maxWidth: '100%' }} 
            className="flex flex-col gap-8 transition-all duration-200 print:w-full print:max-w-none print:m-0 print:gap-0 print:block"
          >
            {activeDoc.pages.map((page: any, idx: number) => {
              if (page.isImage) {
                const imageSets = resolveImages(page.imageKey);
                if (imageSets.length === 0) {
                  return (
                    <div key={`${activeDoc.id}-${idx}-empty`} className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 flex flex-col items-center justify-center min-h-[300px] print:hidden">
                      <FileImage className="w-10 h-10 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-semibold text-center">Tài liệu "{page.imageKey === 'zairyu' ? 'Thẻ ngoại kiều' : page.imageKey === 'passport' ? 'Hộ chiếu' : page.imageKey === 'departureStamp' ? 'Dấu xuất cảnh' : 'Thông tin ngân hàng'}" chưa được tải lên hoặc bị trống</p>
                    </div>
                  );
                }
                return imageSets.map((imgArr, imgIdx) => (
                  <div key={`${activeDoc.id}-${idx}-img-${imgIdx}`} className="print:break-after-page mb-8 print:mb-0">
                    <ImagePrintContainer images={imgArr} />
                  </div>
                ));
              }
              return (
                <div key={`${activeDoc.id}-${idx}`} className="print:break-after-page mb-8 print:mb-0">
                  <PrintContainer pdfFile={page.pdfFile} pageNumber={page.pageNumber}>
                    {(dims) => renderPageFields(page.templateName, page.pageNumber, page.fallbackType, dims.width, dims.height)}
                  </PrintContainer>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Global CSS style for print overlay paging */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-modal-content, #print-modal-content * {
            visibility: visible;
          }
          #print-modal-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            transform: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .break-after-page {
            page-break-after: always;
            break-after: page;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
}
