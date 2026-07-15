"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Save, MousePointer2 } from 'lucide-react';

const pdfOptions = {
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/standard_fonts/',
};

// Setup PDF worker in useEffect to avoid SSR error

// List of available tags to map
const AVAILABLE_TAGS = [
  'fullName', 'fullNameFurigana', 'lastName', 'firstName',
  'address', 'postalCodeFormat', 'post_1', 'post_2', 'post_3', 'post_4', 'post_5', 'post_6', 'post_7',
  'dob_y', 'dob_m', 'dob_d', 'dob_era', 'dob_era_jp', 'dob_era_yr',
  'cardNumber', 'myNumber',
  'bankName', 'branchName', 'accountNumber', 'accountName', 'swiftCode',
  'taxOfficeName', 'taxOfficeAddress',
  // Thêm các biến phân rã nếu cần
];

type Coordinate = { x: number; y: number; size: number; page: number };
type ConfigMap = Record<string, Coordinate>;

export default function PdfMapperPage() {
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [config, setConfig] = useState<ConfigMap>({});
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pdfWrapperRef = useRef<HTMLDivElement>(null);

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
    
    // Nếu thẻ đã được ghim rồi, click vào PDF sẽ không ghim lại nữa (tránh di chuyển nhầm), 
    // phải xóa đi mới ghim lại được. Hoặc chỉ cho ghim khi chưa có.
    if (config[selectedTag]) return;

    const pageIndex = Number(e.currentTarget.getAttribute('data-page-index'));
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Coordinates relative to the top-left of the PDF wrapper
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const renderedHeight = rect.height;
    const renderedWidth = rect.width;

    const A4_W = 595.32;
    const A4_H = 841.92;

    const scaleX = A4_W / renderedWidth;
    const scaleY = A4_H / renderedHeight;

    const actualX = clickX * scaleX;
    const actualY = A4_H - (clickY * scaleY);

    setConfig(prev => ({
      ...prev,
      [selectedTag]: {
        page: pageIndex,
        x: Number(actualX.toFixed(2)),
        y: Number(actualY.toFixed(2)),
        size: prev[selectedTag]?.size || 12,
      }
    }));
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
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                    selectedTag === tag 
                      ? 'bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-200' 
                      : config[tag] 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tag} {config[tag] && '✓'}
                </button>
              ))}
            </div>
          </div>

          <hr className="my-4" />

          {selectedTag && config[selectedTag] && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-100">
              <h4 className="text-sm font-bold text-blue-800 mb-2">Tinh chỉnh: {selectedTag}</h4>
              <p className="text-[10px] text-blue-600 mb-2 uppercase font-medium">Bạn có thể dùng phím Mũi tên để dịch chuyển (Shift+Mũi tên dịch 10px)</p>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-xs text-blue-600">X (Ngang):</label>
                  <input type="number" step="0.5" value={config[selectedTag].x} onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], x: Number(e.target.value)}}))} className="w-full text-sm p-1 border rounded" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-blue-600">Y (Dọc):</label>
                  <input type="number" step="0.5" value={config[selectedTag].y} onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], y: Number(e.target.value)}}))} className="w-full text-sm p-1 border rounded" />
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
            </div>
          )}

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
                    <span className="font-mono font-bold text-blue-600">{tag}</span>
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
            <MousePointer2 size={16} /> Đang chọn: {selectedTag} - Hãy click vào bản xem trước
          </div>
        )}

        <div className="p-2 bg-slate-800 text-slate-200 flex justify-between items-center text-sm">
          <span className="font-medium text-slate-400">Bản xem trước ({selectedTemplate}.pdf)</span>
          <div className="flex items-center gap-4">
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
                    scale={1.0} 
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
                          style={{ left: `${left}px`, top: `${top}px`, transform: 'translate(0, -100%)' }} 
                        >
                          <div className={`w-1.5 h-1.5 rounded-full absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 ${isSelected ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-red-500'}`}></div>
                          <div className={`border text-xs font-mono px-1 py-0.5 rounded shadow whitespace-nowrap ${isSelected ? 'bg-blue-100 text-blue-900 border-blue-400 opacity-100' : 'bg-yellow-200 text-yellow-900 border-yellow-400 opacity-80 group-hover:opacity-100'}`}>
                            {tag}
                          </div>
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
