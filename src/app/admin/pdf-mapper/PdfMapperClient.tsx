"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Save, MousePointer2, Eye } from 'lucide-react';
import { MOCK_DATA } from '@/lib/mockData';
import { A4_W, A4_H, PDF_LINE_HEIGHT, PDF_BASELINE_OFFSET_EM } from '@/lib/pdfCoords';

// Setup PDF worker in useEffect to avoid SSR error
const TEMPLATE_NAMES: Record<string, string> = {
  don_xin_lan_1: 'Đơn Xin Lần 1 (脱退一時金請求書)',
  ininjyo_yoshiki_lan_1: 'Giấy Ủy Quyền Lần 1 (委任状)',
  nouzeikanrinin: 'Đại Diện Thuế Lần 1 (納税管理人届出書)',
  bang_1_2: 'Bảng 1 & 2 Lần 2 (確定申告書 第一表・二表)',
  bang_3: 'Bảng Số 3 Lần 2 (確定申告書 第三表)',
  giay_uy_thac_lan_2: 'Giấy Ủy Thác Lần 2 (委任状)',
};

import { getTagsForTemplate, getRequiredTags, FieldGroup } from '@/features/templates/template-field-catalog';

type Coordinate = { x: number; y: number; size: number; page: number; value?: string; type?: string; width?: number; height?: number; thickness?: number };
type ConfigMap = Record<string, Coordinate>;

