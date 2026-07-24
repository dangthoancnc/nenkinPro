/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2, FileImage } from 'lucide-react';
import { PrintContainer, PrintField, ImagePrintContainer } from '@/components/PrintOverlay';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

const DOCUMENT_TYPES = [
  // ── LẦN 1 ────────────────────────────
  {
    id: 'lan1_tonghop',
    name: 'TỔNG HỢP (LẦN 1)',
    category: 'LẦN 1',
    pages: [
      { pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 0, fieldType: 'lan1_donxin_p1' },
      { pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 1, fieldType: 'lan1_donxin_p2' },
      { pdfFile: '/forms/ininjyo_yoshiki_lan_1.pdf', pageNumber: 0, fieldType: 'lan1_uyquyen' },
      { isImage: true, imageKey: 'zairyu' },
      { isImage: true, imageKey: 'passport' },
      { isImage: true, imageKey: 'bank_first' },
      { isImage: true, imageKey: 'bank_first_confirm' },
      { isImage: true, imageKey: 'departureStamp' },
    ]
  },
  {
    id: 'lan1_donxin',
    name: '1. Đơn xin Nenkin (Lần 1)',
    category: 'LẦN 1',
    pages: [
      { pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 0, fieldType: 'lan1_donxin_p1' },
      { pdfFile: '/forms/don_xin_lan_1.pdf', pageNumber: 1, fieldType: 'lan1_donxin_p2' }
    ]
  },
  {
    id: 'lan1_uyquyen',
    name: '2. Giấy ủy quyền (Lần 1)',
    category: 'LẦN 1',
    pages: [
      { pdfFile: '/forms/ininjyo_yoshiki_lan_1.pdf', pageNumber: 0, fieldType: 'lan1_uyquyen' }
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
    id: 'lan1_bank',
    name: '5. Sổ ngân hàng',
    category: 'LẦN 1',
    pages: [
      { isImage: true, imageKey: 'bank_first' }
    ]
  },
  {
    id: 'lan1_bank_confirm',
    name: '6. Giấy xác nhận ngân hàng',
    category: 'LẦN 1',
    pages: [
      { isImage: true, imageKey: 'bank_first_confirm' }
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
      { pdfFile: '/forms/bang_1_2.pdf', pageNumber: 0, fieldType: 'lan2_donxin1' },
      { pdfFile: '/forms/bang_1_2.pdf', pageNumber: 1, fieldType: 'lan2_donxin2' },
      { pdfFile: '/forms/bang_3.pdf', pageNumber: 0, fieldType: 'lan2_donxin3' },
      { pdfFile: '/forms/giay_uy_thac_lan_2.pdf', pageNumber: 0, fieldType: 'lan2_uyquyen' },
      { isImage: true, imageKey: 'zairyu' },
      { isImage: true, imageKey: 'passport' },
      { isImage: true, imageKey: 'bank_second' },
      { isImage: true, imageKey: 'bank_second_confirm' },
    ]
  },
  {
    id: 'lan2_donxin_12',
    name: '1. Đơn xin Lần 2 (Tờ 1, 2)',
    category: 'LẦN 2',
    pages: [
      { pdfFile: '/forms/bang_1_2.pdf', pageNumber: 0, fieldType: 'lan2_donxin1' },
      { pdfFile: '/forms/bang_1_2.pdf', pageNumber: 1, fieldType: 'lan2_donxin2' }
    ]
  },
  {
    id: 'lan2_donxin_3',
    name: '2. Đơn xin Lần 2 (Tờ 3)',
    category: 'LẦN 2',
    pages: [
      { pdfFile: '/forms/bang_3.pdf', pageNumber: 0, fieldType: 'lan2_donxin3' }
    ]
  },
  {
    id: 'lan2_uyquyen',
    name: '3. Giấy ủy thác (Lần 2)',
    category: 'LẦN 2',
    pages: [
      { pdfFile: '/forms/giay_uy_thac_lan_2.pdf', pageNumber: 0, fieldType: 'lan2_uyquyen' }
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
    id: 'lan2_bank',
    name: '6. Sổ ngân hàng',
    category: 'LẦN 2',
    pages: [
      { isImage: true, imageKey: 'bank_second' }
    ]
  },
  {
    id: 'lan2_bank_confirm',
    name: '7. Giấy xác nhận ngân hàng',
    category: 'LẦN 2',
    pages: [
      { isImage: true, imageKey: 'bank_second_confirm' }
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

export default function PrintModal({ isOpen, onClose, id }: PrintModalProps) {
  const [appData, setAppData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(DOCUMENT_TYPES[0].id);
  const [zoomWidth, setZoomWidth] = useState<number>(800);

  useEffect(() => {
    if (!id || !isOpen) return;

    async function fetchApp() {
      setLoading(true);
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAppData(data);
        } else {
          alert('Không tìm thấy dữ liệu hồ sơ để in!');
        }
      } catch (error) {
        console.error('Failed to fetch print data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [id, isOpen]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center max-w-xs w-full">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-slate-700 font-bold text-sm">Đang nạp mẫu hồ sơ in...</p>
        </div>
      </div>
    );
  }

  if (!appData) return null;

  const customer = appData.customer || {};
  const rep = appData.taxRepresentative || {};
  const mappedData = appData.mappedData || {};

  // Clean strings helpers
  const cleanStr = (str: string | null | undefined) => str?.replace(/[\s-]/g, '') || '';
  const cleanPost = (str: string | null | undefined) => str?.replace(/-/g, '') || '';
  
  const getEraNumber = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const ymd = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    if (ymd >= 20190501) return '5'; // Reiwa
    if (ymd >= 19890108) return '4'; // Heisei
    if (ymd >= 19261225) return '3'; // Showa
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
      case 'departureStamp':
        if (customer.departureStampUrl) return [[customer.departureStampUrl]];
        return [];
      case 'bank_first': {
        const banks = customer.bankAccounts || [];
        const fBank = banks.find((b: any) => b.purpose === 'FIRST_REFUND' || b.purpose === 'BOTH') || banks[0];
        if (!fBank || !fBank.bankPassbookUrls || fBank.bankPassbookUrls.length === 0) {
          return customer.bankPassbookUrl ? [[customer.bankPassbookUrl]] : [];
        }
        return [[fBank.bankPassbookUrls[0]]];
      }
      case 'bank_first_confirm': {
        const banks = customer.bankAccounts || [];
        const fBank = banks.find((b: any) => b.purpose === 'FIRST_REFUND' || b.purpose === 'BOTH') || banks[0];
        if (!fBank || !fBank.bankPassbookUrls || fBank.bankPassbookUrls.length <= 1) return [];
        return fBank.bankPassbookUrls.slice(1).map((url: string) => [url]);
      }
      case 'bank_second': {
        const banks = customer.bankAccounts || [];
        const sBank = banks.find((b: any) => b.purpose === 'SECOND_REFUND' || b.purpose === 'BOTH') || banks[0];
        if (!sBank || !sBank.bankPassbookUrls || sBank.bankPassbookUrls.length === 0) {
          return customer.bankPassbookUrl ? [[customer.bankPassbookUrl]] : [];
        }
        return [[sBank.bankPassbookUrls[0]]];
      }
      case 'bank_second_confirm': {
        const banks = customer.bankAccounts || [];
        const sBank = banks.find((b: any) => b.purpose === 'SECOND_REFUND' || b.purpose === 'BOTH') || banks[0];
        if (!sBank || !sBank.bankPassbookUrls || sBank.bankPassbookUrls.length <= 1) return [];
        return sBank.bankPassbookUrls.slice(1).map((url: string) => [url]);
      }
      default:
        return [];
    }
  };

  const renderMappedFields = (formType: string) => {
    switch (formType) {
      case 'lan1_donxin_p1':
        return (
          <>
            <PrintField x={65} y={15} value={mappedData.applyDate_y} charSpacing={15} />
            <PrintField x={75} y={15} value={mappedData.applyDate_m} charSpacing={15} />
            <PrintField x={85} y={15} value={mappedData.applyDate_d} charSpacing={15} />
            
            <PrintField x={22} y={23.5} value={customer.fullName} className="text-xl uppercase tracking-widest" />
            <PrintField x={28} y={27} value={cleanStr(mappedData.dob_y)} charSpacing={16} />
            <PrintField x={40} y={27} value={mappedData.dob_m} charSpacing={16} />
            <PrintField x={48} y={27} value={mappedData.dob_d} charSpacing={16} />
            
            <PrintField x={25} y={30} value={customer.nationality || 'VIET NAM'} />
            
            <PrintField x={30} y={35} value={customer.overseasCountry || 'VIET NAM'} />
            <PrintField x={30} y={38} value={customer.overseasStreet} />
            <PrintField x={30} y={40} value={customer.overseasCity} />
            <PrintField x={60} y={40} value={customer.overseasProvince} />
            <PrintField x={80} y={40} value={customer.overseasPostalCode} />

            <PrintField x={35} y={45} value={cleanPost(customer.nenkinNumber)} charSpacing={24} />
            
            {(() => {
              const primaryBank = customer.bankAccounts?.[0] || {};
              return (
                <>
                  <PrintField x={25} y={55} value={primaryBank.bankName || customer.bankName} />
                  <PrintField x={55} y={55} value={primaryBank.branchName || customer.branchName} />
                  <PrintField x={85} y={55} value={primaryBank.bankCountry || customer.bankCountry || 'VIET NAM'} />
                  <PrintField x={25} y={58} value={primaryBank.bankBranchAddress || customer.bankBranchAddress} />
                  
                  <PrintField x={35} y={62} value={cleanStr(primaryBank.accountNumber || customer.accountNumber)} charSpacing={20} />
                  <PrintField x={35} y={65} value={primaryBank.accountName || customer.accountName} />
                  <PrintField x={35} y={68} value={primaryBank.accountNameKatakana || customer.accountNameKatakana} />
                  
                  <PrintField x={35} y={72} value={cleanStr(primaryBank.swiftCode || customer.swiftCode)} charSpacing={16} />
                </>
              );
            })()}
          </>
        );

      case 'lan1_donxin_p2':
        return (
          <>
            {customer.workHistories?.slice(0, 5).map((wh: any, idx: number) => {
              const yOffset = 30 + idx * 5.2;
              return (
                <React.Fragment key={wh.id || idx}>
                  <PrintField x={15} y={yOffset} value={wh.companyName} className="max-w-[25%] truncate text-[9px]" />
                  <PrintField x={40} y={yOffset} value={wh.companyAddress} className="max-w-[25%] truncate text-[9px]" />
                  {wh.startDate && (
                    <PrintField x={68} y={yOffset} value={`${new Date(wh.startDate).getFullYear()}/${new Date(wh.startDate).getMonth() + 1}/${new Date(wh.startDate).getDate()}`} className="text-[9px]" />
                  )}
                  {wh.endDate && (
                    <PrintField x={80} y={yOffset} value={`${new Date(wh.endDate).getFullYear()}/${new Date(wh.endDate).getMonth() + 1}/${new Date(wh.endDate).getDate()}`} className="text-[9px]" />
                  )}
                  <PrintField x={91} y={yOffset} value={wh.pensionType === 'EPI' ? '厚生年金' : '国民年金'} className="text-[9px]" />
                </React.Fragment>
              );
            })}
          </>
        );

      case 'lan1_uyquyen':
        return (
          <>
            <PrintField x={60} y={10} value={mappedData.applyDate_era_jp || '令和'} />
            <PrintField x={68} y={10} value={mappedData.applyDate_era_yr} />
            <PrintField x={76} y={10} value={mappedData.applyDate_m} />
            <PrintField x={84} y={10} value={mappedData.applyDate_d} />

            <PrintField x={30} y={20} value={rep.fullNameKana} />
            <PrintField x={30} y={24} value={rep.fullName} />
            <PrintField x={30} y={28} value={cleanPost(rep.postalCode)} charSpacing={12} />
            <PrintField x={30} y={31} value={rep.address} />
            <PrintField x={30} y={34} value={rep.phone} />
            <PrintField x={80} y={34} value={rep.relationship || '納税管理人'} />

            <PrintField x={30} y={40} value={cleanPost(customer.nenkinNumber)} charSpacing={20} />
            <PrintField x={30} y={44} value={cleanStr(customer.fullNameFurigana)} charSpacing={14} />
            <PrintField x={30} y={48} value={customer.fullName} />
            
            <PrintField x={30} y={52} value={mappedData.dob_era_yr} />
            <PrintField x={40} y={52} value={mappedData.dob_m} />
            <PrintField x={50} y={52} value={mappedData.dob_d} />
            
            <PrintField x={30} y={56} value={cleanPost(customer.postalCode)} charSpacing={12} />
            <PrintField x={30} y={59} value={customer.zairyuAddress} />
            <PrintField x={30} y={62} value={customer.phone} />
          </>
        );

      case 'lan2_donxin1':
        return (
          <>
            <PrintField x={15} y={10} value={customer.taxOffice?.name} />
            <PrintField x={65} y={10} value={mappedData.taxYear_era_yr} />
            
            <PrintField x={20} y={15} value={cleanPost(customer.postalCode)} charSpacing={15} />
            <PrintField x={20} y={18} value={customer.zairyuAddress} className="text-[12px] max-w-[40%]" />
            <PrintField x={20} y={20} value={cleanStr(customer.fullNameFurigana)} charSpacing={12} />
            <PrintField x={20} y={22} value={customer.fullName} className="text-lg" />
            
            <PrintField x={70} y={22} value={cleanPost(customer.myNumber)} charSpacing={22} />
            
            <PrintField x={78} y={18} value={getEraNumber(customer.dob)} />
            <PrintField x={82} y={18} value={mappedData.dob_era_yr} charSpacing={12} />
            <PrintField x={88} y={18} value={mappedData.dob_m} charSpacing={12} />
            <PrintField x={94} y={18} value={mappedData.dob_d} charSpacing={12} />
            
            <PrintField x={20} y={25} value={customer.occupation} />
            <PrintField x={80} y={25} value={customer.headOfHouseholdName} />
            <PrintField x={90} y={25} value={customer.relationshipToHead} />

            <PrintField x={80} y={55} value={mappedData.withheldTax} className="text-right" />
            <PrintField x={80} y={58} value="△" className="text-right" />
            <PrintField x={80} y={65} value={mappedData.withheldTax} className="text-right" />
            
            <PrintField x={20} y={75} value={rep.bankName} />
            <PrintField x={40} y={75} value={rep.branchName} />
            <PrintField x={60} y={75} value={rep.accountNumber} />
            <PrintField x={80} y={75} value={rep.fullName} />
          </>
        );

      case 'lan2_donxin2':
        return (
          <>
            <PrintField x={20} y={8} value={cleanStr(customer.fullNameFurigana)} charSpacing={12} />
            <PrintField x={20} y={10} value={customer.fullName} />
            
            <PrintField x={20} y={20} value="退職" />
            <PrintField x={30} y={20} value="脱退一時金" />
            <PrintField x={40} y={20} value="日本年金機構" />
            <PrintField x={60} y={20} value={mappedData.totalExpectedJpy} className="text-right" />
            <PrintField x={80} y={20} value={mappedData.withheldTax} className="text-right" />
            
            <PrintField x={80} y={35} value={mappedData.withheldTax} className="text-right" />
          </>
        );

      case 'lan2_donxin3':
        return (
          <>
            <PrintField x={15} y={10} value={customer.taxOffice?.name} />
            <PrintField x={65} y={10} value={mappedData.taxYear_era_yr} />
            
            <PrintField x={20} y={15} value={customer.overseasCountry || 'VIET NAM'} />
            <PrintField x={20} y={18} value={customer.fullName} />
            
            <PrintField x={60} y={40} value={mappedData.totalExpectedJpy} className="text-right" />
            
            <PrintField x={80} y={45} value="0" className="text-right" />
            <PrintField x={80} y={50} value="0" className="text-right" />
            <PrintField x={80} y={55} value="0" className="text-right" />
            <PrintField x={80} y={60} value="0" className="text-right" />
            
            <PrintField x={80} y={70} value={mappedData.withheldTax} className="text-right" />
            <PrintField x={80} y={75} value={mappedData.withheldTax} className="text-right" />
            
            <PrintField x={20} y={85} value="所法" />
            <PrintField x={30} y={85} value="171" charSpacing={10} />
            
            <PrintField x={40} y={90} value={mappedData.totalExpectedJpy} className="text-right" />
            <PrintField x={60} y={90} value={mappedData.retirementDeductionAmount} className="text-right" />
          </>
        );

      case 'lan2_uyquyen':
        return (
          <>
            <PrintField x={20} y={10} value={customer.taxOffice?.name} />
            <PrintField x={60} y={10} value={mappedData.applyDate_y} />
            <PrintField x={70} y={10} value={mappedData.applyDate_m} />
            <PrintField x={80} y={10} value={mappedData.applyDate_d} />

            <PrintField x={20} y={25} value={customer.overseasCountry || 'VIET NAM'} />
            <PrintField x={20} y={28} value={customer.zairyuAddress} />
            <PrintField x={20} y={32} value={cleanStr(customer.fullNameFurigana)} charSpacing={14} />
            <PrintField x={20} y={35} value={customer.fullName} />
            <PrintField x={70} y={35} value={cleanPost(customer.myNumber)} charSpacing={22} />
            
            <PrintField x={30} y={40} value={mappedData.dob_era_yr} />
            <PrintField x={40} y={40} value={mappedData.dob_m} />
            <PrintField x={50} y={40} value={mappedData.dob_d} />

            <PrintField x={20} y={50} value={cleanPost(rep.postalCode)} charSpacing={12} />
            <PrintField x={20} y={53} value={rep.address} />
            <PrintField x={20} y={56} value={rep.fullNameKana} />
            <PrintField x={20} y={59} value={rep.fullName} />
            <PrintField x={70} y={59} value={rep.phone} />
            <PrintField x={80} y={59} value={rep.relationship || '納税管理人'} />
            
            <PrintField x={40} y={70} value={mappedData.departureDate_y} />
            <PrintField x={50} y={70} value={mappedData.departureDate_m} />
            <PrintField x={60} y={70} value={mappedData.departureDate_d} />
          </>
        );

      default:
        return null;
    }
  };

  const activeDoc = DOCUMENT_TYPES.find(d => d.id === activeTab) || DOCUMENT_TYPES[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col h-screen print:p-0 print:bg-white print:h-auto print:static overflow-hidden">
      
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
                    {renderMappedFields(page.fieldType)}
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
