"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Save, MousePointer2 } from 'lucide-react';


// Setup PDF worker in useEffect to avoid SSR error

const generateSplitTags = (prefix: string, count: number, labelPrefix: string) => 
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}_${i + 1}`, label: `${labelPrefix} [${i + 1}]` }));

const TAG_GROUPS = [
  {
    name: '1. Thông tin cá nhân',
    tags: [
      { id: 'fullName', label: 'Họ và tên (Romaji)' }, { id: 'fullNameFurigana', label: 'Họ tên (Furigana)' },
      { id: 'lastName', label: 'Họ' }, { id: 'firstName', label: 'Tên' },
      { id: 'sex', label: 'Giới tính' }, { id: 'nationality', label: 'Quốc tịch' },
      { id: 'myNumber', label: 'Mã số cá nhân' }, ...generateSplitTags('my_num', 12, 'MyNumber'),
      { id: 'nenkinNumber', label: 'Mã số hưu trí' }, ...generateSplitTags('nenkin', 10, 'Nenkin'),
      { id: 'phone', label: 'Số ĐT' }, ...generateSplitTags('phone', 11, 'SĐT'),
      { id: 'permRes_YES_mark', label: 'Vĩnh trú: CÓ (○)' }, { id: 'permRes_NO_mark', label: 'Vĩnh trú: KHÔNG (○)' },
      { id: 'sex_M_mark', label: 'Giới tính: Nam (○)' }, { id: 'sex_F_mark', label: 'Giới tính: Nữ (○)' },
      { id: 'occupation', label: 'Nghề nghiệp' },
      { id: 'headOfHouseholdName', label: 'Tên Chủ hộ' }, { id: 'relationshipToHead', label: 'Quan hệ với chủ hộ' },
    ]
  },
  {
    name: '2. Địa chỉ & Nơi cư trú',
    tags: [
      { id: 'address', label: 'Địa chỉ tại Nhật' },
      { id: 'postalCodeFormat', label: 'Mã Bưu điện Nhật' }, ...generateSplitTags('post', 7, 'Mã BĐ Nhật'),
      { id: 'overseasCountry', label: 'Quốc gia hải ngoại' },
      { id: 'overseasStreet', label: 'Số nhà, đường hải ngoại' },
      { id: 'overseasCity', label: 'Thành phố hải ngoại' },
      { id: 'overseasProvince', label: 'Tỉnh/Bang hải ngoại' },
      { id: 'overseasPostalCode', label: 'Mã bưu điện hải ngoại' },
      { id: 'permResDate_full', label: 'Ngày cấp vĩnh trú (YYYY/MM/DD)' },
      { id: 'permResDate_y', label: 'Năm cấp vĩnh trú' }, { id: 'permResDate_m', label: 'Tháng cấp vĩnh trú' }, { id: 'permResDate_d', label: 'Ngày cấp vĩnh trú' },
      ...generateSplitTags('permResDate_y', 4, 'Năm cấp vĩnh trú'), ...generateSplitTags('permResDate_m', 2, 'Tháng cấp vĩnh trú'), ...generateSplitTags('permResDate_d', 2, 'Ngày cấp vĩnh trú'),
    ]
  },
  {
    name: '3. Ngày tháng',
    tags: [
      { id: 'dob_y', label: 'Năm sinh (Tây)' }, { id: 'dob_m', label: 'Tháng sinh' }, { id: 'dob_d', label: 'Ngày sinh' },
      { id: 'dob_era', label: 'Thời đại (Romaji)' }, { id: 'dob_era_jp', label: 'Thời đại (Kanji)' }, { id: 'dob_era_yr', label: 'Năm sinh (Nhật)' },
      ...generateSplitTags('dob_y', 4, 'Năm sinh'), ...generateSplitTags('dob_m', 2, 'Tháng sinh'), ...generateSplitTags('dob_d', 2, 'Ngày sinh'), ...generateSplitTags('dob_era_yr', 2, 'Năm sinh (Nhật)'),
      { id: 'departureDate_y', label: 'Năm xuất cảnh' }, { id: 'departureDate_m', label: 'Tháng xuất cảnh' }, { id: 'departureDate_d', label: 'Ngày xuất cảnh' },
      ...generateSplitTags('departureDate_y', 4, 'Năm xuất cảnh'), ...generateSplitTags('departureDate_m', 2, 'Tháng xuất cảnh'), ...generateSplitTags('departureDate_d', 2, 'Ngày xuất cảnh'),
      { id: 'applyDate_y', label: 'Năm làm đơn' }, { id: 'applyDate_m', label: 'Tháng làm đơn' }, { id: 'applyDate_d', label: 'Ngày làm đơn' },
      ...generateSplitTags('applyDate_y', 4, 'Năm làm đơn'), ...generateSplitTags('applyDate_m', 2, 'Tháng làm đơn'), ...generateSplitTags('applyDate_d', 2, 'Ngày làm đơn'),
      { id: 'applyDate_era_yr', label: 'Năm làm đơn (Nhật)' }, ...generateSplitTags('applyDate_era_yr', 2, 'Năm làm đơn (Nhật)'),
      { id: 'noticeDate_y', label: 'Năm thông báo' }, { id: 'noticeDate_m', label: 'Tháng thông báo' }, { id: 'noticeDate_d', label: 'Ngày thông báo' },
      ...generateSplitTags('noticeDate_y', 4, 'Năm thông báo'), ...generateSplitTags('noticeDate_m', 2, 'Tháng thông báo'), ...generateSplitTags('noticeDate_d', 2, 'Ngày thông báo'),
      ...generateSplitTags('taxYear_era_yr', 2, 'Năm khai thuế (Nhật)'),
    ]
  },
  {
    name: '4. Tài khoản Ngân hàng',
    tags: [
      { id: 'bankName', label: 'Tên Ngân hàng' }, { id: 'branchName', label: 'Tên chi nhánh' }, { id: 'bankBranchAddress', label: 'Địa chỉ chi nhánh' },
      { id: 'bankBranchCity', label: 'TP chi nhánh' }, { id: 'bankCountry', label: 'Quốc gia NH' },
      { id: 'accountNumber', label: 'Số tài khoản' }, { id: 'accountName', label: 'Tên tài khoản (Romaji)' },
      { id: 'accountNameKatakana', label: 'Tên tài khoản (Katakana)' },
      { id: 'swiftCode', label: 'SWIFT Code' },
      ...generateSplitTags('bank', 7, 'Số TK'), ...generateSplitTags('swift', 11, 'SWIFT'),
    ]
  },
  {
    name: '5. Lịch sử làm việc',
    tags: Array.from({ length: 5 }).flatMap((_, i) => [
      { id: `workHistory_${i+1}_companyName`, label: `Cty ${i+1}: Tên` }, { id: `workHistory_${i+1}_companyAddress`, label: `Cty ${i+1}: Địa chỉ` },
      { id: `workHistory_${i+1}_start_full`, label: `Cty ${i+1} BĐ (YYYY/MM/DD)` },
      ...generateSplitTags(`workHistory_${i+1}_start_y`, 4, `Cty ${i+1} Năm BĐ`), ...generateSplitTags(`workHistory_${i+1}_start_m`, 2, `Cty ${i+1} Tháng BĐ`), ...generateSplitTags(`workHistory_${i+1}_start_d`, 2, `Cty ${i+1} Ngày BĐ`),
      { id: `workHistory_${i+1}_end_full`, label: `Cty ${i+1} KT (YYYY/MM/DD)` },
      ...generateSplitTags(`workHistory_${i+1}_end_y`, 4, `Cty ${i+1} Năm KT`), ...generateSplitTags(`workHistory_${i+1}_end_m`, 2, `Cty ${i+1} Tháng KT`), ...generateSplitTags(`workHistory_${i+1}_end_d`, 2, `Cty ${i+1} Ngày KT`),
      { id: `workHistory_${i+1}_type_1_mark`, label: `Cty ${i+1}: Quốc dân (○)` },
      { id: `workHistory_${i+1}_type_2_mark`, label: `Cty ${i+1}: LĐXH (○)` },
      { id: `workHistory_${i+1}_type_3_mark`, label: `Cty ${i+1}: Hàng hải (○)` },
      { id: `workHistory_${i+1}_type_4_mark`, label: `Cty ${i+1}: Hỗ tương (○)` },
    ])
  },
  {
    name: '6. Nộp thuế & Đại diện',
    tags: [
      { id: 'taxOfficeName', label: 'Tên Cục Thuế' }, { id: 'taxOfficeAddress', label: 'Địa chỉ Cục Thuế' },
      ...generateSplitTags('tax_post', 7, 'Mã BĐ Thuế'),
      { id: 'rep_fullName', label: 'Đại diện: Tên' }, { id: 'rep_fullNameKana', label: 'Đại diện: Tên Furigana' },
      { id: 'rep_phone', label: 'Đại diện: SĐT' }, ...generateSplitTags('rep_phone', 11, 'Đại diện: SĐT'),
      { id: 'rep_postalCodeFormat', label: 'Đại diện: Mã BĐ' }, ...generateSplitTags('rep_post', 7, 'Đại diện: Mã BĐ'),
      { id: 'rep_address', label: 'Đại diện: Địa chỉ' }, { id: 'rep_relationship', label: 'Đại diện: Quan hệ' },
    ]
  },
  {
    name: '7. Tính Thuế (Bảng 1, 2, 3)',
    tags: [
      { id: 'totalExpectedJpy', label: 'Tổng tiền Nenkin (¥)' },
      { id: 'withheldTax', label: 'Thuế đã khấu trừ (¥)' },
      { id: 'received1stJpy', label: 'Tiền nhận Lần 1 (¥)' },
      { id: 'received2ndJpy', label: 'Tiền nhận Lần 2 (¥)' },
      { id: 'tax2ndJpy', label: 'Thuế Lần 2 (¥)' },
      { id: 'retirementDeductionAmount', label: 'Mức miễn giảm thu nhập' },
      { id: 'taxableRetirementIncome', label: 'Thu nhập chịu thuế (76)' },
      { id: 'calculatedTax', label: 'Thuế đã tính (92)' },
      { id: 'refundAmount', label: 'Tiền xin hoàn (114)' },
      { id: 'serviceFeeJpy', label: 'Phí dịch vụ (¥)' },
      { id: 'exchangeRate', label: 'Tỷ giá' },
      { id: 'serviceFeeVnd', label: 'Phí dịch vụ (VNĐ)' },
    ]
  }
];

type Coordinate = { x: number; y: number; size: number; page: number; value?: string; type?: string; width?: number; height?: number; thickness?: number };
type ConfigMap = Record<string, Coordinate>;

export default function PdfMapperPage() {
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [config, setConfig] = useState<ConfigMap>({});
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.0);

  const pdfOptions = React.useMemo(() => ({
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
  }), []);

  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  const getTagLabel = (tagId: string) => {
    if (!tagId) return '';
    const baseTag = tagId.split('#')[0];
    for (const group of TAG_GROUPS) {
      const found = group.tags.find(t => t.id === baseTag);
      if (found) return found.label;
    }
    if (baseTag.startsWith('static_')) return 'Chữ tĩnh';
    if (baseTag.startsWith('line_')) return 'Đường kẻ';
    if (baseTag.startsWith('circle_')) return 'Khoanh tròn';
    return baseTag;
  };

  // Fetch templates list and setup PDF worker
  useEffect(() => {
    // Setup PDF worker on client side only, using local file to prevent CORS errors
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    fetch('/api/templates/mapping')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setTemplates(data.data);
          if (data.data.length > 0) setSelectedTemplate(data.data[0]);
        }
      });
  }, []);

  // Fetch config when template changes
  useEffect(() => {
    if (!selectedTemplate) return;
    fetch(`/api/templates/mapping?template=${selectedTemplate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setConfig(data.data);
        } else {
          setConfig({});
        }
      });
  }, [selectedTemplate]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTag || !config[selectedTag]) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if(document.activeElement === document.body) e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setConfig(prev => {
          const current = prev[selectedTag];
          let newX = current.x;
          let newY = current.y;
          if (e.key === 'ArrowUp') newY += step;
          if (e.key === 'ArrowDown') newY -= step;
          if (e.key === 'ArrowLeft') newX -= step;
          if (e.key === 'ArrowRight') newX += step;
          return { ...prev, [selectedTag]: { ...current, x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) } };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTag, config]);

  // Handle click on PDF to place the tag
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedTag) return;
    
    const baseTag = selectedTag.split('#')[0];
    let finalTag = baseTag;

    if (!baseTag.startsWith('static_') && !baseTag.startsWith('line_') && !baseTag.startsWith('circle_')) {
      if (config[finalTag]) {
         let counter = 1;
         while (config[`${baseTag}#${counter}`]) {
           counter++;
         }
         finalTag = `${baseTag}#${counter}`;
      }
    } else {
      if (config[selectedTag]) return;
      finalTag = selectedTag;
    }

    const pageIndex = Number(e.currentTarget.getAttribute('data-page-index'));
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Coordinates relative to the top-left of the PDF wrapper
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const renderedHeight = rect.height;
    const renderedWidth = rect.width;

    const A4_W = 595.32;
    const A4_H = 841.92;

    const scaleX = A4_W / (renderedWidth / pdfScale);
    const scaleY = A4_H / (renderedHeight / pdfScale);

    const actualX = clickX * scaleX / pdfScale;
    const actualY = A4_H - (clickY * scaleY / pdfScale);

    setConfig(prev => ({
      ...prev,
      [finalTag]: {
        page: pageIndex,
        x: Number(actualX.toFixed(2)),
        y: Number(actualY.toFixed(2)),
        size: prev[selectedTag]?.size || 12,
        type: baseTag.startsWith('line_') ? 'line' : baseTag.startsWith('circle_') ? 'circle' : 'text',
        width: baseTag.startsWith('line_') ? (prev[selectedTag]?.width || 100) : baseTag.startsWith('circle_') ? (prev[selectedTag]?.width || 20) : undefined,
        height: baseTag.startsWith('circle_') ? (prev[selectedTag]?.height || 20) : undefined,
        thickness: (baseTag.startsWith('line_') || baseTag.startsWith('circle_')) ? (prev[selectedTag]?.thickness || 1) : undefined,
      }
    }));
    
    setSelectedTag(finalTag);
  };

  const handleAddStaticTag = () => {
    const key = `static_${Date.now()}`;
    setSelectedTag(key);
  };

  const handleAddLineTag = () => {
    const key = `line_${Date.now()}`;
    setSelectedTag(key);
  };

  const handleAddCircleTag = () => {
    const key = `circle_${Date.now()}`;
    setSelectedTag(key);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/templates/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateName: selectedTemplate, config })
      });
      if (res.ok) {
        alert('Đã lưu cấu hình thành công!');
      } else {
        alert('Lỗi khi lưu.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi mạng.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = (tag: string) => {
    setConfig(prev => {
      const newConf = { ...prev };
      delete newConf[tag];
      return newConf;
    });
  };

  return (
    <div className="flex h-screen bg-slate-100 p-4 gap-4 font-sans">
      
      {/* Left Sidebar: Controls & Tags */}
      <div className="w-80 bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 mb-2">Cấu hình Tọa Độ PDF</h2>
          
          <label className="block text-sm font-medium text-slate-600 mb-1">Chọn Form:</label>
          <select 
            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500"
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
          >
            {templates.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Chọn thẻ để ghim</h3>
            <p className="text-xs text-slate-500 mb-3">Bấm vào một thẻ bên dưới, sau đó click vào vị trí tương ứng trên hình PDF để ghim.</p>
            <div className="flex flex-col gap-3">
              {TAG_GROUPS.map(group => (
                <div key={group.name} className="border border-slate-200 rounded p-2 bg-white">
                  <h4 className="text-xs font-bold text-slate-600 mb-2">{group.name}</h4>
                  <div className="flex flex-wrap gap-1">
                    {group.tags.map(tagObj => {
                      const baseTag = tagObj.id;
                      const isSelected = selectedTag?.split('#')[0] === baseTag;
                      const isPinned = Object.keys(config).some(k => k === baseTag || k.startsWith(`${baseTag}#`));
                      return (
                        <button
                          key={baseTag}
                          title={baseTag}
                          onClick={() => setSelectedTag(isSelected ? null : baseTag)}
                          className={`px-1.5 py-1 text-[10px] font-medium rounded border transition-colors text-left ${
                            isSelected
                              ? 'bg-blue-100 border-blue-500 text-blue-700 ring-1 ring-blue-200' 
                              : isPinned 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {tagObj.label} {isPinned && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 flex gap-1">
              <button 
                onClick={handleAddStaticTag}
                className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] py-1.5 rounded hover:bg-amber-100 font-medium whitespace-nowrap"
              >+ Chữ Tĩnh</button>
              <button 
                onClick={handleAddLineTag}
                className="flex-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] py-1.5 rounded hover:bg-purple-100 font-medium whitespace-nowrap"
              >+ Đường Kẻ</button>
              <button 
                onClick={handleAddCircleTag}
                className="flex-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] py-1.5 rounded hover:bg-rose-100 font-medium whitespace-nowrap"
              >+ Khoanh Tròn</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Các thẻ đã ghim ({Object.keys(config).length})</h3>
            <div className="space-y-2">
              {Object.entries(config)
                .sort((a, b) => a[1].page - b[1].page || b[1].y - a[1].y) // Sort by page, then Y
                .map(([tag, coord]) => (
                <div 
                  key={tag} 
                  onClick={() => setSelectedTag(tag)}
                  className={`flex items-center justify-between border p-2 rounded text-xs cursor-pointer transition-colors ${
                    selectedTag === tag ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-blue-600">
                      {getTagLabel(tag)} <span className="font-mono font-normal text-[10px] text-blue-400">({tag})</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">Trang {coord.page + 1} | X: {coord.x} | Y: {coord.y}</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <input 
                      type="number" 
                      className="w-12 border p-0.5 text-center rounded text-xs bg-white" 
                      value={coord.size || 12}
                      title="Cỡ chữ"
                      onClick={e => e.stopPropagation()}
                      onChange={e => setConfig(prev => ({...prev, [tag]: {...prev[tag], size: Number(e.target.value)}}))}
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag); }} className="text-red-500 hover:underline">Xóa</button>
                  </div>
                </div>
              ))}
              {Object.keys(config).length === 0 && <p className="text-xs text-slate-400 italic">Chưa có thẻ nào</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Right Content: PDF Viewer */}
      <div className="flex-1 bg-slate-300 rounded-xl overflow-hidden shadow-inner flex flex-col relative">
        {selectedTag && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium z-10 flex items-center gap-2 pointer-events-none animate-pulse">
            <MousePointer2 size={16} /> Đang chọn: {getTagLabel(selectedTag)} <span className="text-[10px] text-blue-200 font-mono">({selectedTag})</span> - Hãy click vào bản xem trước
          </div>
        )}
        
        {/* Floating Tinh Chinh */}
        {selectedTag && config[selectedTag] && (
            <div className="absolute top-20 right-4 w-64 bg-white/90 backdrop-blur shadow-xl rounded-xl border border-blue-200 p-4 z-50">
              <h4 className="text-sm font-bold text-blue-800 mb-2">
                Tinh chỉnh: {getTagLabel(selectedTag)}
                <div className="text-[10px] font-mono font-normal text-blue-500">({selectedTag})</div>
              </h4>
              <p className="text-[10px] text-blue-600 mb-2 uppercase font-medium">Dùng phím mũi tên để dịch chuyển</p>
              
              {(!config[selectedTag].type || config[selectedTag].type === 'text') && (
                <div className="mb-2">
                  <label className="text-xs text-blue-600">Nội dung (Chữ tĩnh / Xem trước):</label>
                  <input 
                    type="text" 
                    value={config[selectedTag].value || ''} 
                    onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], value: e.target.value}}))} 
                    placeholder="Nhập nội dung hiển thị..."
                    className="w-full text-sm p-1.5 border border-blue-200 rounded mt-1" 
                  />
                </div>
              )}

              {(config[selectedTag].type === 'line' || config[selectedTag].type === 'circle' || !config[selectedTag].type || config[selectedTag].type === 'text') && (
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <label className="text-xs text-blue-600">Độ rộng (Width):</label>
                    <input 
                      type="number" 
                      step="1" 
                      value={config[selectedTag].width || (config[selectedTag].type === 'circle' ? 20 : (config[selectedTag].type === 'line' ? 100 : ''))} 
                      onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], width: Number(e.target.value) || undefined}}))} 
                      className="w-full text-sm p-1 border rounded mt-1" 
                    />
                  </div>
                  {config[selectedTag].type === 'circle' && (
                    <div className="flex-1">
                      <label className="text-xs text-blue-600">Độ cao (Height):</label>
                      <input type="number" step="1" value={config[selectedTag].height || 20} onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], height: Number(e.target.value)}}))} className="w-full text-sm p-1 border rounded mt-1" />
                    </div>
                  )}
                  {(config[selectedTag].type === 'line' || config[selectedTag].type === 'circle') && (
                    <div className="flex-1">
                      <label className="text-xs text-blue-600">Độ dày (Thick):</label>
                      <input type="number" step="0.5" value={config[selectedTag].thickness || 1} onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], thickness: Number(e.target.value)}}))} className="w-full text-sm p-1 border rounded mt-1" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-xs text-blue-600">X (Ngang):</label>
                  <input type="number" step="0.5" value={config[selectedTag].x} onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], x: Number(e.target.value)}}))} className="w-full text-sm p-1 border rounded mt-1" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-blue-600">Y (Dọc):</label>
                  <input type="number" step="0.5" value={config[selectedTag].y} onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], y: Number(e.target.value)}}))} className="w-full text-sm p-1 border rounded mt-1" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1 mt-3">
                <span className="text-xs text-blue-600 font-medium">Bắt điểm thẳng hàng (Snap):</span>
                <select className="w-full text-xs p-1 border rounded mb-1" id="alignTarget" defaultValue="">
                  <option value="" disabled>Chọn thẻ mẫu...</option>
                  {Object.keys(config).filter(t => t !== selectedTag).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex gap-1">
                  <button className="flex-1 bg-white border border-blue-200 text-blue-700 text-xs py-1 rounded hover:bg-blue-100" onClick={() => {
                     const target = (document.getElementById('alignTarget') as HTMLSelectElement).value;
                     if(target && config[target]) {
                       setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], y: config[target].y}}));
                     }
                  }}>Bằng Y (Ngang)</button>
                  <button className="flex-1 bg-white border border-blue-200 text-blue-700 text-xs py-1 rounded hover:bg-blue-100" onClick={() => {
                     const target = (document.getElementById('alignTarget') as HTMLSelectElement).value;
                     if(target && config[target]) {
                       setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], x: config[target].x}}));
                     }
                  }}>Bằng X (Dọc)</button>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-blue-100 flex justify-between items-center">
                <button 
                  onClick={() => {
                    handleDeleteTag(selectedTag);
                    setSelectedTag(null);
                  }} 
                  className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                >
                  Xóa thẻ này
                </button>
              </div>
            </div>
          )}



        <div className="p-2 bg-slate-800 text-slate-200 flex justify-between items-center text-sm">
          <span className="font-medium text-slate-400">Bản xem trước ({selectedTemplate}.pdf)</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-700 px-2 py-1 rounded">
              <button onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))} className="hover:text-white px-1 font-bold">-</button>
              <span className="text-xs font-mono">{Math.round(pdfScale * 100)}%</span>
              <button onClick={() => setPdfScale(s => Math.min(3, s + 0.2))} className="hover:text-white px-1 font-bold">+</button>
            </div>
            <span>Tổng số trang: {numPages || '-'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex flex-col items-center p-8 gap-8">
          {selectedTemplate && (
            <Document
              file={`/templates/${selectedTemplate}.pdf`}
              options={pdfOptions}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="p-20 text-slate-500">Đang tải PDF...</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index}`}
                  data-page-index={index}
                  className={`relative shadow-xl bg-white mb-8 transition-all ${selectedTag && !config[selectedTag] ? 'cursor-crosshair ring-4 ring-blue-400' : ''}`}
                  onClick={handlePdfClick}
                >
                  <Page 
                    pageNumber={index + 1} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    scale={pdfScale} 
                  />

                  {/* Draw Pins for this page */}
                  {Object.entries(config)
                    .filter(([_, coord]) => coord.page === index)
                    .map(([tag, coord]) => {
                      const A4_H = 841.92;
                      const top = A4_H - coord.y;
                      const left = coord.x;
                      
                      const isSelected = selectedTag === tag;
                      
                      return (
                        <div 
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }}
                          className={`absolute group cursor-pointer ${isSelected ? 'z-50' : 'z-10'}`}
                          style={{ left: `${left * pdfScale}px`, top: `${top * pdfScale}px`, transform: 'translate(0, -100%)' }} 
                        >
                          <div className={`w-1.5 h-1.5 rounded-full absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 ${isSelected ? 'bg-blue-600 ring-2 ring-blue-300 z-50' : 'bg-red-500 z-10'}`}></div>
                          
                          {coord.type === 'line' ? (
                            <div 
                              style={{ width: `${(coord.width || 100) * pdfScale}px`, height: `${(coord.thickness || 1) * pdfScale}px`, backgroundColor: 'black', position: 'absolute', bottom: 0, left: 0 }}
                              className={isSelected ? 'ring-2 ring-blue-400' : ''}
                            />
                          ) : coord.type === 'circle' ? (
                            <div 
                              style={{ 
                                width: `${(coord.width || 20) * pdfScale}px`, 
                                height: `${(coord.height || 20) * pdfScale}px`, 
                                border: `${(coord.thickness || 1) * pdfScale}px solid black`, 
                                borderRadius: '50%',
                                position: 'absolute', 
                                bottom: `-${(coord.height || 20) * pdfScale / 2}px`, 
                                left: `-${(coord.width || 20) * pdfScale / 2}px`,
                                pointerEvents: 'none'
                              }}
                              className={isSelected ? 'ring-2 ring-blue-400 bg-blue-100/30' : ''}
                            />
                          ) : (
                            <textarea
                              value={coord.value !== undefined ? coord.value : ''}
                              placeholder={tag}
                              onChange={(e) => setConfig(prev => ({...prev, [tag]: {...prev[tag], value: e.target.value}}))}
                              onMouseUp={(e) => {
                                const el = e.currentTarget;
                                const w = Math.round(el.offsetWidth / pdfScale);
                                const h = Math.round(el.offsetHeight / pdfScale);
                                if ((coord.width && Math.abs(coord.width - w) > 2) || (coord.height && Math.abs(coord.height - h) > 2)) {
                                  setConfig(prev => ({...prev, [tag]: {...prev[tag], width: w, height: h}}));
                                } else if (!coord.width && w > 60) {
                                  // Initial resize trigger
                                  setConfig(prev => ({...prev, [tag]: {...prev[tag], width: w, height: h}}));
                                }
                              }}
                              style={{ 
                                fontSize: `${(coord.size || 12) * pdfScale}px`,
                                width: coord.width ? `${coord.width * pdfScale}px` : undefined,
                                height: coord.height ? `${coord.height * pdfScale}px` : undefined,
                                minWidth: '50px',
                                minHeight: `${(coord.size || 12) * pdfScale * 1.5}px`,
                                resize: 'both',
                                overflow: 'hidden',
                                lineHeight: '1.2',
                                whiteSpace: coord.width ? 'pre-wrap' : 'nowrap'
                              }}
                              className={`bg-transparent outline-none px-0.5 py-0 rounded ${isSelected ? 'border border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm ring-2 ring-blue-300' : 'border-b border-dashed border-slate-400 text-slate-800 hover:bg-slate-50/50'} focus:ring-0 block`}
                            />
                          )}
                        </div>
                      );
                  })}
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>

    </div>
  );
}
