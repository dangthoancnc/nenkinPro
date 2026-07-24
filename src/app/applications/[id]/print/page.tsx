/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer, Loader2, FileImage } from 'lucide-react';
import Link from 'next/link';
import { PrintContainer, PrintField, ImagePrintContainer, A4_W, A4_H } from '@/components/PrintOverlay';

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
      { templateName: 'giay_uy_thac_lan_2', pdfFile: '/forms/giay_uy_thac_lan_2.pdf', pageNumber: 0, fallbackType: 'lan2_uyquyen' },
      { templateName: 'bang_1_2', pdfFile: '/forms/bang_1_2.pdf', pageNumber: 0, fallbackType: 'lan2_donxin1' },
      { templateName: 'bang_1_2', pdfFile: '/forms/bang_1_2.pdf', pageNumber: 1, fallbackType: 'lan2_donxin2' },
      { templateName: 'bang_3', pdfFile: '/forms/bang_3.pdf', pageNumber: 0, fallbackType: 'lan2_donxin3' },
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
    id: 'lan2_uyquyen',
    name: '3. Giấy ủy thác (Lần 2)',
    category: 'LẦN 2',
    pages: [
      { templateName: 'giay_uy_thac_lan_2', pdfFile: '/forms/giay_uy_thac_lan_2.pdf', pageNumber: 0, fallbackType: 'lan2_uyquyen' }
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

export default function ApplicationPrintView() {
  const params = useParams();
  const id = params?.id as string;
  const searchParams = useSearchParams();
  const embed = searchParams?.get('embed') === 'true';
  
  const [appData, setAppData] = useState<any | null>(null);
  const [allConfigs, setAllConfigs] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(DOCUMENT_TYPES[0].id);
  const [zoomWidth, setZoomWidth] = useState<number>(800);

  useEffect(() => {
    if (!id) return;
    
    async function initData() {
      try {
        const [appRes, configRes] = await Promise.all([
          fetch(`/api/applications/${id}`),
          fetch('/api/templates/mapping?template=all')
        ]);

        if (appRes.ok) {
          const data = await appRes.json();
          setAppData(data);
        } else {
          alert('Không tìm thấy hồ sơ!');
        }

        if (configRes.ok) {
          const cfgData = await configRes.json();
          if (cfgData.success && cfgData.data) {
            setAllConfigs(cfgData.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch application print data:', error);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-slate-500 font-medium text-sm">Đang tải dữ liệu biểu mẫu & tọa độ...</p>
      </div>
    );
  }

  if (!appData) return null;

  const customer = appData.customer || {};
  const rep = appData.taxRepresentative || {};
  const mappedData = appData.mappedData || {};

  // Helpers
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

    const aliases: Record<string, string[]> = {
      bank_name: ['bankName', 'bank_first_name'],
      bank_branch: ['branchName', 'bank_first_branch'],
      bank_account_type: ['bankAccountType'],
      taxRep_fullName: ['rep_fullName', 'taxRep_fullNameKana'],
      taxRep_address: ['rep_address'],
      taxRep_phone: ['rep_phone'],
      taxOfficeName: ['office_name'],
      taxOfficeAddress: ['office_address'],
      address_jp: ['address', 'zairyuAddress'],
    };

    const list = aliases[baseKey] || aliases[tagId];
    if (list) {
      for (const a of list) {
        if (mappedData[a] !== undefined && mappedData[a] !== '') return mappedData[a];
      }
    }

    return '';
  };

  const renderFallbackFields = (formType: string) => {
    switch (formType) {
      case 'lan1_p1':
        return (
          <>
            <PrintField x={65} y={15} value={mappedData.applyDate_y} charSpacing={15} />
            <PrintField x={75} y={15} value={mappedData.applyDate_m} charSpacing={15} />
            <PrintField x={85} y={15} value={mappedData.applyDate_d} charSpacing={15} />
            
            <PrintField x={22} y={57.3} value={customer.fullName} className="text-xl uppercase tracking-widest" />
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

      case 'lan1_p2':
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

  const renderPageFields = (templateName: string, pageNumber: number, fallbackType: string) => {
    const config = allConfigs[templateName];
    if (config && Object.keys(config).length > 0) {
      const pageEntries = Object.entries(config).filter(([_, coord]) => coord.page === pageNumber);
      if (pageEntries.length > 0) {
        return (
          <>
            {pageEntries.map(([tagId, coord]) => {
              const xPercent = (coord.x / A4_W) * 100;
              const yPercent = ((A4_H - coord.y) / A4_H) * 100;
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
                    />
                  );
                }
                return null;
              }

              const textValue = getValueForTag(tagId, coord);
              if (!textValue) return null;

              return (
                <PrintField
                  key={tagId}
                  x={xPercent}
                  y={yPercent}
                  value={textValue}
                  size={coord.size || 12}
                  width={coord.width}
                />
              );
            })}
          </>
        );
      }
    }

    return renderFallbackFields(fallbackType);
  };

  const activeDoc = DOCUMENT_TYPES.find(d => d.id === activeTab) || DOCUMENT_TYPES[0];

  return (
    <div className={`min-h-screen flex flex-col items-center print:p-0 print:bg-white ${
      embed ? 'bg-slate-100 p-2 md:p-4' : 'bg-slate-100 p-4 md:p-8'
    }`}>
      
      {/* Non-printable Header Controls */}
      <div className="w-full max-w-7xl mb-4 flex flex-col md:flex-row justify-between items-center print:hidden gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {!embed && (
          <Link href={`/applications/${id}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Quay lại Hồ sơ</span>
          </Link>
        )}
        
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shrink-0 select-none">
          <button
            type="button"
            onClick={() => setZoomWidth(w => Math.max(400, w - 80))}
            className="w-6 h-6 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-200 shadow-2xs flex items-center justify-center transition-colors"
          >
            -
          </button>
          <span className="text-[10px] font-bold text-slate-600 px-1 min-w-[36px] text-center font-mono">
            {Math.round((zoomWidth / 800) * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomWidth(w => Math.min(1300, w + 80))}
            className="w-6 h-6 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded border border-slate-200 shadow-2xs flex items-center justify-center transition-colors"
          >
            +
          </button>
          <div className="h-3 w-[1px] bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={() => setZoomWidth(800)}
            className="text-[9px] font-semibold text-slate-600 bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs transition-colors"
          >
            Vừa khít
          </button>
        </div>

        <button 
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors text-sm"
        >
          <Printer className="w-4 h-4" />
          In Tài Liệu Đang Chọn
        </button>
      </div>

      {/* Main Two-Pane Layout */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar: Document Categories */}
        <div className="w-full md:w-64 flex flex-col gap-4 print:hidden shrink-0">
          {/* Group 1: Lần 1 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3">
            <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-2 text-indigo-600 border-b pb-1">HỒ SƠ LẦN 1</h4>
            <div className="flex flex-col gap-1">
              {DOCUMENT_TYPES.filter(d => d.id === 'lan1_tonghop' || d.category === 'LẦN 1').map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveTab(doc.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === doc.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {doc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: Lần 2 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3">
            <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-2 text-amber-600 border-b pb-1">HỒ SƠ LẦN 2</h4>
            <div className="flex flex-col gap-1">
              {DOCUMENT_TYPES.filter(d => d.id === 'lan2_tonghop' || d.category === 'LẦN 2').map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveTab(doc.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === doc.id
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {doc.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Print Preview Canvas */}
        <div className="flex-1 min-w-0 w-full bg-slate-200/40 p-4 md:p-6 rounded-2xl border border-slate-200/60 overflow-x-auto flex justify-center" id="print-page-content">
          <div 
            style={{ width: `${zoomWidth}px`, maxWidth: '100%' }} 
            className="flex flex-col gap-8 transition-all duration-200 print:w-full print:max-w-none print:m-0 print:gap-0 print:block"
          >
            {activeDoc.pages.map((page: any, idx: number) => {
              if (page.isImage) {
                const imageSets = resolveImages(page.imageKey);
                if (imageSets.length === 0) {
                  return (
                    <div key={`${activeDoc.id}-${idx}-empty`} className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 flex flex-col items-center justify-center min-h-[300px] print:hidden">
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
                    {renderPageFields(page.templateName, page.pageNumber, page.fallbackType)}
                  </PrintContainer>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-page-content, #print-page-content * {
            visibility: visible;
          }
          #print-page-content {
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
