/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { PrintContainer, PrintField } from '@/components/PrintOverlay';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

export default function PrintModal({ isOpen, onClose, id }: PrintModalProps) {
  const [appData, setAppData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lan1' | 'lan2' | 'single_docs'>('lan1');
  const [zoom, setZoom] = useState<number>(100);
  const [printTarget, setPrintTarget] = useState<'all' | 'single'>('all');
  const [selectedSingleDoc, setSelectedSingleDoc] = useState<string>('don_xin_lan1_p1');

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
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center max-w-sm w-full">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-600 font-medium">Đang chuẩn bị bản in mẫu...</p>
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

  // Render overlay fields
  const renderFields = (type: string) => {
    switch (type) {
      case 'lan1_p1':
        return (
          <>
            {/* Ngày gửi đơn (dùng applyDate hoặc ngày hôm nay) */}
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
            
            {/* Lấy tài khoản ngân hàng chính (hoặc tài khoản đầu tiên) */}
            {(() => {
              const primaryBank = customer.bankAccounts?.[0] || {};
              return (
                <>
                  <PrintField x={25} y={55} value={primaryBank.bankName} />
                  <PrintField x={55} y={55} value={primaryBank.branchName} />
                  <PrintField x={85} y={55} value={primaryBank.bankCountry || 'VIET NAM'} />
                  <PrintField x={25} y={58} value={primaryBank.bankBranchAddress} />
                  
                  <PrintField x={35} y={62} value={cleanStr(primaryBank.accountNumber)} charSpacing={20} />
                  <PrintField x={35} y={65} value={primaryBank.accountName} />
                  <PrintField x={35} y={68} value={primaryBank.accountNameKatakana} />
                  
                  <PrintField x={35} y={72} value={cleanStr(primaryBank.swiftCode)} charSpacing={16} />
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
              )
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

            {/* Đại diện thuế */}
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

      default:
        return null;
    }
  };

  const hasPrimaryBank = customer.bankAccounts?.length > 0;
  const primaryBankPassbookUrl = customer.bankAccounts?.[0]?.bankPassbookUrls?.[0] || customer.bankPassbookUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col h-screen print:p-0 print:bg-white print:h-auto print:static overflow-hidden">
      
      {/* Top Controller Bar - Hidden on Print */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 print:hidden shadow-lg">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold">Xem trước & In Hồ sơ</h2>
            <p className="text-[10px] text-slate-400">Khách hàng: {customer.fullName} ({customer.code})</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            type="button"
            onClick={() => { setActiveTab('lan1'); setPrintTarget('all'); }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'lan1' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Hồ sơ Lần 1
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('lan2'); setPrintTarget('all'); }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'lan2' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Hồ sơ Lần 2
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('single_docs'); setPrintTarget('single'); }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'single_docs' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            In ảnh tài liệu lẻ
          </button>
        </div>

        {/* Zoom & Action buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
            <button 
              type="button" 
              onClick={() => setZoom(prev => Math.max(50, prev - 10))} 
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono w-9 text-center text-slate-300">{zoom}%</span>
            <button 
              type="button" 
              onClick={() => setZoom(prev => Math.min(200, prev + 10))} 
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            In Bản Này
          </button>
        </div>
      </div>

      {/* Sub controls bar for single prints - Hidden on Print */}
      {activeTab === 'single_docs' && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-3 shrink-0 print:hidden">
          <span className="text-xs text-slate-400 font-medium">Tài liệu:</span>
          <select 
            value={selectedSingleDoc}
            onChange={(e) => setSelectedSingleDoc(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1 rounded-md focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="zairyu_gop">Thẻ ngoại kiều (Gộp mặt trước + sau)</option>
            <option value="zairyu_front">Thẻ ngoại kiều (Mặt trước)</option>
            <option value="zairyu_back">Thẻ ngoại kiều (Mặt sau)</option>
            <option value="passport">Ảnh Hộ chiếu</option>
            <option value="bank_passbook">Ảnh Sổ/Thẻ Ngân hàng</option>
            <option value="departure">Dấu xuất cảnh</option>
          </select>
        </div>
      )}

      {/* Main Print Viewer Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900/10 print:p-0 print:bg-white print:overflow-visible">
        
        {/* We use scale wrapper for zoom preview in browser, and reset on print */}
        <div 
          className="transition-transform duration-200 origin-top print:transform-none print:w-auto"
          style={{ transform: `scale(${zoom / 100})` }}
          id="print-overlay-content"
        >
          {/* ── HỒ SƠ LẦN 1 ─────────────────────────────── */}
          {activeTab === 'lan1' && (
            <div className="space-y-8 print:space-y-0">
              {/* Page 1: Đơn xin Lần 1 P1 */}
              <div className="break-after-page">
                <PrintContainer pdfFile="/forms/don_xin_lan_1.pdf" pageNumber={0}>
                  {renderFields('lan1_p1')}
                </PrintContainer>
              </div>

              {/* Page 2: Đơn xin Lần 1 P2 */}
              <div className="break-after-page">
                <PrintContainer pdfFile="/forms/don_xin_lan_1.pdf" pageNumber={1}>
                  {renderFields('lan1_p2')}
                </PrintContainer>
              </div>

              {/* Page 3: Giấy ủy quyền */}
              <div className="break-after-page">
                <PrintContainer pdfFile="/forms/ininjyo_yoshiki_lan_1.pdf" pageNumber={0}>
                  {renderFields('lan1_uyquyen')}
                </PrintContainer>
              </div>

              {/* Page 4: Gộp Thẻ Ngoại Kiều */}
              {customer.zairyuFrontUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-around items-center p-12 border border-slate-200/50 shadow-md mx-auto print:my-0 print:border-none print:shadow-none break-after-page">
                  <h3 className="text-center font-bold text-lg text-slate-800 print:hidden mb-4">THẺ NGOẠI KIỀU (GỘP IN A4)</h3>
                  <div className="w-[150mm] h-[95mm] border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                    <img src={customer.zairyuFrontUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Front" />
                  </div>
                  <div className="w-[150mm] h-[95mm] border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                    <img src={customer.zairyuBackUrl || customer.zairyuFrontUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Back" />
                  </div>
                </div>
              )}

              {/* Page 5: Hộ chiếu vừa khổ A4 */}
              {customer.passportUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-center items-center p-12 border border-slate-200/50 shadow-md mx-auto print:my-0 print:border-none print:shadow-none break-after-page">
                  <h3 className="text-center font-bold text-lg text-slate-800 print:hidden mb-4">ẢNH HỘ CHIẾU</h3>
                  <div className="w-[180mm] h-[250mm] overflow-hidden flex items-center justify-center">
                    <img src={customer.passportUrl} className="max-w-full max-h-full object-contain" alt="Passport" />
                  </div>
                </div>
              )}

              {/* Page 6: Sổ ngân hàng vừa khổ A4 */}
              {primaryBankPassbookUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-center items-center p-12 border border-slate-200/50 shadow-md mx-auto print:my-0 print:border-none print:shadow-none break-after-page">
                  <h3 className="text-center font-bold text-lg text-slate-800 print:hidden mb-4">SỔ NGÂN HÀNG</h3>
                  <div className="w-[180mm] h-[250mm] overflow-hidden flex items-center justify-center">
                    <img src={primaryBankPassbookUrl} className="max-w-full max-h-full object-contain" alt="Bank Passbook" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HỒ SƠ LẦN 2 ─────────────────────────────── */}
          {activeTab === 'lan2' && (
            <div className="space-y-8 print:space-y-0">
              {/* Page 1: Giấy ủy thác Lần 2 */}
              <div className="break-after-page">
                <PrintContainer pdfFile="/forms/giay_uy_thac_lan_2.pdf" pageNumber={0}>
                  {renderFields('lan2_uyquyen')}
                </PrintContainer>
              </div>

              {/* Page 2: Bảng 1 */}
              <div className="break-after-page">
                <PrintContainer pdfFile="/forms/bang_1_2.pdf" pageNumber={0}>
                  {renderFields('lan2_donxin1')}
                </PrintContainer>
              </div>

              {/* Page 3: Bảng 2 */}
              <div className="break-after-page">
                <PrintContainer pdfFile="/forms/bang_1_2.pdf" pageNumber={1}>
                  {renderFields('lan2_donxin2')}
                </PrintContainer>
              </div>

              {/* Page 4: Bảng 3 */}
              <div className="break-after-page">
                <PrintContainer pdfFile="/forms/bang_3.pdf" pageNumber={0}>
                  {renderFields('lan2_donxin3')}
                </PrintContainer>
              </div>
            </div>
          )}

          {/* ── IN ẢNH TÀI LIỆU LẺ ───────────────────────── */}
          {activeTab === 'single_docs' && (
            <div className="flex flex-col items-center">
              {selectedSingleDoc === 'zairyu_gop' && customer.zairyuFrontUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-around items-center p-12 border border-slate-200 shadow-md print:border-none print:shadow-none">
                  <div className="w-[150mm] h-[95mm] border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                    <img src={customer.zairyuFrontUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Front" />
                  </div>
                  <div className="w-[150mm] h-[95mm] border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                    <img src={customer.zairyuBackUrl || customer.zairyuFrontUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Back" />
                  </div>
                </div>
              )}

              {selectedSingleDoc === 'zairyu_front' && customer.zairyuFrontUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-center items-center p-12 border border-slate-200 shadow-md print:border-none print:shadow-none">
                  <div className="w-[180mm] h-[115mm] border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                    <img src={customer.zairyuFrontUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Front Only" />
                  </div>
                </div>
              )}

              {selectedSingleDoc === 'zairyu_back' && customer.zairyuBackUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-center items-center p-12 border border-slate-200 shadow-md print:border-none print:shadow-none">
                  <div className="w-[180mm] h-[115mm] border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                    <img src={customer.zairyuBackUrl} className="max-w-full max-h-full object-contain" alt="Zairyu Back Only" />
                  </div>
                </div>
              )}

              {selectedSingleDoc === 'passport' && customer.passportUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-center items-center p-12 border border-slate-200 shadow-md print:border-none print:shadow-none">
                  <div className="w-[180mm] h-[250mm] overflow-hidden flex items-center justify-center">
                    <img src={customer.passportUrl} className="max-w-full max-h-full object-contain" alt="Passport Only" />
                  </div>
                </div>
              )}

              {selectedSingleDoc === 'bank_passbook' && primaryBankPassbookUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-center items-center p-12 border border-slate-200 shadow-md print:border-none print:shadow-none">
                  <div className="w-[180mm] h-[250mm] overflow-hidden flex items-center justify-center">
                    <img src={primaryBankPassbookUrl} className="max-w-full max-h-full object-contain" alt="Bank Passbook Only" />
                  </div>
                </div>
              )}

              {selectedSingleDoc === 'departure' && customer.departureStampUrl && (
                <div className="w-[210mm] h-[297mm] bg-white flex flex-col justify-center items-center p-12 border border-slate-200 shadow-md print:border-none print:shadow-none">
                  <div className="w-[180mm] h-[250mm] overflow-hidden flex items-center justify-center">
                    <img src={customer.departureStampUrl} className="max-w-full max-h-full object-contain" alt="Departure Stamp Only" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global CSS style for print overlay paging */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-overlay-content, #print-overlay-content * {
            visibility: visible;
          }
          #print-overlay-content {
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
