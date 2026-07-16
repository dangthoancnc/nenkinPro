import React, { useState, useEffect } from 'react';
import { Printer, Download, Maximize2, Loader2, X, Eye } from 'lucide-react';
import { PrintContainer, PrintField } from '@/components/PrintOverlay';
import { useGenerateDoc } from '@/hooks/useGenerateDoc';
import { MOCK_DATA } from '@/lib/mockData';

type PrintTabId = 'don_xin_lan_1_p1' | 'don_xin_lan_1_p2' | 'ininjyo_yoshiki_lan_1' | 'bang_1_2_p1' | 'bang_1_2_p2' | 'bang_3' | 'giay_uy_thac_lan_2';

interface PrintTabConfig {
  id: PrintTabId;
  label: string;
  template: 'don_xin_lan_1' | 'ininjyo_yoshiki_lan_1' | 'nouzeikanrinin' | 'bang_1_2' | 'bang_3' | 'giay_uy_thac_lan_2';
  page: number;
  bg: string;
}

const PRINT_TABS: PrintTabConfig[] = [
  { id: 'don_xin_lan_1_p1', label: 'Đơn Xin Lần 1 (Trang 1)', template: 'don_xin_lan_1', page: 0, bg: '/templates/nenkin_lan1/don_xin_lan_1_p1.jpg' },
  { id: 'don_xin_lan_1_p2', label: 'Đơn Xin Lần 1 (Trang 2)', template: 'don_xin_lan_1', page: 1, bg: '/templates/nenkin_lan1/don_xin_lan_1_p2.jpg' },
  { id: 'ininjyo_yoshiki_lan_1', label: 'Giấy Ủy Quyền Lần 1', template: 'ininjyo_yoshiki_lan_1', page: 0, bg: '/templates/nenkin_lan1/ininjyo_yoshiki_lan_1.jpg' },
  { id: 'bang_1_2_p1', label: 'Bảng 1 & 2 (Trang 1)', template: 'bang_1_2', page: 0, bg: '/templates/nenkin_lan2/bang_1_2_p1.jpg' },
  { id: 'bang_1_2_p2', label: 'Bảng 1 & 2 (Trang 2)', template: 'bang_1_2', page: 1, bg: '/templates/nenkin_lan2/bang_1_2_p2.jpg' },
  { id: 'bang_3', label: 'Bảng Số 3 (Lần 2)', template: 'bang_3', page: 0, bg: '/templates/nenkin_lan2/bang_3.jpg' },
  { id: 'giay_uy_thac_lan_2', label: 'Giấy Ủy Thác Lần 2', template: 'giay_uy_thac_lan_2', page: 0, bg: '/templates/nenkin_lan2/giay_uy_thac_lan_2.jpg' },
];

const GROUP_1: PrintTabId[] = ['don_xin_lan_1_p1', 'don_xin_lan_1_p2', 'ininjyo_yoshiki_lan_1'];
const GROUP_2: PrintTabId[] = ['bang_1_2_p1', 'bang_1_2_p2', 'bang_3', 'giay_uy_thac_lan_2'];

const A4_W = 595.32;
const A4_H = 841.92;

