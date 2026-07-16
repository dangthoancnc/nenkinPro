import React, { useState, useEffect } from 'react';
import { Printer, Download, Maximize2, Loader2, CheckCircle, FileText, X } from 'lucide-react';
import { PrintContainer, PrintField } from '@/components/PrintOverlay';
import { useGenerateDoc } from '@/hooks/useGenerateDoc';

type PrintTabType = 'lan1_donxin_p1' | 'lan1_donxin_p2' | 'lan1_uyquyen' | 'lan2_donxin1' | 'lan2_donxin2' | 'lan2_donxin3' | 'lan2_uyquyen';

const TEMPLATE_NAMES: Record<PrintTabType, string> = {
  lan1_donxin_p1: 'Đơn Xin Lần 1 (Trang 1)',
  lan1_donxin_p2: 'Đơn Xin Lần 1 (Trang 2)',
  lan1_uyquyen: 'Giấy Ủy Quyền Lần 1',
  lan2_donxin1: 'Bảng 1 & 2 (Trang 1)',
  lan2_donxin2: 'Bảng 1 & 2 (Trang 2)',
  lan2_donxin3: 'Bảng Số 3 (Lần 2)',
  lan2_uyquyen: 'Giấy Ủy Thác Lần 2',
};

const TEMPLATE_MAPPING: Record<PrintTabType, 'form1' | 'form2' | 'form3' | 'bang_1_2' | 'bang_3' | 'giay_uy_thac_lan_2'> = {
  lan1_donxin_p1: 'form1',
  lan1_donxin_p2: 'form1', 
  lan1_uyquyen: 'form2',
  lan2_donxin1: 'bang_1_2',
  lan2_donxin2: 'bang_1_2',
  lan2_donxin3: 'bang_3',
  lan2_uyquyen: 'giay_uy_thac_lan_2',
};

