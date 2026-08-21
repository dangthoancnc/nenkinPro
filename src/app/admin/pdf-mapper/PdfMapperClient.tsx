"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Save, MousePointer2, Eye, X } from 'lucide-react';
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

type Coordinate = { x: number; y: number; size: number; page: number; value?: string; type?: string; width?: number; height?: number; thickness?: number; fontWeight?: 'normal' | 'bold'; align?: 'left' | 'center' | 'right' };
type ConfigMap = Record<string, Coordinate>;

export function calcAutoFitDimensions(
  tag: string,
  fontSize: number = 9,
  customValue?: string,
  config?: ConfigMap,
  liveMappedData?: Record<string, string> | null
): { width: number; height: number } {
  const baseTag = tag.split('#')[0];
  const type = config?.[tag]?.type;

  if (type === 'line') {
    return { width: 100, height: 14 };
  }
  if (type === 'circle') {
    return { width: 22, height: 22 };
  }

  let text = customValue;
  if (text === undefined) {
    if (config?.[tag]?.value !== undefined && config[tag].value !== '') {
      text = config[tag].value;
    } else {
      text = (liveMappedData ? liveMappedData[baseTag] : MOCK_DATA[baseTag]) || tag;
    }
  }

  const str = String(text || '');
  const lineHeight = Math.max(12, Math.round(fontSize * PDF_LINE_HEIGHT));

  // Explicit single-character split box tags (e.g., my_num_1, lumpSumNum_1, phone_1 when splitting 11 digits)
  // Tags like phone_group_1, phone_group_2, post_1 are multi-digit groups and must NOT be treated as 1-char!
  const isExplicitSingleCharTag = 
    baseTag.includes('_dig_') || 
    baseTag.endsWith('_unit') ||
    (/^(fullName_kata|my_num|nenkin|phone|post|tax_post|taxRep_phone|taxRep_post|bank|swift|withheldTax_dig|calculatedTax_dig|refundAmount_dig|dob_y|dob_m|dob_d|dob_era_yr|permResDate_y|permResDate_m|permResDate_d|departureDate_y|departureDate_m|departureDate_d|applyDate_y|applyDate_m|applyDate_d|applyDate_era_yr|noticeDate_y|noticeDate_m|noticeDate_d|taxYear_era_yr|today_era_yr|today_m|today_d|today_yymmdd|doc_date_era_yr|doc_date_m|doc_date_d|doc_date_yymmdd|yucho_kigo|yucho_bango|taxRep_account|taxRep_account_dig|lumpSumNum|myNumber)_\d+$/.test(baseTag));

  if (isExplicitSingleCharTag && str.length <= 1) {
    const singleCharW = Math.max(14, Math.ceil(fontSize * 1.3));
    return { width: singleCharW, height: lineHeight };
  }

  // Calculate width dynamically based on actual content length and character types
  let charWidthSum = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 255) {
      charWidthSum += fontSize * 0.95; // CJK / Full-width
    } else {
      charWidthSum += fontSize * 0.65; // ASCII / Digits / Latin
    }
  }

  const calculatedWidth = Math.max(20, Math.ceil(charWidthSum + 8));
  return { width: calculatedWidth, height: lineHeight };
}