export default function PrintTab({ customer: initialCustomer }: { customer: any }) {
  const application = initialCustomer.applications?.[0];
  const [appDetails, setAppDetails] = useState<any | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [activeFormTab, setActiveFormTab] = useState<PrintTabId>('don_xin_lan_1_p1');
  const [showModal, setShowModal] = useState(false);
  const [showMockData, setShowMockData] = useState(true);
  
  const [jsonConfigs, setJsonConfigs] = useState<Record<string, any>>({});

  const { generate: generateDoc, isLoading: generatingDocHook } = useGenerateDoc();

  // Load App Details
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

  // Load JSON Configs
  useEffect(() => {
    const templatesToFetch = Array.from(new Set(PRINT_TABS.map(t => t.template)));
    Promise.all(
      templatesToFetch.map(t => 
        fetch(`/templates/${t}.json`).then(res => res.json()).then(data => ({ [t]: data })).catch(() => ({}))
      )
    ).then(results => {
      const merged = Object.assign({}, ...results);
      setJsonConfigs(merged);
    });
  }, []);

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
  const mappedData = appData.mappedData || {};
  
  const activeTabConfig = PRINT_TABS.find(t => t.id === activeFormTab)!;
  const currentJsonConfig = jsonConfigs[activeTabConfig.template];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = (id: PrintTabId) => {
    const tabConfig = PRINT_TABS.find(t => t.id === id);
    if (!tabConfig) return;
    generateDoc({ applicationId: application.id, templateType: tabConfig.template });
  };

  const renderDynamicFields = () => {
    if (!currentJsonConfig) return null;
    
    return Object.entries(currentJsonConfig)
      .filter(([_, coord]: [string, any]) => coord.page === activeTabConfig.page)
      .map(([tag, coord]: [string, any]) => {
        // PDF-lib coordinates are bottom-left
        // CSS coordinates are top-left relative to the background
        const xPercent = (coord.x / A4_W) * 100;
        const yPercent = ((A4_H - coord.y) / A4_H) * 100;
  
        const baseTag = tag.split('#')[0];
        
        let textToDraw = '';
        let isMock = false;
        
        if (coord.type === 'line' || coord.type === 'circle') {
            textToDraw = ' '; // trigger render for shape
        } else if (baseTag.startsWith('static_')) {
           textToDraw = coord.value || '';
        } else {
           textToDraw = mappedData[baseTag];
           
           if (!textToDraw && showMockData) {
               textToDraw = MOCK_DATA[baseTag] || '';
               if (textToDraw) isMock = true;
           }

           // Also checking marked values
           if (baseTag.endsWith('_mark')) {
               if (mappedData[baseTag]) {
                   textToDraw = '○';
                   isMock = false;
               } else if (showMockData && MOCK_DATA[baseTag]) {
                   textToDraw = '○';
                   isMock = true;
               } else {
                   textToDraw = '';
               }
           }
        }
        
        // If there's no text and it's not a shape, don't render
        if (!textToDraw && coord.type !== 'line' && coord.type !== 'circle') return null;

        return (
          <PrintField 
             key={tag} 
             x={xPercent} 
             y={yPercent} 
             value={textToDraw} 
             size={coord.size}
             type={coord.type || 'text'}
             width={coord.width}
             height={coord.height}
             thickness={coord.thickness}
             isMock={isMock}
          />
        );
      });
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
            {GROUP_1.map(type => {
              const tabConf = PRINT_TABS.find(t => t.id === type)!;
              return (
              <div 
                key={type} 
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${activeFormTab === type ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">{tabConf.label}</span>
                  <span className="text-xs text-slate-400 font-mono">{tabConf.template}.pdf</span>
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
            )})}
          </div>
        </div>

        {/* Lần 2 Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            HỒ SƠ LẦN 2
          </h3>
          <div className="flex flex-col gap-2">
            {GROUP_2.map(type => {
              const tabConf = PRINT_TABS.find(t => t.id === type)!;
              return (
              <div 
                key={type} 
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${activeFormTab === type ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">{tabConf.label}</span>
                  <span className="text-xs text-slate-400 font-mono">{tabConf.template}.pdf</span>
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
            )})}
          </div>
        </div>

      </div>

      {/* RIGHT PANE: Mini Preview overlay container (col-span-7) */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        
        {/* Preview Control Header */}
        <div className="p-3 bg-slate-800 text-white flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Xem trước: {activeTabConfig.label}
          </span>
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-700 px-2 py-1 rounded transition-colors" 
              onClick={() => setShowMockData(!showMockData)}
              title="Điền dữ liệu mẫu cho các ô trống"
            >
              <div className={`w-6 h-3 rounded-full p-0.5 transition-colors ${showMockData ? 'bg-blue-500' : 'bg-slate-600'}`}>
                <div className={`w-2 h-2 rounded-full bg-white transition-transform ${showMockData ? 'translate-x-3' : 'translate-x-0'}`}></div>
              </div>
              <span className={`text-[10px] ${showMockData ? 'text-blue-200' : 'text-slate-400'}`}>Dữ liệu mẫu</span>
            </div>
            
            <button 
              onClick={() => setShowModal(true)} 
              className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
            >
              <Maximize2 size={13} />
              Mở rộng
            </button>
          </div>
        </div>

        {/* Live Visual Overlay Render */}
        <div className="flex-1 p-6 bg-slate-100 overflow-auto flex items-start justify-center">
          <div className="w-full max-w-[500px] border border-slate-300 shadow-md rounded">
            <PrintContainer imageUrl={activeTabConfig.bg}>
              {renderDynamicFields()}
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
                  onChange={(e) => setActiveFormTab(e.target.value as PrintTabId)}
                >
                  {PRINT_TABS.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
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
                <PrintContainer imageUrl={activeTabConfig.bg}>
                  {renderDynamicFields()}
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