export default function PrintTab({ customer: initialCustomer }: { customer: any }) {
  const application = initialCustomer.applications?.[0];
  const [appDetails, setAppDetails] = useState<any | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [activeFormTab, setActiveFormTab] = useState<PrintTabType>('lan1_donxin_p1');
  const [showModal, setShowModal] = useState(false);

  const { generate: generateDoc, isLoading: generatingDocHook } = useGenerateDoc();

  useEffect(() => {
    if (!application?.id) {
      setLoadingApp(false);
      return;
    }
    setLoadingApp(true);
    fetch(`/api/applications/${application.id}`)
      .then(res => res.json())
      .then(data => {
        setAppDetails(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingApp(false));
  }, [application?.id]);

  if (loadingApp) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Đang tải dữ liệu hồ sơ để xem trước...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-2xl mx-auto my-8">
        <AlertCircleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Khách hàng này chưa có Hồ sơ Nenkin</h2>
        <p className="text-slate-500 mb-6">Bạn cần tạo Hồ sơ Nenkin cho khách hàng trước khi sử dụng các chức năng in ấn biểu mẫu.</p>
      </div>
    );
  }

  const appData = appDetails || application;
  const customer = appData.customer || initialCustomer;
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

  const handlePrint = () => {
    window.print();
  };

  const getBackgroundUrl = (type: PrintTabType) => {
    switch (type) {
      case 'lan1_donxin_p1': return '/templates/nenkin_lan1/don_xin_lan_1_p1.jpg';
      case 'lan1_donxin_p2': return '/templates/nenkin_lan1/don_xin_lan_1_p2.jpg';
      case 'lan1_uyquyen': return '/templates/nenkin_lan1/ininjyo_yoshiki_lan_1.jpg';
      case 'lan2_uyquyen': return '/templates/nenkin_lan2/giay_uy_thac_lan_2.jpg';
      case 'lan2_donxin1': return '/templates/nenkin_lan2/bang_1_2_p1.jpg';
      case 'lan2_donxin2': return '/templates/nenkin_lan2/bang_1_2_p2.jpg';
      case 'lan2_donxin3': return '/templates/nenkin_lan2/bang_3.jpg';
    }
  };

  const renderFields = (type: PrintTabType) => {
    switch (type) {
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
            {customer.workHistories?.map((wh: any, idx: number) => {
              const yOffset = 30 + idx * 5;
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
              );
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
    }
  };

  const handleDownloadPdf = (type: PrintTabType) => {
    const templateType = TEMPLATE_MAPPING[type];
    generateDoc({ applicationId: application.id, templateType });
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-200px)] rounded-xl border border-slate-200 shadow-inner">
      
      {/* LEFT PANE: Document Selection List (col-span-5) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Lần 1 Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            HỒ SƠ LẦN 1
          </h3>
          <div className="flex flex-col gap-2">
            {(['lan1_donxin_p1', 'lan1_donxin_p2', 'lan1_uyquyen'] as PrintTabType[]).map(type => (
              <div 
                key={type} 
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${activeFormTab === type ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">{TEMPLATE_NAMES[type]}</span>
                  <span className="text-xs text-slate-400 font-mono">{TEMPLATE_MAPPING[type]}.pdf</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveFormTab(type)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${activeFormTab === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Xem
                  </button>
                  <button 
                    onClick={() => handleDownloadPdf(type)}
                    disabled={generatingDocHook}
                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent rounded-md transition-all disabled:opacity-50"
                    title="Tải PDF gốc"
                  >
                    {generatingDocHook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lần 2 Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            HỒ SƠ LẦN 2
          </h3>
          <div className="flex flex-col gap-2">
            {(['lan2_donxin1', 'lan2_donxin2', 'lan2_donxin3', 'lan2_uyquyen'] as PrintTabType[]).map(type => (
              <div 
                key={type} 
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${activeFormTab === type ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">{TEMPLATE_NAMES[type]}</span>
                  <span className="text-xs text-slate-400 font-mono">{TEMPLATE_MAPPING[type]}.pdf</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveFormTab(type)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${activeFormTab === type ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Xem
                  </button>
                  <button 
                    onClick={() => handleDownloadPdf(type)}
                    disabled={generatingDocHook}
                    className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent rounded-md transition-all disabled:opacity-50"
                    title="Tải PDF gốc"
                  >
                    {generatingDocHook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT PANE: Mini Preview overlay container (col-span-7) */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        
        {/* Preview Control Header */}
        <div className="p-3 bg-slate-800 text-white flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Xem trước: {TEMPLATE_NAMES[activeFormTab]}
          </span>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
          >
            <Maximize2 size={13} />
            Mở rộng phóng to
          </button>
        </div>

        {/* Live Visual Overlay Render */}
        <div className="flex-1 p-6 bg-slate-100 overflow-auto flex items-start justify-center">
          <div className="w-full max-w-[500px] border border-slate-300 shadow-md rounded">
            <PrintContainer imageUrl={getBackgroundUrl(activeFormTab)}>
              {renderFields(activeFormTab)}
            </PrintContainer>
          </div>
        </div>

      </div>

      {/* FULL-SCREEN PREMIUM PRINT PREVIEW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto p-4 md:p-8 print:p-0 print:bg-white print:relative">
          
          {/* Modal Content Window */}
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:rounded-none">
            
            {/* Modal Controls (Hidden on Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm tracking-wide">Xem trước in đè</span>
                <select 
                  className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={activeFormTab}
                  onChange={(e) => setActiveFormTab(e.target.value as PrintTabType)}
                >
                  {(Object.keys(TEMPLATE_NAMES) as PrintTabType[]).map(type => (
                    <option key={type} value={type}>{TEMPLATE_NAMES[type]}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow transition-colors"
                >
                  <Printer size={14} />
                  In Biểu Mẫu
                </button>
                <button 
                  onClick={() => handleDownloadPdf(activeFormTab)}
                  disabled={generatingDocHook}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-md border border-slate-700 transition-colors disabled:opacity-50"
                >
                  {generatingDocHook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download size={14} />}
                  Tải PDF
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-4"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Preview Pane */}
            <div id="print-area" className="flex-1 p-6 bg-slate-100 flex items-center justify-center print:bg-white print:p-0">
              <div className="w-full max-w-[850px] bg-white print:max-w-none print:w-[210mm] print:h-[297mm]">
                <PrintContainer imageUrl={getBackgroundUrl(activeFormTab)}>
                  {renderFields(activeFormTab)}
                </PrintContainer>
              </div>
            </div>

          </div>

          {/* print-only CSS trick */}
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-area, #print-area * {
                visibility: visible !important;
              }
              #print-area {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                background-color: white !important;
              }
            }
          `}</style>

        </div>
      )}

    </div>
  );
}

// Simple fallback icon
function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}