export default function PdfMapperClient({
  inlineAppId,
  inlineTemplate,
  onClose
}: {
  inlineAppId?: string;
  inlineTemplate?: string;
  onClose?: () => void;
} = {}) {
  const searchParams = useSearchParams();
  const initTemplate = inlineTemplate || searchParams.get('template') || '';
  const initAppId = inlineAppId || searchParams.get('applicationId') || '';

  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initTemplate);
  const [liveMappedData, setLiveMappedData] = useState<Record<string, string> | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [config, setConfig] = useState<ConfigMap>({});
  const [pageDimensions, setPageDimensions] = useState<Record<number, { width: number; height: number }>>({});
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeMode, setActiveMode] = useState<'select' | 'add' | 'delete'>('select');
  const [strictFilter, setStrictFilter] = useState<boolean>(true);
  const [selectionBox, setSelectionBox] = useState<{
    page: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ page: number; startX: number; startY: number } | null>(null);
  const justFinishedDragSelectRef = useRef(false);
  const justClickedPinRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.8);
  const [showMockData, setShowMockData] = useState(false);
  const [autoFillStep, setAutoFillStep] = useState(15);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Undo / Redo History Stack
  const historyRef = useRef<ConfigMap[]>([]);
  const historyPointerRef = useRef<number>(-1);
  const isUndoRedoActionRef = useRef<boolean>(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateUndoRedoState = () => {
    setCanUndo(historyPointerRef.current > 0);
    setCanRedo(historyPointerRef.current < historyRef.current.length - 1);
  };

  const pushToHistory = (newConfig: ConfigMap) => {
    if (isUndoRedoActionRef.current) {
      isUndoRedoActionRef.current = false;
      return;
    }
    const stack = historyRef.current.slice(0, historyPointerRef.current + 1);
    if (stack.length > 0 && JSON.stringify(stack[stack.length - 1]) === JSON.stringify(newConfig)) {
      return;
    }
    stack.push(JSON.parse(JSON.stringify(newConfig)));
    if (stack.length > 50) stack.shift();
    historyRef.current = stack;
    historyPointerRef.current = stack.length - 1;
    updateUndoRedoState();
  };

  const handleUndo = () => {
    if (historyPointerRef.current > 0) {
      isUndoRedoActionRef.current = true;
      historyPointerRef.current -= 1;
      const prevConfig = JSON.parse(JSON.stringify(historyRef.current[historyPointerRef.current]));
      setConfig(prevConfig);
      updateUndoRedoState();
    }
  };

  const handleRedo = () => {
    if (historyPointerRef.current < historyRef.current.length - 1) {
      isUndoRedoActionRef.current = true;
      historyPointerRef.current += 1;
      const nextConfig = JSON.parse(JSON.stringify(historyRef.current[historyPointerRef.current]));
      setConfig(nextConfig);
      updateUndoRedoState();
    }
  };

  useEffect(() => {
    pushToHistory(config);
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    if (baseTag.startsWith('custom_') || baseTag.startsWith('the_moi_')) return 'Thẻ tự do / Thẻ mới';
    return baseTag;
  };

  const handleRemapTagSource = (oldTagKey: string, newFieldId: string) => {
    if (!oldTagKey || !config[oldTagKey] || !newFieldId) return;

    const currentCoord = config[oldTagKey];
    let baseTargetTag = newFieldId;

    if (newFieldId === 'custom') baseTargetTag = `custom_${Date.now()}`;
    else if (newFieldId === 'static') baseTargetTag = `static_${Date.now()}`;
    else if (newFieldId === 'line') baseTargetTag = `line_${Date.now()}`;
    else if (newFieldId === 'circle') baseTargetTag = `circle_${Date.now()}`;

    let finalTargetTag = baseTargetTag;
    if (finalTargetTag === oldTagKey) return;

    // Resolve duplicate tag key if tag already mapped
    if (config[finalTargetTag]) {
      let counter = 2;
      while (config[`${baseTargetTag}#${counter}`]) {
        counter++;
      }
      finalTargetTag = `${baseTargetTag}#${counter}`;
    }

    let newType = currentCoord.type || 'text';
    if (baseTargetTag.startsWith('line')) newType = 'line';
    else if (baseTargetTag.startsWith('circle')) newType = 'circle';
    else newType = 'text';

    setConfig(prev => {
      const next = { ...prev };
      delete next[oldTagKey];
      next[finalTargetTag] = {
        ...currentCoord,
        type: newType,
      };
      return next;
    });

    setSelectedTag(finalTargetTag);
    if (selectedTags.includes(oldTagKey)) {
      setSelectedTags(prev => prev.map(t => t === oldTagKey ? finalTargetTag : t));
    }
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

  const handleUpdateSeriesSpacing = (prefix: string, step: number) => {
    const info = getSplitSeriesInfo(`${prefix}_1`);
    if (!info) return;
    const pinnedSiblings = info.siblings.filter(s => config[s]);
    if (pinnedSiblings.length === 0) return;
    
    pinnedSiblings.sort((a, b) => {
      const na = parseInt(a.match(/_?(\d+)$/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/_?(\d+)$/)?.[1] || '0', 10);
      return na - nb;
    });

    const firstTag = pinnedSiblings[0];
    const firstCoord = config[firstTag];
    if (!firstCoord) return;
    const firstIdx = parseInt(firstTag.match(/_?(\d+)$/)?.[1] || '1', 10);
    const baseX = firstCoord.x - (firstIdx - 1) * step;

    setConfig(prev => {
      const next = { ...prev };
      pinnedSiblings.forEach(sibTag => {
        if (next[sibTag]) {
          const sibIdx = parseInt(sibTag.match(/_?(\d+)$/)?.[1] || '1', 10);
          const newX = Number((baseX + (sibIdx - 1) * step).toFixed(2));
          next[sibTag] = { ...next[sibTag], x: newX };
        }
      });
      return next;
    });
  };

  // Fetch templates list, setup PDF worker, and optionally fetch live mapped data
  useEffect(() => {
    // Setup PDF worker on client side only, using local file to prevent CORS and version mismatch errors
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    fetch('/api/templates/mapping')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setTemplates(data.data);
          if (!initTemplate && data.data.length > 0) {
            setSelectedTemplate(data.data[0]);
          }
        }
      });

    if (initAppId) {
      fetch(`/api/applications/${initAppId}`)
        .then(res => res.json())
        .then(appData => {
          if (appData && appData.mappedData) {
            setLiveMappedData(appData.mappedData);
          }
        })
        .catch(err => console.error('Failed to fetch live data:', err));
    }
  }, [initAppId, initTemplate]);

  // Fetch config when template changes
  useEffect(() => {
    if (!selectedTemplate) return;
    fetch(`/api/templates/mapping?template=${selectedTemplate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const normalized: ConfigMap = { ...data.data };
          Object.keys(normalized).forEach(k => {
            const baseK = k.split('#')[0];
            const isSingle = baseK.includes('_dig_') || baseK.endsWith('_unit') || /_\d+$/.test(baseK);
            if (isSingle) {
              const sz = normalized[k].size || 9;
              const compactW = Math.max(14, Math.ceil(sz * 1.4));
              normalized[k] = { 
                ...normalized[k], 
                width: compactW, 
                align: normalized[k].align || 'center' 
              };
            }
          });
          setConfig(normalized);
        } else {
          setConfig({});
        }
      });
  }, [selectedTemplate]);

  const handleFitWidth = useCallback(() => {
    if (!pdfContainerRef.current) {
      setPdfScale(1.8);
      return;
    }
    const containerW = pdfContainerRef.current.clientWidth - 80;
    const pageW = pageDimensions[0]?.width || A4_W;
    if (containerW > 0 && pageW > 0) {
      const calculatedScale = Math.min(3, Math.max(0.5, Math.round((containerW / pageW) * 10) / 10));
      setPdfScale(calculatedScale);
    } else {
      setPdfScale(1.8);
    }
  }, [pageDimensions]);

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

  const handleBatchSetFontWeight = (weight: 'normal' | 'bold') => {
    if (selectedTags.length === 0) return;
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) {
          next[t] = { ...next[t], fontWeight: weight };
        }
      });
      return next;
    });
  };

  const handleBatchSetFontSize = (size: number) => {
    if (selectedTags.length === 0 || size < 4 || size > 72) return;
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) {
          next[t] = { ...next[t], size };
        }
      });
      return next;
    });
  };

  const handleBatchSetAlign = (align: 'left' | 'center' | 'right') => {
    if (selectedTags.length === 0) return;
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) {
          const autoDims = calcAutoFitDimensions(t, next[t].size || 9, next[t].value, next, liveMappedData);
          next[t] = {
            ...next[t],
            align,
            width: next[t].width || autoDims.width,
            height: next[t].height || autoDims.height,
          };
        }
      });
      return next;
    });
  };

  const handleBatchAlignTop = () => {
    if (selectedTags.length < 2) return;
    const existingCoords = selectedTags.map(t => config[t]).filter(Boolean);
    if (existingCoords.length === 0) return;
    const minY = Math.min(...existingCoords.map(c => c.y));
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) next[t] = { ...next[t], y: minY };
      });
      return next;
    });
  };

  const handleBatchAlignBottom = () => {
    if (selectedTags.length < 2) return;
    const existingCoords = selectedTags.map(t => config[t]).filter(Boolean);
    if (existingCoords.length === 0) return;
    const maxY = Math.max(...existingCoords.map(c => c.y));
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) next[t] = { ...next[t], y: maxY };
      });
      return next;
    });
  };

  const handleBatchAlignLeft = () => {
    if (selectedTags.length < 2) return;
    const existingCoords = selectedTags.map(t => config[t]).filter(Boolean);
    if (existingCoords.length === 0) return;
    const minX = Math.min(...existingCoords.map(c => c.x));
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) next[t] = { ...next[t], x: minX };
      });
      return next;
    });
  };

  const handleBatchAlignRight = () => {
    if (selectedTags.length < 2) return;
    const existingCoords = selectedTags.map(t => config[t]).filter(Boolean);
    if (existingCoords.length === 0) return;
    const maxX = Math.max(...existingCoords.map(c => c.x));
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) next[t] = { ...next[t], x: maxX };
      });
      return next;
    });
  };

  const handleBatchDistributeX = () => {
    if (selectedTags.length < 3) return;
    const items = selectedTags
      .map(t => ({ tag: t, coord: config[t] }))
      .filter(i => !!i.coord)
      .sort((a, b) => a.coord.x - b.coord.x);
    if (items.length < 3) return;

    const minX = items[0].coord.x;
    const maxX = items[items.length - 1].coord.x;
    const step = (maxX - minX) / (items.length - 1);

    setConfig(prev => {
      const next = { ...prev };
      items.forEach((item, index) => {
        const newX = Math.round((minX + index * step) * 100) / 100;
        if (next[item.tag]) next[item.tag] = { ...next[item.tag], x: newX };
      });
      return next;
    });
  };

  const handleBatchAutoFit = () => {
    if (selectedTags.length === 0) return;
    setConfig(prev => {
      const next = { ...prev };
      selectedTags.forEach(t => {
        if (next[t]) {
          const dims = calcAutoFitDimensions(t, next[t].size || 9, next[t].value, next, liveMappedData);
          next[t] = { ...next[t], width: dims.width, height: dims.height };
        }
      });
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName;
      const isTextInput = activeTag === 'TEXTAREA' || (activeTag === 'INPUT' && (activeElement as HTMLInputElement).type !== 'number');

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isTextInput) {
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
      }

      const activeTagsList = selectedTags.length > 0 ? selectedTags : (selectedTag && config[selectedTag] ? [selectedTag] : []);
      if (activeTagsList.length === 0) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (isTextInput && !e.altKey && !e.ctrlKey) {
          return;
        }
        e.preventDefault();
        const step = e.shiftKey ? 10 : (e.altKey ? 0.5 : 1);
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
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    dragStartRef.current = { page: pageIndex, startX, startY };
    isDraggingRef.current = true;

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current || dragStartRef.current.page !== pageIndex) return;

      const curX = moveEvent.clientX - rect.left;
      const curY = moveEvent.clientY - rect.top;
      const sX = dragStartRef.current.startX;
      const sY = dragStartRef.current.startY;

      const dist = Math.hypot(curX - sX, curY - sY);
      if (dist > 5) {
        setSelectionBox({
          page: pageIndex,
          startX: sX,
          startY: sY,
          currentX: curX,
          currentY: curY,
        });

        const minX = Math.min(sX, curX);
        const maxX = Math.max(sX, curX);
        const minY = Math.min(sY, curY);
        const maxY = Math.max(sY, curY);

        const pageDim = pageDimensions[pageIndex] || { width: A4_W, height: A4_H };
        const matched: string[] = [];
        Object.entries(config).forEach(([tagKey, coord]) => {
          if (coord.page !== pageIndex) return;
          const tagLeft = coord.x * pdfScale;
          const tagTop = (pageDim.height - coord.y) * pdfScale;
          const tagRight = tagLeft + (coord.width || 40) * pdfScale;
          const tagBottom = tagTop + (coord.height || 15) * pdfScale;

          // Check if tag bounding box intersects marquee selection box
          const intersects = !(tagRight < minX || tagLeft > maxX || tagBottom < minY || tagTop > maxY);
          if (intersects) {
            matched.push(tagKey);
          }
        });

        setSelectedTags(matched);
      }
    };

    const handleWindowMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);

      if (isDraggingRef.current && dragStartRef.current) {
        const totalDist = Math.hypot(upEvent.clientX - (rect.left + dragStartRef.current.startX), upEvent.clientY - (rect.top + dragStartRef.current.startY));
        if (totalDist > 5) {
          justFinishedDragSelectRef.current = true;
        }
        setSelectionBox(null);
      }
      isDraggingRef.current = false;
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // Handle click on PDF to place the tag or deselect
  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (justClickedPinRef.current) {
      justClickedPinRef.current = false;
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest('.pdf-tag-pin')) {
      return;
    }
    if (justFinishedDragSelectRef.current) {
      justFinishedDragSelectRef.current = false;
      return;
    }
    if (selectionBox) return; // Don't place tag if we were drag selecting
    if (activeMode !== 'add' || !selectedTag) {
      if (activeMode === 'select') {
        setSelectedTags([]);
        setSelectedTag(null);
      }
      return;
    }

    // Require Ctrl + Click (or Cmd + Click on Mac) to place tag in Add mode
    if (!e.ctrlKey && !e.metaKey) {
      return;
    }
    
    const baseTag = selectedTag.split('#')[0];
    let finalTag = baseTag;

    if (!baseTag.startsWith('static_') && !baseTag.startsWith('line_') && !baseTag.startsWith('circle_') && !baseTag.startsWith('custom_') && !baseTag.startsWith('the_moi_')) {
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

    setConfig(prev => {
      const initialSize = prev[selectedTag]?.size || 9;
      const initialType = baseTag.startsWith('line_') ? 'line' : baseTag.startsWith('circle_') ? 'circle' : 'text';
      const autoDims = calcAutoFitDimensions(finalTag, initialSize, undefined, prev, liveMappedData);
      const isSingleChar = baseTag.includes('_dig_') || baseTag.endsWith('_unit') || /_\d+$/.test(baseTag);
      const defaultAlign = (isSingleChar || baseTag.startsWith('circle_')) ? 'center' : 'left';

      return {
        ...prev,
        [finalTag]: {
          page: pageIndex,
          x: Number(actualX.toFixed(2)),
          y: Number(actualY.toFixed(2)),
          size: initialSize,
          type: initialType,
          align: prev[selectedTag]?.align || defaultAlign,
          width: baseTag.startsWith('line_') ? (prev[selectedTag]?.width || 100) : baseTag.startsWith('circle_') ? (prev[selectedTag]?.width || 22) : (prev[selectedTag]?.width || autoDims.width),
          height: baseTag.startsWith('circle_') ? (prev[selectedTag]?.height || 22) : (prev[selectedTag]?.height || autoDims.height),
          thickness: (baseTag.startsWith('line_') || baseTag.startsWith('circle_')) ? (prev[selectedTag]?.thickness || 1) : undefined,
        }
      };
    });
    
    setSelectedTag(finalTag);
    setActiveMode('select'); // Return to select mode after placing
  };

  const handleResizeMouseDown = (e: React.MouseEvent, tagKey: string, resizeType: 'line-width' | 'circle-size' | 'text-box') => {
    e.stopPropagation();
    e.preventDefault();
    if (!config[tagKey]) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = config[tagKey].width || 100;
    const initialHeight = config[tagKey].height || Math.round((config[tagKey].size || 12) * PDF_LINE_HEIGHT);

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / pdfScale;
      const dy = (moveEvent.clientY - startY) / pdfScale;

      setConfig(prev => {
        if (!prev[tagKey]) return prev;
        const newWidth = Math.max(15, Math.round(initialWidth + dx));
        const newHeight = Math.max(10, Math.round(initialHeight + dy));
        return {
          ...prev,
          [tagKey]: {
            ...prev[tagKey],
            width: newWidth,
            height: resizeType === 'line-width' ? prev[tagKey].height : newHeight,
          }
        };
      });
    };

    const handleWindowMouseUp = () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handlePinMouseDown = (e: React.MouseEvent, tagKey: string, pageIdx: number) => {
    if (e.button !== 0) return;
    justClickedPinRef.current = true;

    // Decouple move from resize: do not start position move if clicking inside resize handle corner of textarea/input
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      const rect = target.getBoundingClientRect();
      const isResizeCorner = (e.clientX >= rect.right - 18) && (e.clientY >= rect.bottom - 18);
      if (isResizeCorner) {
        return;
      }
    }

    e.stopPropagation();

    if (activeMode === 'delete') {
      handleDeleteTag(tagKey);
      if (selectedTag === tagKey) setSelectedTag(null);
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;

    const isMulti = selectedTags.includes(tagKey);
    const targets = isMulti ? selectedTags : [tagKey];

    const initialCoords: Record<string, { x: number; y: number }> = {};
    targets.forEach(t => {
      if (config[t]) {
        initialCoords[t] = { x: config[t].x, y: config[t].y };
      }
    });

    let hasDragged = false;

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      const dxScreen = moveEvent.clientX - startX;
      const dyScreen = moveEvent.clientY - startY;

      if (!hasDragged && Math.hypot(dxScreen, dyScreen) > 3) {
        hasDragged = true;
      }

      if (hasDragged) {
        const pdfDx = dxScreen / pdfScale;
        const pdfDy = -dyScreen / pdfScale;

        setConfig(prev => {
          const next = { ...prev };
          Object.entries(initialCoords).forEach(([t, orig]) => {
            if (next[t]) {
              next[t] = {
                ...next[t],
                x: Number((orig.x + pdfDx).toFixed(2)),
                y: Number((orig.y + pdfDy).toFixed(2)),
              };
            }
          });
          return next;
        });
      }
    };

    const handleWindowMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);

      setSelectedTag(tagKey);
      if (!hasDragged) {
        if (upEvent.shiftKey) {
          setSelectedTags(prev => prev.includes(tagKey) ? prev.filter(t => t !== tagKey) : [...prev, tagKey]);
        }
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handleAddCustomTag = () => {
    const key = `custom_${Date.now()}`;
    setSelectedTag(key);
    setActiveMode('add');
  };

  const handleAddStaticTag = () => {
    const key = `static_${Date.now()}`;
    setSelectedTag(key);
    setActiveMode('add');
  };

  const handleAddLineTag = () => {
    const key = `line_${Date.now()}`;
    setSelectedTag(key);
    setActiveMode('add');
  };

  const handleAddCircleTag = () => {
    const key = `circle_${Date.now()}`;
    setSelectedTag(key);
    setActiveMode('add');
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

          {onClose && (
            <button
              onClick={onClose}
              className="w-full mb-3 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <X size={16} /> Quay lại màn hình In
            </button>
          )}

          {initAppId ? (
            <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-medium text-xs">
              <span>🌟 Đang dùng dữ liệu thực tế (Live Data)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-100 rounded border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => setShowMockData(!showMockData)}>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${showMockData ? 'bg-blue-500' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showMockData ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><Eye size={14}/> Hiển thị Dữ liệu mẫu</span>
            </div>
          )}

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
            <div className="flex items-center justify-between mb-3 bg-slate-100 p-1.5 rounded border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600">Lọc thẻ theo mẫu:</span>
              <button
                type="button"
                onClick={() => setStrictFilter(!strictFilter)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                  strictFilter
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {strictFilter ? `🎯 Chỉ form ${selectedTemplate || ''}` : '🌐 Hiện tất cả thẻ'}
              </button>
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">1. Chọn thẻ để ghim</h3>
            <p className="text-xs text-slate-500 mb-3">Bấm vào một thẻ bên dưới, sau đó click vào vị trí tương ứng trên hình PDF để ghim.</p>
            <div className="flex flex-col gap-3">
              {getTagsForTemplate(strictFilter ? (selectedTemplate || '*') : '*').map(group => (
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
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTag(null);
                              setActiveMode('select');
                            } else {
                              setSelectedTag(baseTag);
                              setActiveMode('add');
                            }
                          }}
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
            
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <button 
                onClick={handleAddCustomTag}
                className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] py-1.5 rounded hover:bg-blue-100 font-bold whitespace-nowrap"
              >+ Thẻ Mới / Thẻ Trống</button>
              <button 
                onClick={handleAddStaticTag}
                className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] py-1.5 rounded hover:bg-amber-100 font-medium whitespace-nowrap"
              >+ Chữ Tĩnh</button>
              <button 
                onClick={handleAddLineTag}
                className="bg-purple-50 border border-purple-200 text-purple-700 text-[10px] py-1.5 rounded hover:bg-purple-100 font-medium whitespace-nowrap"
              >+ Đường Kẻ</button>
              <button 
                onClick={handleAddCircleTag}
                className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] py-1.5 rounded hover:bg-rose-100 font-medium whitespace-nowrap"
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
                  <div className="flex flex-col gap-1.5 mb-2.5 bg-white p-2 rounded border border-emerald-200">
                    <label className="text-[10px] text-emerald-800 font-bold">Giãn khoảng cách X giữa các ô:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAutoFillStep(prev => Number(Math.max(5, prev - 0.5).toFixed(1)))}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs w-6 h-6 rounded font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        value={autoFillStep}
                        onChange={e => setAutoFillStep(Number(e.target.value) || 15)}
                        className="w-16 text-xs p-1 border border-emerald-300 rounded text-center font-bold text-emerald-900 bg-emerald-50/50"
                      />
                      <span className="text-[10px] text-emerald-600 font-medium">px/ô</span>
                      <button
                        type="button"
                        onClick={() => setAutoFillStep(prev => Number((prev + 0.5).toFixed(1)))}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs w-6 h-6 rounded font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[13, 14, 14.5, 15, 15.5, 16, 18, 20].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAutoFillStep(s)}
                          className={`px-1.5 py-0.5 text-[9px] rounded font-bold border ${
                            autoFillStep === s
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {s}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {alreadyPinned > 0 && (
                    <button
                      type="button"
                      onClick={() => handleUpdateSeriesSpacing(info.prefix, autoFillStep)}
                      className="w-full mb-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                      title="Cập nhật lại khoảng cách X giữa các ô cho các thẻ đã ghim"
                    >
                      ⚡ Cập nhật khoảng cách ({autoFillStep}px) cho {alreadyPinned} thẻ đã ghim
                    </button>
                  )}

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
                        Ghim {info.prefix}_1 → {info.prefix}_{info.total}, cùng hàng Y, cách đều X ({autoFillStep}px)
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-emerald-600 font-medium text-center">✅ Tất cả {info.total} thẻ đã được ghim</p>
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
        {activeMode === 'add' && selectedTag && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-4 py-2 rounded-full shadow-2xl text-xs font-bold z-50 flex items-center gap-2 border-2 border-amber-300 animate-pulse">
            <span>💡 Giữ phím <strong>Ctrl + Click</strong> vào vị trí trên phôi PDF để ghim thẻ <u>{getTagLabel(selectedTag)}</u></span>
            <button
              onClick={() => { setActiveMode('select'); setSelectedTag(null); }}
              className="ml-2 bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px] hover:bg-slate-800 font-bold"
            >
              Hủy
            </button>
          </div>
        )}

        {activeMode === 'delete' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-medium z-40 flex items-center gap-2 pointer-events-none">
            🗑️ Chế độ Xóa Thẻ: Click vào bất kỳ thẻ nào trên hình PDF để xóa
          </div>
        )}

        <div className="p-2 bg-slate-800 text-slate-200 flex justify-between items-center text-sm flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-medium text-slate-400">Bản xem trước ({selectedTemplate}.pdf)</span>

            {/* Mode Switcher Toolbar */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveMode('select')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeMode === 'select'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Chế độ chọn và di chuyển thẻ (Mặc định)"
              >
                🖐️ Di chuyển (Move)
              </button>
              <button
                onClick={() => setActiveMode('add')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeMode === 'add'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Chế độ click để ghim thẻ mới vào PDF"
              >
                📌 Ghim thẻ (Add)
              </button>
              <button
                onClick={() => setActiveMode('delete')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeMode === 'delete'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Chế độ click vào thẻ để xóa ngay"
              >
                🗑️ Xóa thẻ (Delete)
              </button>
            </div>

            {/* Undo / Redo Control Toolbar */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700 gap-1">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                  canUndo
                    ? 'bg-slate-700 text-white hover:bg-slate-600 shadow'
                    : 'text-slate-600 opacity-40 cursor-not-allowed'
                }`}
                title="Khôi phục thao tác trước (Ctrl + Z)"
              >
                ↩️ Undo
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                  canRedo
                    ? 'bg-slate-700 text-white hover:bg-slate-600 shadow'
                    : 'text-slate-600 opacity-40 cursor-not-allowed'
                }`}
                title="Làm lại thao tác vừa Undo (Ctrl + Y)"
              >
                ↪️ Redo
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-700 px-2 py-1 rounded shadow-inner">
              <button 
                type="button" 
                onClick={() => setPdfScale(s => Math.max(0.5, Math.round((s - 0.1) * 10) / 10))} 
                className="hover:text-white px-1.5 font-bold hover:bg-slate-600 rounded text-xs"
                title="Thu nhỏ (-10%)"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-emerald-400 min-w-[42px] text-center">{Math.round(pdfScale * 100)}%</span>
              <button 
                type="button" 
                onClick={() => setPdfScale(s => Math.min(3, Math.round((s + 0.1) * 10) / 10))} 
                className="hover:text-white px-1.5 font-bold hover:bg-slate-600 rounded text-xs"
                title="Phóng to (+10%)"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleFitWidth}
                className="bg-slate-800 hover:bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded font-medium ml-1 transition-colors border border-slate-600 shadow-xs flex items-center gap-1"
                title="Phóng to tự động vừa khít chiều rộng màn hình"
              >
                ↔ Fit (180%)
              </button>
            </div>
            <span className="text-xs text-slate-300 font-medium">Tổng số trang: {numPages || '-'}</span>
          </div>
        </div>

        {/* WORD-STYLE HORIZONTAL PROPERTY RIBBON TOOLBAR (SINGLE TAG) */}
        {selectedTag && config[selectedTag] && selectedTags.length <= 1 && (
          <div className="bg-slate-900 border-b border-slate-700 text-slate-200 px-3 py-1.5 flex items-center justify-between gap-2 text-xs flex-wrap shadow-md z-30 select-none">
            {/* Nhóm 1: Thẻ & Nguồn dữ liệu */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="flex items-center gap-1 bg-blue-950/80 border border-blue-600/60 px-2 py-0.5 rounded text-blue-200 font-bold max-w-[210px] truncate"
                title={`${getTagLabel(selectedTag)} (${selectedTag})`}
              >
                <span className="text-blue-400 shrink-0">🏷️</span>
                <span className="truncate">{getTagLabel(selectedTag)}</span>
              </div>

              <select
                value={selectedTag.split('#')[0]}
                onChange={(e) => handleRemapTagSource(selectedTag, e.target.value)}
                className="h-6 text-[11px] bg-slate-800 border border-slate-600 rounded px-1.5 text-slate-200 focus:ring-1 focus:ring-blue-400 outline-none max-w-[150px]"
                title="Đổi nguồn dữ liệu cho thẻ"
              >
                <optgroup label="── Loại Thẻ Tùy Chỉnh ──">
                  <option value="custom">Thẻ tự do</option>
                  <option value="static">Chữ tĩnh</option>
                  <option value="line">Đường kẻ</option>
                  <option value="circle">Khoanh tròn</option>
                </optgroup>
                {getTagsForTemplate(selectedTemplate || '*').map(group => (
                  <optgroup key={group.name} label={`── ${group.name} ──`}>
                    {group.tags.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.id})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Nhóm 2: Định dạng chữ & Căn chỉnh (Word Style) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Cỡ chữ */}
              <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-700 p-0.5 rounded">
                <span className="text-[10px] text-slate-400 px-1 font-semibold">Cỡ:</span>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], size: Math.max(4, (prev[selectedTag].size ?? 9) - 1) } }))}
                  className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold flex items-center justify-center text-xs"
                  title="Giảm cỡ chữ (1pt)"
                >
                  -
                </button>
                <input
                  type="number"
                  min="4"
                  max="72"
                  value={config[selectedTag].size ?? 9}
                  onChange={(e) => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], size: Number(e.target.value) || 9 } }))}
                  className="w-8 h-5 text-center bg-slate-950 border border-slate-600 rounded text-white text-xs font-bold focus:ring-1 focus:ring-blue-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], size: Math.min(72, (prev[selectedTag].size ?? 9) + 1) } }))}
                  className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold flex items-center justify-center text-xs"
                  title="Tăng cỡ chữ (1pt)"
                >
                  +
                </button>
              </div>

              {/* In đậm B */}
              <button
                type="button"
                onClick={() => {
                  const nextWeight = config[selectedTag].fontWeight === 'bold' ? 'normal' : 'bold';
                  setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], fontWeight: nextWeight } }));
                }}
                className={`h-6 px-2 rounded text-xs font-bold border transition-all flex items-center gap-1 ${
                  config[selectedTag].fontWeight === 'bold'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={config[selectedTag].fontWeight === 'bold' ? 'Đang In Đậm (Click để hủy)' : 'In Đậm (Bold)'}
              >
                <span className="font-extrabold text-xs">B</span>
              </button>

              {/* Căn lề Trái / Giữa / Phải */}
              <div className="flex items-center bg-slate-800 border border-slate-700 p-0.5 rounded gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const autoDims = calcAutoFitDimensions(selectedTag, config[selectedTag]?.size || 9, config[selectedTag]?.value, config, liveMappedData);
                    setConfig(prev => ({
                      ...prev,
                      [selectedTag]: {
                        ...prev[selectedTag],
                        align: 'left',
                        width: prev[selectedTag].width || autoDims.width,
                        height: prev[selectedTag].height || autoDims.height,
                      }
                    }));
                  }}
                  className={`h-5 px-1.5 rounded text-[11px] font-bold transition-all ${
                    (!config[selectedTag].align || config[selectedTag].align === 'left')
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Căn lề Trái"
                >
                  Trái
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const autoDims = calcAutoFitDimensions(selectedTag, config[selectedTag]?.size || 9, config[selectedTag]?.value, config, liveMappedData);
                    setConfig(prev => ({
                      ...prev,
                      [selectedTag]: {
                        ...prev[selectedTag],
                        align: 'center',
                        width: prev[selectedTag].width || autoDims.width,
                        height: prev[selectedTag].height || autoDims.height,
                      }
                    }));
                  }}
                  className={`h-5 px-1.5 rounded text-[11px] font-bold transition-all ${
                    config[selectedTag].align === 'center'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Căn Giữa"
                >
                  Giữa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const autoDims = calcAutoFitDimensions(selectedTag, config[selectedTag]?.size || 9, config[selectedTag]?.value, config, liveMappedData);
                    setConfig(prev => ({
                      ...prev,
                      [selectedTag]: {
                        ...prev[selectedTag],
                        align: 'right',
                        width: prev[selectedTag].width || autoDims.width,
                        height: prev[selectedTag].height || autoDims.height,
                      }
                    }));
                  }}
                  className={`h-5 px-1.5 rounded text-[11px] font-bold transition-all ${
                    config[selectedTag].align === 'right'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Căn lề Phải"
                >
                  Phải
                </button>
              </div>

              {/* Vị trí & Kích thước X, Y, W */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                <span className="text-slate-400 font-mono font-semibold">X:</span>
                <input
                  type="number"
                  step="0.5"
                  value={config[selectedTag].x}
                  onChange={(e) => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], x: Number(e.target.value) } }))}
                  className="w-12 h-5 text-center bg-slate-950 border border-slate-600 rounded text-white font-mono text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                  title="Tọa độ X"
                />
                <span className="text-slate-400 font-mono font-semibold ml-1">Y:</span>
                <input
                  type="number"
                  step="0.5"
                  value={config[selectedTag].y}
                  onChange={(e) => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], y: Number(e.target.value) } }))}
                  className="w-12 h-5 text-center bg-slate-950 border border-slate-600 rounded text-white font-mono text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                  title="Tọa độ Y"
                />
                <span className="text-slate-400 font-mono font-semibold ml-1">W:</span>
                <input
                  type="number"
                  step="1"
                  value={config[selectedTag].width || ''}
                  placeholder="auto"
                  onChange={(e) => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], width: Number(e.target.value) || undefined } }))}
                  className="w-11 h-5 text-center bg-slate-950 border border-slate-600 rounded text-white font-mono text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                  title="Độ rộng khung chứa (Width)"
                />
                {config[selectedTag].type === 'circle' && (
                  <>
                    <span className="text-slate-400 font-mono font-semibold ml-1">H:</span>
                    <input
                      type="number"
                      step="1"
                      value={config[selectedTag].height || 20}
                      onChange={(e) => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], height: Number(e.target.value) } }))}
                      className="w-10 h-5 text-center bg-slate-950 border border-slate-600 rounded text-white font-mono text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                      title="Độ cao (Height)"
                    />
                  </>
                )}
                {(config[selectedTag].type === 'line' || config[selectedTag].type === 'circle') && (
                  <>
                    <span className="text-slate-400 font-mono font-semibold ml-1">Dày:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={config[selectedTag].thickness || 1}
                      onChange={(e) => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], thickness: Number(e.target.value) } }))}
                      className="w-10 h-5 text-center bg-slate-950 border border-slate-600 rounded text-white font-mono text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                      title="Độ dày nét vẽ"
                    />
                  </>
                )}
              </div>

              {/* Auto-fit Button */}
              <button
                type="button"
                onClick={() => {
                  const dims = calcAutoFitDimensions(selectedTag, config[selectedTag]?.size || 9, config[selectedTag]?.value, config, liveMappedData);
                  setConfig(prev => ({
                    ...prev,
                    [selectedTag]: { ...prev[selectedTag], width: dims.width, height: dims.height }
                  }));
                }}
                className="h-6 px-2 bg-teal-700/80 hover:bg-teal-600 text-white rounded text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                title="Tự động co dãn chiều rộng vừa khít chữ"
              >
                ✨ Auto-fit
              </button>
            </div>

            {/* Nhóm 3: Nội dung / Snap / Xóa / Đóng */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Content Text Input */}
              {(!config[selectedTag].type || config[selectedTag].type === 'text') && (() => {
                const baseKey = selectedTag.split('#')[0];
                let displayVal = config[selectedTag].value ?? ((liveMappedData ? liveMappedData[baseKey] : (showMockData ? MOCK_DATA[baseKey] : '')));
                return (
                  <input
                    type="text"
                    value={displayVal || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], value: e.target.value } }))}
                    placeholder="Chữ tĩnh / Xem trước..."
                    className="w-32 h-6 text-[11px] px-2 bg-slate-950 border border-slate-600 rounded text-slate-200 font-mono focus:ring-1 focus:ring-blue-400 outline-none"
                    title="Nhập chữ tĩnh hoặc nội dung xem trước"
                  />
                );
              })()}

              {/* Series Auto-fill if applicable */}
              {(() => {
                const seriesInfo = getSplitSeriesInfo(selectedTag);
                if (!seriesInfo || seriesInfo.missingTags.length === 0) return null;
                return (
                  <button
                    type="button"
                    onClick={() => handleAutoFillSeries(selectedTag, autoFillStep)}
                    className="h-6 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-all flex items-center gap-1"
                    title={`Tự động ghim ${seriesInfo.missingTags.length} thẻ còn lại của dãy`}
                  >
                    ⚡ Auto-fill ({seriesInfo.missingTags.length})
                  </button>
                );
              })()}

              {/* Snap to target */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                <select
                  className="h-5 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-300 max-w-[90px]"
                  id="snapTargetSelect"
                  defaultValue=""
                  title="Chọn thẻ mẫu để bắt thẳng hàng"
                >
                  <option value="" disabled>Bắt điểm...</option>
                  {Object.keys(config).filter(t => t !== selectedTag).map(t => (
                    <option key={t} value={t}>{getTagLabel(t)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('snapTargetSelect') as HTMLSelectElement;
                    const target = el?.value;
                    if (target && config[target]) {
                      setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], y: config[target].y } }));
                    }
                  }}
                  className="h-5 px-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-bold"
                  title="Căn thẳng hàng ngang (bằng Y)"
                >
                  =Y
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('snapTargetSelect') as HTMLSelectElement;
                    const target = el?.value;
                    if (target && config[target]) {
                      setConfig(prev => ({ ...prev, [selectedTag]: { ...prev[selectedTag], x: config[target].x } }));
                    }
                  }}
                  className="h-5 px-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-bold"
                  title="Căn thẳng hàng dọc (bằng X)"
                >
                  =X
                </button>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => {
                  handleDeleteTag(selectedTag);
                  setSelectedTag(null);
                }}
                className="h-6 px-2 bg-red-600/80 hover:bg-red-600 text-white rounded text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
                title="Xóa thẻ này"
              >
                🗑️ Xóa
              </button>

              {/* Close selection */}
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="h-6 w-6 text-slate-400 hover:text-white rounded hover:bg-slate-800 flex items-center justify-center font-bold text-xs"
                title="Đóng thanh định dạng"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* WORD-STYLE HORIZONTAL MULTI-TAG RIBBON TOOLBAR (BATCH MODE) */}
        {selectedTags.length > 1 && (
          <div className="bg-slate-900 border-b border-slate-700 text-slate-200 px-3 py-1.5 flex items-center justify-between gap-2 text-xs flex-wrap shadow-md z-30 select-none">
            {/* Nhóm 1: Thống kê & Căn vị trí */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1 shrink-0">
                🎯 Đã chọn: <strong className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/50">{selectedTags.length} thẻ</strong>
              </span>
              <div className="h-4 w-px bg-slate-700 my-auto shrink-0"></div>
              
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleBatchAlignTop}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-xs font-bold shadow transition-all flex items-center gap-0.5"
                  title="Căn hàng ngang theo mép Y trên cùng"
                >
                  ⬆️ Top
                </button>
                <button
                  type="button"
                  onClick={handleBatchAlignBottom}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-xs font-bold shadow transition-all flex items-center gap-0.5"
                  title="Căn hàng ngang theo mép Y dưới cùng"
                >
                  ⬇️ Bottom
                </button>
                <button
                  type="button"
                  onClick={handleBatchAlignLeft}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs font-bold shadow transition-all flex items-center gap-0.5"
                  title="Căn lề cột dọc theo mép trái (Min X)"
                >
                  ⬅️ Left
                </button>
                <button
                  type="button"
                  onClick={handleBatchAlignRight}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs font-bold shadow transition-all flex items-center gap-0.5"
                  title="Căn lề cột dọc theo mép phải (Max X)"
                >
                  ➡️ Right
                </button>
                {selectedTags.length >= 3 && (
                  <button
                    type="button"
                    onClick={handleBatchDistributeX}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded text-xs font-bold shadow transition-all flex items-center gap-0.5"
                    title="Tự động phân bổ cách đều theo chiều ngang"
                  >
                    ↔️ Đều X
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBatchAutoFit}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-2 py-0.5 rounded text-xs font-bold shadow transition-all flex items-center gap-0.5"
                  title="Tự động co dãn kích thước vừa khít chữ mẫu"
                >
                  ✨ Auto-fit
                </button>
              </div>
            </div>

            {/* Nhóm 2: Cỡ chữ & Định dạng chữ */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Cỡ chữ */}
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded shrink-0">
                <span className="text-[11px] font-bold text-slate-300">Cỡ:</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = config[selectedTags[0]]?.size ?? 9;
                    handleBatchSetFontSize(Math.max(4, current - 1));
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs w-4 h-4 rounded font-bold flex items-center justify-center border border-slate-500"
                  title="Giảm cỡ chữ cho tất cả thẻ đang chọn"
                >
                  -
                </button>
                <input
                  type="number"
                  min="4"
                  max="72"
                  value={config[selectedTags[0]]?.size ?? 9}
                  onChange={(e) => handleBatchSetFontSize(Number(e.target.value) || 9)}
                  className="w-8 text-center bg-slate-950 border border-slate-600 text-white font-bold text-xs rounded py-0 focus:ring-1 focus:ring-blue-400 outline-none"
                  title="Nhập cỡ chữ cho tất cả thẻ đang chọn"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = config[selectedTags[0]]?.size ?? 9;
                    handleBatchSetFontSize(Math.min(72, current + 1));
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs w-4 h-4 rounded font-bold flex items-center justify-center border border-slate-500"
                  title="Tăng cỡ chữ cho tất cả thẻ đang chọn"
                >
                  +
                </button>
              </div>

              {/* In đậm / In thường */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleBatchSetFontWeight('bold')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-0.5 rounded text-xs font-bold border border-slate-600 transition-all flex items-center gap-0.5"
                  title="In đậm tất cả thẻ đã chọn"
                >
                  <strong>B</strong> Đậm
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchSetFontWeight('normal')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-xs font-medium border border-slate-600 transition-all"
                  title="Chữ thường tất cả thẻ đã chọn"
                >
                  Thường
                </button>
              </div>

              {/* Căn lề văn bản */}
              <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-600 p-0.5 rounded shrink-0">
                <button
                  type="button"
                  onClick={() => handleBatchSetAlign('left')}
                  className="hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
                  title="Căn văn bản lề trái"
                >
                  Trái
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchSetAlign('center')}
                  className="hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
                  title="Căn văn bản chính giữa"
                >
                  Giữa
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchSetAlign('right')}
                  className="hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition-all"
                  title="Căn văn bản lề phải"
                >
                  Phải
                </button>
              </div>
            </div>

            {/* Nhóm 3: Xóa & Hủy */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleBatchDelete()}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-xs font-bold shadow transition-all flex items-center gap-0.5 shrink-0"
                title="Xóa tất cả các thẻ đang chọn"
              >
                🗑️ Xóa ({selectedTags.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-slate-400 hover:text-white text-xs underline ml-1 shrink-0"
                title="Bỏ chọn tất cả"
              >
                ✕ Hủy
              </button>
            </div>
          </div>
        )}

        <div ref={pdfContainerRef} className="flex-1 overflow-auto flex flex-col items-center p-8 gap-8">
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
                  className={`relative shadow-xl bg-white mb-8 transition-all select-none ${
                    activeMode === 'add'
                      ? 'cursor-crosshair ring-4 ring-emerald-400'
                      : activeMode === 'delete'
                        ? 'cursor-not-allowed ring-4 ring-red-400'
                        : 'cursor-default'
                  }`}
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
                          onMouseDown={(e) => handlePinMouseDown(e, tag, index)}
                          className={`pdf-tag-pin absolute group cursor-move select-none ${isSelected ? 'z-50' : 'z-10'} ${isBatchSelected ? 'ring-4 ring-red-500 bg-red-100/50 rounded z-40' : ''}`}
                          style={{ 
                            left: `${left * pdfScale}px`, 
                            top: `${top * pdfScale}px`, 
                            transform: (!coord.type || coord.type === 'text') ? `translateY(${PDF_BASELINE_OFFSET_EM}em)` : 'none',
                            fontSize: `${(coord.size ?? 9) * pdfScale}px` 
                          }} 
                        >
                          <div className={`w-1.5 h-1.5 rounded-full absolute bottom-0 left-0 -translate-x-1/2 ${(!coord.type || coord.type === 'text') ? `translate-y-[${-PDF_BASELINE_OFFSET_EM}em]` : 'translate-y-1/2'} ${isBatchSelected ? 'bg-red-600 ring-2 ring-red-300 z-50' : isSelected ? 'bg-blue-600 ring-2 ring-blue-300 z-50' : 'bg-red-500 z-10'}`}></div>
                          
                          {isSelected && (
                            <div 
                              className="absolute -top-3.5 -left-3.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center cursor-grab active:cursor-grabbing shadow z-50 hover:scale-110 transition-transform"
                              title="Kéo để di chuyển vị trí (x, y)"
                            >
                              📍
                            </div>
                          )}

                          {coord.type === 'line' ? (
                            <div 
                              style={{ width: `${(coord.width || 100) * pdfScale}px`, height: `${(coord.thickness || 1) * pdfScale}px`, backgroundColor: 'black', position: 'absolute', bottom: 0, left: 0 }}
                              className={isSelected ? 'ring-2 ring-blue-400' : ''}
                            >
                              {isSelected && (
                                <div 
                                  onMouseDown={(e) => handleResizeMouseDown(e, tag, 'line-width')}
                                  className="absolute -right-1.5 -top-1 w-3 h-3 bg-blue-600 border border-white rounded-full cursor-ew-resize hover:scale-125 z-50 shadow"
                                  title="Kéo để thay đổi độ dài đường kẻ"
                                />
                              )}
                            </div>
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
                                pointerEvents: isSelected ? 'auto' : 'none'
                              }}
                              className={isSelected ? 'ring-2 ring-blue-400 bg-blue-100/30' : ''}
                            >
                              {isSelected && (
                                <div 
                                  onMouseDown={(e) => handleResizeMouseDown(e, tag, 'circle-size')}
                                  className="absolute -right-1 -bottom-1 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full cursor-se-resize hover:scale-125 z-50 shadow"
                                  title="Kéo để thay đổi kích thước khoanh tròn"
                                />
                              )}
                            </div>
                          ) : (() => {
                            const baseKey = tag.split('#')[0];
                            const mockVal = (showMockData && !tag.startsWith('static_')) ? MOCK_DATA[baseKey] : undefined;
                            const liveVal = (liveMappedData && !tag.startsWith('static_')) ? liveMappedData[baseKey] : undefined;
                            const finalMockVal = liveVal ?? mockVal;
                            let valToRender = coord.value !== undefined ? coord.value : (finalMockVal !== undefined ? finalMockVal : '');

                            const monetaryKeys = [
                              'totalExpectedJpy', 'received1stJpy', 'received2ndJpy', 'withheldTax',
                              'retirementDeductionAmount', 'taxableRetirementIncome', 'calculatedTax',
                              'refundAmount', 'tax2ndJpy', 'incomeSourceAmount', 'incomeSourceWithheld',
                              'serviceFeeJpy', 'averageStandardRemuneration'
                            ];
                            if (monetaryKeys.includes(baseKey) && valToRender) {
                              const numStr = String(valToRender).replace(/\D/g, '');
                              if (numStr) {
                                valToRender = Number(numStr).toLocaleString('en-US');
                              }
                            }

                            const placeholderToRender = (liveMappedData || showMockData) ? '' : tag;

                            return (
                              <React.Fragment>
                                <textarea
                                  value={valToRender}
                                  placeholder={placeholderToRender}
                                  onChange={(e) => setConfig(prev => ({...prev, [tag]: {...prev[tag], value: e.target.value}}))}
                                  style={{ 
                                    fontSize: 'inherit',
                                    fontWeight: coord.fontWeight || 600,
                                    color: 'black',
                                    fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif",
                                    width: coord.width ? `${coord.width * pdfScale}px` : undefined,
                                    height: coord.height ? `${coord.height * pdfScale}px` : undefined,
                                    minHeight: `${(coord.size || 12) * pdfScale * PDF_LINE_HEIGHT}px`,
                                    overflow: 'hidden',
                                    lineHeight: `${PDF_LINE_HEIGHT}`,
                                    whiteSpace: coord.width ? ((coord.height && coord.height > (coord.size || 12) * 1.6) ? 'pre-wrap' : 'nowrap') : 'pre',
                                    margin: 0,
                                    padding: 0,
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    resize: 'none',
                                    textAlign: coord.align || 'left'
                                  }}
                                />
                                {isSelected && (
                                  <div 
                                    onMouseDown={(e) => handleResizeMouseDown(e, tag, 'text-box')}
                                    className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full cursor-se-resize hover:scale-125 z-50 shadow"
                                    title="Kéo để thay đổi kích thước khung chữ"
                                  />
                                )}
                              </React.Fragment>
                            );
                          })()}
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
