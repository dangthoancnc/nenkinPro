/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer, Loader2, FileImage } from 'lucide-react';
import Link from 'next/link';
import { PrintContainer, PrintField } from '@/components/PrintOverlay';

export default function ApplicationPrintView() {
  const params = useParams();
  const id = params?.id as string;
  
  const [appData, setAppData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  type PrintTab = 'summary' | 'lan1_donxin_p1' | 'lan1_donxin_p2' | 'lan1_uyquyen' | 'lan2_donxin1' | 'lan2_donxin2' | 'lan2_donxin3' | 'lan2_uyquyen';
  const [activeTab, setActiveTab] = useState<PrintTab>('summary');

  useEffect(() => {
    if (!id) return;
    
    async function fetchApp() {
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAppData(data);
        } else {
          alert('Không tìm thấy hồ sơ!');
        }
      } catch (error) {
        console.error('Failed to fetch application:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="mt-4 text-slate-500 font-medium">Đang tải dữ liệu báo cáo...</p>
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

  const getSextNumber = (sex: string | null | undefined) => {
    if (sex === 'Nam' || sex === 'MALE' || sex === 'M') return '1';
    if (sex === 'Nữ' || sex === 'FEMALE' || sex === 'F') return '2';
    return '';
  };

  const renderMappedFields = (formType: PrintTab) => {
    switch (formType) {
      case 'lan1_donxin_p1':
        return (
          <>
            {/* Lần 1: Trang 1 */}
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
            
            <PrintField x={25} y={55} value={customer.bankName} />
            <PrintField x={55} y={55} value={customer.branchName} />
            <PrintField x={85} y={55} value={customer.bankCountry || 'VIET NAM'} />
            <PrintField x={85} y={58} value={customer.bankBranchCity} />
            <PrintField x={25} y={58} value={customer.bankBranchAddress} />
            
            <PrintField x={35} y={62} value={cleanStr(customer.accountNumber)} charSpacing={20} />
            <PrintField x={35} y={65} value={customer.accountName} />
            <PrintField x={35} y={68} value={customer.accountNameKatakana} />
            
            <PrintField x={35} y={72} value={cleanStr(customer.swiftCode)} charSpacing={16} />
          </>
        );

      case 'lan1_donxin_p2':
        return (
          <>
            {/* Lần 1: Trang 2 (Lịch sử làm việc) */}
            {customer.workHistories?.map((wh: any, idx: number) => {
              const yOffset = 30 + idx * 5; // Căn dòng theo lịch sử
              return (
                <React.Fragment key={wh.id}>
                  <PrintField x={20} y={yOffset} value={wh.companyName} />
                  <PrintField x={50} y={yOffset} value={wh.companyAddress} />
                  {wh.startDate && (
                    <PrintField x={70} y={yOffset} value={`${new Date(wh.startDate).getFullYear()}/${new Date(wh.startDate).getMonth() + 1}/${new Date(wh.startDate).getDate()}`} />
                  )}
                  {wh.endDate && (
                    <PrintField x={85} y={yOffset} value={`${new Date(wh.endDate).getFullYear()}/${new Date(wh.endDate).getMonth() + 1}/${new Date(wh.endDate).getDate()}`} />
                  )}
                  <PrintField x={90} y={yOffset} value={wh.pensionType || '厚生年金保険'} />
                </React.Fragment>
              )
            })}
          </>
        );

      case 'lan1_uyquyen':
        return (
          <>
            <PrintField x={60} y={10} value={mappedData.applyDate_era_jp} />
            <PrintField x={65} y={10} value={mappedData.applyDate_era_yr} />
            <PrintField x={75} y={10} value={mappedData.applyDate_m} />
            <PrintField x={85} y={10} value={mappedData.applyDate_d} />

            {/* Đại diện */}
            <PrintField x={30} y={20} value={rep.fullNameKana} />
            <PrintField x={30} y={24} value={rep.fullName} />
            <PrintField x={30} y={28} value={cleanPost(rep.postalCode)} charSpacing={12} />
            <PrintField x={30} y={31} value={rep.address} />
            <PrintField x={30} y={34} value={rep.phone} />
            <PrintField x={80} y={34} value={rep.relationship || '納税管理人'} />

            {/* Khách hàng */}
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

      case 'lan2_uyquyen':
        return (
          <>
            <PrintField x={20} y={10} value={customer.taxOffice?.name} />
            <PrintField x={60} y={10} value={mappedData.applyDate_y} />
            <PrintField x={70} y={10} value={mappedData.applyDate_m} />
            <PrintField x={80} y={10} value={mappedData.applyDate_d} />

            {/* Khách hàng */}
            <PrintField x={20} y={25} value={customer.overseasCountry || 'VIET NAM'} />
            <PrintField x={20} y={28} value={customer.zairyuAddress} />
            <PrintField x={20} y={32} value={cleanStr(customer.fullNameFurigana)} charSpacing={14} />
            <PrintField x={20} y={35} value={customer.fullName} />
            <PrintField x={70} y={35} value={cleanPost(customer.myNumber)} charSpacing={22} />
            
            <PrintField x={30} y={40} value={mappedData.dob_era_yr} />
            <PrintField x={40} y={40} value={mappedData.dob_m} />
            <PrintField x={50} y={40} value={mappedData.dob_d} />

            {/* Đại diện thuế */}
            <PrintField x={20} y={50} value={cleanPost(rep.postalCode)} charSpacing={12} />
            <PrintField x={20} y={53} value={rep.address} />
            <PrintField x={20} y={56} value={rep.fullNameKana} />
            <PrintField x={20} y={59} value={rep.fullName} />
            <PrintField x={70} y={59} value={rep.phone} />
            <PrintField x={80} y={59} value={rep.relationship || '納税管理人'} />
            
            {/* Mục 5 */}
            <PrintField x={40} y={70} value={mappedData.departureDate_y} />
            <PrintField x={50} y={70} value={mappedData.departureDate_m} />
            <PrintField x={60} y={70} value={mappedData.departureDate_d} />
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

            {/* Thuế */}
            <PrintField x={80} y={55} value={appData.withheldTax} className="text-right" /> {/* 48 */}
            <PrintField x={80} y={58} value="△" className="text-right" /> {/* 49 */}
            <PrintField x={80} y={65} value={appData.withheldTax} className="text-right" /> {/* 52 (Hoàn thuế) */}
            
            {/* Chuyển khoản (Đại diện thuế) */}
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
            
            {/* Thu nhập */}
            <PrintField x={20} y={20} value="退職" />
            <PrintField x={30} y={20} value="脱退一時金" />
            <PrintField x={40} y={20} value="日本年金機構" />
            <PrintField x={60} y={20} value={appData.totalExpectedJpy} className="text-right" />
            <PrintField x={80} y={20} value={appData.withheldTax} className="text-right" />
            
            <PrintField x={80} y={35} value={appData.withheldTax} className="text-right" /> {/* 48 */}
          </>
        );

      case 'lan2_donxin3':
        return (
          <>
            <PrintField x={15} y={10} value={customer.taxOffice?.name} />
            <PrintField x={65} y={10} value={mappedData.taxYear_era_yr} />
            
            <PrintField x={20} y={15} value={customer.overseasCountry || 'VIET NAM'} />
            <PrintField x={20} y={18} value={customer.fullName} />
            
            <PrintField x={60} y={40} value={appData.totalExpectedJpy} className="text-right" /> {/* テ */}
            
            <PrintField x={80} y={45} value="0" className="text-right" /> {/* 76 */}
            <PrintField x={80} y={50} value="0" className="text-right" /> {/* 12 */}
            <PrintField x={80} y={55} value="0" className="text-right" /> {/* 92 */}
            <PrintField x={80} y={60} value="0" className="text-right" /> {/* 93 */}
            
            <PrintField x={80} y={70} value={appData.withheldTax} className="text-right" /> {/* 48 */}
            <PrintField x={80} y={75} value={appData.withheldTax} className="text-right" /> {/* 52 */}
            
            <PrintField x={20} y={85} value="所法" />
            <PrintField x={30} y={85} value="171" charSpacing={10} />
            
            <PrintField x={40} y={90} value={appData.totalExpectedJpy} className="text-right" />
            <PrintField x={60} y={90} value={mappedData.retirementDeductionAmount} className="text-right" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* Non-printable Header Controls */}
      <div className="w-full max-w-7xl mb-6 flex flex-col md:flex-row justify-between items-center print:hidden gap-4 bg-white p-4 rounded-xl shadow-sm">
        <Link href={`/applications/${id}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại Hồ sơ</span>
        </Link>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'summary' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <FileImage className="w-4 h-4" /> Báo cáo Tổng hợp
          </button>
          <select 
            value={activeTab === 'summary' ? '' : activeTab}
            onChange={(e) => setActiveTab(e.target.value as PrintTab)}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-white text-slate-700 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="" disabled>-- Chọn Biểu mẫu In đè (Overlay) --</option>
            <optgroup label="Hồ sơ Lần 1">
              <option value="lan1_donxin_p1">Đơn xin Lần 1 (Trang 1)</option>
              <option value="lan1_donxin_p2">Đơn xin Lần 1 (Trang 2)</option>
              <option value="lan1_uyquyen">Giấy ủy quyền Lần 1</option>
            </optgroup>
            <optgroup label="Hồ sơ Lần 2">
              <option value="lan2_uyquyen">Giấy ủy thác thuế Lần 2 (納税管理人)</option>
              <option value="lan2_donxin1">Bảng 1 (確定申告書 第一表)</option>
              <option value="lan2_donxin2">Bảng 2 (確定申告書 第二表)</option>
              <option value="lan2_donxin3">Bảng 3 (確定申告書 第三表)</option>
            </optgroup>
          </select>
        </div>

        <button 
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Printer className="w-5 h-5" />
          In Bản Này
        </button>
      </div>

      {/* Printable Area */}
      
      {activeTab === 'summary' && (
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-none print:max-w-none">
          <h1 className="text-2xl font-bold text-center mb-8">Báo cáo Tổng hợp (Vui lòng chọn biểu mẫu để in)</h1>
          <p className="text-center text-slate-500">Mã KH: {customer?.code}</p>
        </div>
      )}

      {activeTab === 'lan1_donxin_p1' && (
        <PrintContainer imageUrl="/templates/nenkin_lan1/don_xin_lan_1_p1.jpg">
          {renderMappedFields('lan1_donxin_p1')}
        </PrintContainer>
      )}

      {activeTab === 'lan1_donxin_p2' && (
        <PrintContainer imageUrl="/templates/nenkin_lan1/don_xin_lan_1_p2.jpg">
          {renderMappedFields('lan1_donxin_p2')}
        </PrintContainer>
      )}

      {activeTab === 'lan1_uyquyen' && (
        <PrintContainer imageUrl="/templates/nenkin_lan1/ininjyo_yoshiki_lan_1.jpg">
          {renderMappedFields('lan1_uyquyen')}
        </PrintContainer>
      )}

      {activeTab === 'lan2_uyquyen' && (
        <PrintContainer imageUrl="/templates/nenkin_lan2/giay_uy_thac_lan_2.jpg">
          {renderMappedFields('lan2_uyquyen')}
        </PrintContainer>
      )}

      {activeTab === 'lan2_donxin1' && (
        <PrintContainer imageUrl="/templates/nenkin_lan2/bang_1_2_p1.jpg">
          {renderMappedFields('lan2_donxin1')}
        </PrintContainer>
      )}

      {activeTab === 'lan2_donxin2' && (
        <PrintContainer imageUrl="/templates/nenkin_lan2/bang_1_2_p2.jpg">
          {renderMappedFields('lan2_donxin2')}
        </PrintContainer>
      )}

      {activeTab === 'lan2_donxin3' && (
        <PrintContainer imageUrl="/templates/nenkin_lan2/bang_3.jpg">
          {renderMappedFields('lan2_donxin3')}
        </PrintContainer>
      )}

      <style jsx global>{`
        @media print {
          body { background-color: white !important; }
          @page { size: A4 portrait; margin: 0mm; }
        }
      `}</style>
    </div>
  );
}