export default function PdfMapperPage() {
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [numPages, setNumPages] = useState<number | null>(null);
  const [config, setConfig] = useState<ConfigMap>({});
  const [pageDimensions, setPageDimensions] = useState<Record<number, { width: number; height: number }>>({});
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{
    page: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ page: number; startX: number; startY: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [showMockData, setShowMockData] = useState(false);
  const [autoFillStep, setAutoFillStep] = useState(15);

  const pdfOptions = React.useMemo(() => ({
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
  }), []);

  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  const getTagLabel = (tagId: string) => {
    if (!tagId) return '';
    const baseTag = tagId.split('#')[0];
    const tagsForTemplate = getTagsForTemplate(selectedTemplate || '*');
    for (const group of tagsForTemplate) {
      const found = group.tags.find(t => t.id === baseTag);
      if (found) return found.label;
    }
    if (baseTag.startsWith('static_')) return 'Chữ tĩnh';
    if (baseTag.startsWith('line_')) return 'Đường kẻ';
    if (baseTag.startsWith('circle_')) return 'Khoanh tròn';
    return baseTag;
  };

  // Detect if a tag belongs to a split-char series (e.g. my_num_1 → prefix=my_num, index=1)
  const getSplitSeriesInfo = (tagId: string) => {
    const match = tagId.match(/^(.+)_(\d+)$/);
    if (!match) return null;
    const prefix = match[1];
    const currentIndex = parseInt(match[2], 10);
    // Find all sibling tags in the catalog
    const tagsForTemplate = getTagsForTemplate(selectedTemplate || '*');
    const siblings: string[] = [];
    for (const group of tagsForTemplate) {
      for (const t of group.tags) {
        const sibMatch = t.id.match(/^(.+)_(\d+)$/);
        if (sibMatch && sibMatch[1] === prefix) {
          siblings.push(t.id);
        }
      }
    }
    if (siblings.length <= 1) return null;
    siblings.sort((a, b) => {
      const na = parseInt(a.match(/_?(\d+)$/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/_?(\d+)$/)?.[1] || '0', 10);
      return na - nb;
    });
    const missingTags = siblings.filter(s => !config[s]);
    return { prefix, currentIndex, siblings, missingTags, total: siblings.length };
  };

  const handleAutoFillSeries = (tagId: string, step: number) => {
    const info = getSplitSeriesInfo(tagId);
    if (!info || !config[tagId]) return;
    const base = config[tagId];
    const currentIdx = info.currentIndex;
    setConfig(prev => {
      const next = { ...prev };
      for (const sibTag of info.siblings) {
        if (sibTag === tagId || next[sibTag]) continue; // skip already placed
        const sibIdx = parseInt(sibTag.match(/_?(\d+)$/)?.[1] || '0', 10);
        const offsetX = (sibIdx - currentIdx) * step;
        next[sibTag] = {
          page: base.page,
          x: Number((base.x + offsetX).toFixed(2)),
          y: base.y,
          size: base.size,
          type: 'text',
        };
      }
      return next;
    });
  };

  // Fetch templates list and setup PDF worker
  useEffect(() => {
    // Setup PDF worker on client side only, using local file to prevent CORS and version mismatch errors
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

  const handleBatchDelete = (tagsToDelete?: string[]) => {
    const targetTags = tagsToDelete || selectedTags;
    if (targetTags.length === 0) return;
    
    setConfig(prev => {
      const next = { ...prev };
      targetTags.forEach(t => delete next[t]);
      return next;
    });
    
    setSelectedTags(prev => prev.filter(t => !targetTags.includes(t)));
    if (selectedTag && targetTags.includes(selectedTag)) {
      setSelectedTag(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTags.length > 0) {
          e.preventDefault();
          handleBatchDelete(selectedTags);
        } else if (selectedTag && config[selectedTag]) {
          e.preventDefault();
          handleDeleteTag(selectedTag);
          setSelectedTag(null);
        }
        return;
      }

      const activeTagsList = selectedTags.length > 0 ? selectedTags : (selectedTag && config[selectedTag] ? [selectedTag] : []);
      if (activeTagsList.length === 0) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        setConfig(prev => {
          const next = { ...prev };
          activeTagsList.forEach(t => {
            if (!next[t]) return;
            const current = next[t];
            let newX = current.x;
            let newY = current.y;
            if (e.key === 'ArrowUp') newY += step;
            if (e.key === 'ArrowDown') newY -= step;
            if (e.key === 'ArrowLeft') newX -= step;
            if (e.key === 'ArrowRight') newX += step;
            next[t] = { ...current, x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) };
          });
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTag, selectedTags, config]);

  const handlePageMouseDown = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dragStartRef.current = { page: pageIndex, startX: x, startY: y };
    isDraggingRef.current = true;
  };

  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    if (!isDraggingRef.current || !dragStartRef.current || dragStartRef.current.page !== pageIndex) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const startX = dragStartRef.current.startX;
    const startY = dragStartRef.current.startY;

    const dist = Math.hypot(curX - startX, curY - startY);
    if (dist > 5) {
      setSelectionBox({
        page: pageIndex,
        startX,
        startY,
        currentX: curX,
        currentY: curY,
      });

      const minX = Math.min(startX, curX);
      const maxX = Math.max(startX, curX);
      const minY = Math.min(startY, curY);
      const maxY = Math.max(startY, curY);

      const matched: string[] = [];
      const pageDim = pageDimensions[pageIndex] || { width: A4_W, height: A4_H };
      Object.entries(config).forEach(([tagKey, coord]) => {
        if (coord.page !== pageIndex) return;
        const tagLeft = coord.x * pdfScale;
        const tagTop = (pageDim.height - coord.y) * pdfScale;

        if (tagLeft >= minX - 15 && tagLeft <= maxX + 15 && tagTop >= minY - 15 && tagTop <= maxY + 15) {
          matched.push(tagKey);
        }
      });

      setSelectedTags(matched);
    }
  };

  const handlePageMouseUp = () => {
    if (isDraggingRef.current && selectionBox) {
      setSelectionBox(null);
    }
    isDraggingRef.current = false;
    dragStartRef.current = null;
  };

  // Handle click on PDF to place the tag
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectionBox) return; // Don't place tag if we were drag selecting
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

    const pageDim = pageDimensions[pageIndex] || { width: A4_W, height: A4_H };

    const actualX = clickX / pdfScale;
    const actualY = pageDim.height - (clickY / pdfScale);

    setConfig(prev => ({
      ...prev,
      [finalTag]: {
        page: pageIndex,
        x: Number(actualX.toFixed(2)),
        y: Number(actualY.toFixed(2)),
        size: prev[selectedTag]?.size || 9,
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
    const requiredTags = getRequiredTags(selectedTemplate || '*');
    const missingTags = requiredTags.filter(t => !config[t.id]);
    if (missingTags.length > 0) {
      const names = missingTags.map(t => t.label).join(', ');
      alert(`Cảnh báo: Có ${missingTags.length} trường bắt buộc chưa được ghim trên biểu mẫu này:\n\n${names}\n\nLưu ý: Bạn vẫn có thể lưu lại, nhưng sẽ bị chặn khi xuất PDF.`);
    }
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
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  return (
    <div className="flex h-screen bg-slate-100 p-4 gap-4 font-sans">
      
      {/* Left Sidebar: Controls & Tags */}
      <div className="w-80 bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 mb-2">Cấu hình Tọa Độ PDF</h2>
          
          <label className="block text-sm font-medium text-slate-600 mb-1">Chọn Form:</label>
          <select 
            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 mb-3"
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
          >
            {templates.map(t => <option key={t} value={t}>{TEMPLATE_NAMES[t] || t}</option>)}
          </select>

          <div className="flex items-center gap-2 mb-2 p-2 bg-slate-100 rounded border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => setShowMockData(!showMockData)}>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${showMockData ? 'bg-blue-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showMockData ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><Eye size={14}/> Hiển thị Dữ liệu mẫu</span>
          </div>

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
              {getTagsForTemplate(selectedTemplate || '*').map(group => (
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

            {/* Sidebar Auto-fill split-char */}
            {selectedTag && (() => {
              const info = getSplitSeriesInfo(selectedTag);
              if (!info) return null;
              const alreadyPinned = info.siblings.filter(s => config[s]).length;
              const firstPinned = info.siblings.find(s => config[s]);
              const baseCoord = firstPinned ? config[firstPinned] : null;
              return (
                <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
                  <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1">
                    ⚡ Auto-fill dãy: <span className="font-mono text-emerald-600">{info.prefix}_*</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 mb-2">
                    Tổng: {info.total} thẻ | Đã ghim: {alreadyPinned} | Còn: {info.missingTags.length}
                  </div>
                  {info.missingTags.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div>
                          <label className="text-[10px] text-emerald-700 font-medium">Trang (0=đầu):</label>
                          <input type="number" id="af_page" defaultValue={baseCoord?.page ?? 0} min={0} className="w-full text-xs p-1 border border-emerald-300 rounded mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-emerald-700 font-medium">Cỡ chữ:</label>
                          <input type="number" id="af_size" defaultValue={baseCoord?.size ?? 9} className="w-full text-xs p-1 border border-emerald-300 rounded mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-emerald-700 font-medium">X gốc (thẻ 1):</label>
                          <input type="number" step="0.5" id="af_x" defaultValue={baseCoord?.x ?? 100} className="w-full text-xs p-1 border border-emerald-300 rounded mt-0.5" />
                        </div>
                        <div>
                          <label className="text-[10px] text-emerald-700 font-medium">Y (hàng ngang):</label>
                          <input type="number" step="0.5" id="af_y" defaultValue={baseCoord?.y ?? 500} className="w-full text-xs p-1 border border-emerald-300 rounded mt-0.5" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-[10px] text-emerald-700 font-medium whitespace-nowrap">Bước X:</label>
                        <input type="number" step="0.5" value={autoFillStep} onChange={e => setAutoFillStep(Number(e.target.value) || 15)} className="w-16 text-xs p-1 border border-emerald-300 rounded text-center" />
                        <span className="text-[10px] text-emerald-500">px/ô</span>
                      </div>
                      <button
                        onClick={() => {
                          const pg = Number((document.getElementById('af_page') as HTMLInputElement)?.value ?? 0);
                          const sz = Number((document.getElementById('af_size') as HTMLInputElement)?.value ?? 9);
                          const bx = Number((document.getElementById('af_x') as HTMLInputElement)?.value ?? 100);
                          const by = Number((document.getElementById('af_y') as HTMLInputElement)?.value ?? 500);
                          setConfig(prev => {
                            const next = { ...prev };
                            for (const sib of info.siblings) {
                              if (next[sib]) continue;
                              const sibIdx = parseInt(sib.match(/_?(\d+)$/)?.[1] || '1', 10);
                              next[sib] = {
                                page: pg,
                                x: Number((bx + (sibIdx - 1) * autoFillStep).toFixed(2)),
                                y: by,
                                size: sz,
                                type: 'text',
                              };
                            }
                            return next;
                          });
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg font-bold transition-colors"
                      >
                        ⚡ Ghim {info.missingTags.length} thẻ còn lại
                      </button>
                      <p className="text-[9px] text-emerald-500 mt-1 text-center">
                        Ghim {info.prefix}_1 → {info.prefix}_{info.total}, cùng hàng Y, cách đều X
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-medium">✅ Tất cả {info.total} thẻ đã được ghim</p>
                  )}
                </div>
              );
            })()}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Các thẻ đã ghim ({Object.keys(config).length})
              </h3>
              {Object.keys(config).length > 0 && (
                <label className="text-[10px] text-slate-500 cursor-pointer flex items-center gap-1 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={selectedTags.length > 0 && selectedTags.length === Object.keys(config).length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTags(Object.keys(config));
                      else setSelectedTags([]);
                    }}
                    className="rounded border-slate-300 text-blue-600 text-[10px]"
                  />
                  Chọn tất cả
                </label>
              )}
            </div>

            {selectedTags.length > 0 && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded flex items-center justify-between">
                <span className="text-xs font-bold text-red-700">Đã chọn {selectedTags.length} thẻ</span>
                <button
                  onClick={() => handleBatchDelete(selectedTags)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded font-bold transition-colors shadow-sm"
                >
                  🗑️ Xóa {selectedTags.length} thẻ
                </button>
              </div>
            )}

            <div className="space-y-2">
              {Object.entries(config)
                .sort((a, b) => a[1].page - b[1].page || b[1].y - a[1].y) // Sort by page, then Y
                .map(([tag, coord]) => {
                  const isChecked = selectedTags.includes(tag);
                  return (
                    <div 
                      key={tag} 
                      onClick={() => setSelectedTag(tag)}
                      className={`flex items-center justify-between border p-2 rounded text-xs cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-red-50 border-red-300 ring-1 ring-red-200' 
                          : selectedTag === tag 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTags(prev => [...prev, tag]);
                            else setSelectedTags(prev => prev.filter(t => t !== tag));
                          }}
                          className="rounded border-slate-300 text-red-600"
                        />
                        <div>
                          <div className="font-bold text-blue-600">
                            {getTagLabel(tag)} <span className="font-mono font-normal text-[10px] text-blue-400">({tag})</span>
                          </div>
                          <div className="text-slate-500 mt-0.5">Trang {coord.page + 1} | X: {coord.x} | Y: {coord.y}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <input 
                          type="number" 
                          className="w-12 border p-0.5 text-center rounded text-xs bg-white" 
                          value={coord.size ?? 9}
                          title="Cỡ chữ"
                          onClick={e => e.stopPropagation()}
                          onChange={e => setConfig(prev => ({...prev, [tag]: {...prev[tag], size: Number(e.target.value)}}))}
                        />
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag); }} className="text-red-500 hover:underline">Xóa</button>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(config).length === 0 && <p className="text-xs text-slate-400 italic">Chưa có thẻ nào</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Right Content: PDF Viewer */}
      <div className="flex-1 bg-slate-300 rounded-xl overflow-hidden shadow-inner flex flex-col relative">
        {selectedTags.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full shadow-2xl text-sm font-semibold z-50 flex items-center gap-3 animate-bounce">
            <span>Đã chọn hàng loạt: <strong>{selectedTags.length} thẻ</strong></span>
            <button
              onClick={() => handleBatchDelete()}
              className="bg-white text-red-700 hover:bg-red-50 px-3 py-1 rounded-full text-xs font-bold shadow transition-all flex items-center gap-1"
            >
              🗑️ Xóa tất cả thẻ đã chọn (Phím Delete)
            </button>
            <button
              onClick={() => setSelectedTags([])}
              className="text-red-200 hover:text-white text-xs underline"
            >
              Hủy chọn
            </button>
          </div>
        )}

        {selectedTag && selectedTags.length === 0 && (
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
                <div className="w-20">
                  <label className="text-xs text-blue-600 font-semibold">Cỡ chữ:</label>
                  <input type="number" min="4" max="72" value={config[selectedTag].size ?? 9} onChange={(e) => setConfig(prev => ({...prev, [selectedTag]: {...prev[selectedTag], size: Number(e.target.value) || 9}}))} className="w-full text-sm p-1 border border-blue-300 rounded mt-1 text-center font-bold text-blue-800 bg-blue-50/80" />
                </div>
              </div>
              
              {/* Auto-fill split-char series */}
              {(() => {
                const seriesInfo = getSplitSeriesInfo(selectedTag);
                if (!seriesInfo || seriesInfo.missingTags.length === 0) return null;
                return (
                  <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded">
                    <div className="text-xs font-bold text-emerald-700 mb-1">
                      ⚡ Auto-fill dãy ({seriesInfo.total} thẻ, còn thiếu {seriesInfo.missingTags.length})
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-[10px] text-emerald-600 whitespace-nowrap">Bước X (px):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={autoFillStep}
                        onChange={(e) => setAutoFillStep(Number(e.target.value) || 15)}
                        className="w-16 text-xs p-1 border border-emerald-300 rounded text-center"
                      />
                    </div>
                    <button
                      onClick={() => handleAutoFillSeries(selectedTag, autoFillStep)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 rounded font-medium transition-colors"
                    >
                      Tự động ghim {seriesInfo.missingTags.length} thẻ còn lại
                    </button>
                    <p className="text-[9px] text-emerald-500 mt-1">Giữ nguyên Y={config[selectedTag]?.y}, cùng trang, cách đều X+={autoFillStep}px</p>
                  </div>
                );
              })()}

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
              file={`/forms/${selectedTemplate}.pdf`}
              options={pdfOptions}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="p-20 text-slate-500">Đang tải PDF...</div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index}`}
                  data-page-index={index}
                  onMouseDown={(e) => handlePageMouseDown(e, index)}
                  onMouseMove={(e) => handlePageMouseMove(e, index)}
                  onMouseUp={handlePageMouseUp}
                  className={`relative shadow-xl bg-white mb-8 transition-all select-none ${selectedTag && !config[selectedTag] ? 'cursor-crosshair ring-4 ring-blue-400' : 'cursor-crosshair'}`}
                  onClick={handlePdfClick}
                >
                  <Page 
                    pageNumber={index + 1} 
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    scale={pdfScale} 
                    onLoadSuccess={(page) => {
                      const unscaledWidth = page.originalWidth || (page.width / pdfScale);
                      const unscaledHeight = page.originalHeight || (page.height / pdfScale);
                      setPageDimensions(prev => ({
                        ...prev,
                        [index]: { width: unscaledWidth, height: unscaledHeight }
                      }));
                    }}
                  />

                  {/* Marquee Selection Box Overlay */}
                  {selectionBox && selectionBox.page === index && (
                    <div
                      className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none z-50 rounded"
                      style={{
                        left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
                        top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
                        width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
                        height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-bold whitespace-nowrap">
                        Kéo chọn ({selectedTags.length} thẻ)
                      </div>
                    </div>
                  )}

                  {/* Draw Pins for this page */}
                  {Object.entries(config)
                    .filter(([_, coord]) => coord.page === index)
                    .map(([tag, coord]) => {
                      const pageDim = pageDimensions[index] || { width: A4_W, height: A4_H };
                      const top = pageDim.height - coord.y;
                      const left = coord.x;
                      
                      const isSelected = selectedTag === tag;
                      const isBatchSelected = selectedTags.includes(tag);
                      
                      return (
                        <div 
                          key={tag}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedTag(tag);
                            if (e.shiftKey) {
                              setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                            }
                          }}
                          className={`absolute group cursor-pointer ${isSelected ? 'z-50' : 'z-10'} ${isBatchSelected ? 'ring-4 ring-red-500 bg-red-100/50 rounded z-40' : ''}`}
                          style={{ 
                            left: `${left * pdfScale}px`, 
                            top: `${top * pdfScale}px`, 
                            transform: (!coord.type || coord.type === 'text') ? `translateY(${PDF_BASELINE_OFFSET_EM}em)` : 'none',
                            fontSize: `${(coord.size ?? 9) * pdfScale}px` 
                          }} 
                        >
                          <div className={`w-1.5 h-1.5 rounded-full absolute bottom-0 left-0 -translate-x-1/2 ${(!coord.type || coord.type === 'text') ? `translate-y-[${-PDF_BASELINE_OFFSET_EM}em]` : 'translate-y-1/2'} ${isBatchSelected ? 'bg-red-600 ring-2 ring-red-300 z-50' : isSelected ? 'bg-blue-600 ring-2 ring-blue-300 z-50' : 'bg-red-500 z-10'}`}></div>
                          
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
                              value={coord.value !== undefined ? coord.value : (showMockData && !tag.startsWith('static_') ? MOCK_DATA[tag.split('#')[0]] || '' : '')}
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
                                fontSize: 'inherit',
                                fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif",
                                width: coord.width ? `${coord.width * pdfScale}px` : undefined,
                                height: coord.height ? `${coord.height * pdfScale}px` : undefined,
                                minWidth: '50px',
                                minHeight: `${(coord.size || 12) * pdfScale * PDF_LINE_HEIGHT}px`,
                                resize: 'both',
                                overflow: 'hidden',
                                lineHeight: `${PDF_LINE_HEIGHT}`,
                                whiteSpace: coord.width ? 'pre-wrap' : 'pre',
                                margin: 0,
                                padding: 0
                              }}
                              className={`bg-transparent outline-none rounded font-semibold ${isSelected ? 'border border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm ring-2 ring-blue-300' : 'border-b border-dashed border-slate-400 text-slate-800 hover:bg-slate-50/50'} focus:ring-0 block`}
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
