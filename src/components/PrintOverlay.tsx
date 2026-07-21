'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { A4_W, A4_H, PDF_LINE_HEIGHT, PDF_BASELINE_OFFSET_EM } from '@/lib/pdfCoords';

// Re-export for consumers that import from PrintOverlay
export { A4_W, A4_H };

// ── PrintContainer ────────────────────────────────────────────────
interface PrintContainerProps {
  /** Path to PDF file (e.g. '/forms/don_xin_lan_1.pdf'). Renders via react-pdf. */
  pdfFile: string;
  /** 0-indexed page to display */
  pageNumber: number;
  children: React.ReactNode;
  isLandscape?: boolean;
}

/**
 * Renders a single PDF page as background using react-pdf's <Page> component
 * and overlays children (PrintField) on top.
 *
 * The container uses `containerType: 'inline-size'` so children can use `cqi`
 * units for font sizing that scales with the container width.
 */
export const PrintContainer = ({ pdfFile, pageNumber, children, isLandscape = false }: PrintContainerProps) => {
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Setup PDF.js worker on first mount
  useEffect(() => {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  }, []);

  // Observe container width for react-pdf <Page width={}>
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pdfOptions = React.useMemo(() => ({
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
  }), []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full mx-auto bg-white shadow-xl print:shadow-none print:m-0 break-inside-avoid ${isLandscape ? 'max-w-[1414px]' : 'max-w-[1000px]'}`}
      style={{ aspectRatio: isLandscape ? '297/210' : '210/297', containerType: 'inline-size' }}
    >
      {/* Background Layer — rendered by react-pdf for pixel-perfect alignment */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-90 print:opacity-100">
        {containerWidth > 0 && (
          <Document
            file={pdfFile}
            options={pdfOptions}
            loading={null}
            error={
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Không thể tải PDF
              </div>
            }
          >
            <Page
              pageNumber={pageNumber + 1}
              width={containerWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </div>

      {/* Text Overlay Layer */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {children}
      </div>

      {/* Watermark for Dev/Preview (Hidden on Print) */}
      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded font-bold opacity-50 print:hidden pointer-events-none">
        PREVIEW MODE
      </div>
    </div>
  );
};

// ── ImagePrintContainer ────────────────────────────────────────────
interface ImagePrintContainerProps {
  /** Array of image URLs to display on this A4 page. Up to 2 images for Zairyu Card */
  images: string[];
  isLandscape?: boolean;
}

/**
 * Renders an A4 container to print uploaded images (e.g. Passport, Bank Passbook, Zairyu).
 * Uses CSS margins for Japanese standard.
 */
export const ImagePrintContainer = ({ images, isLandscape = false }: ImagePrintContainerProps) => {
  if (!images || images.length === 0) return null;

  return (
    <div
      className={`relative w-full mx-auto bg-white shadow-xl print:shadow-none print:m-0 break-inside-avoid flex flex-col items-center justify-center p-[20mm] ${isLandscape ? 'max-w-[1414px]' : 'max-w-[1000px]'}`}
      style={{ aspectRatio: isLandscape ? '297/210' : '210/297', containerType: 'inline-size' }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center gap-8">
        {images.filter(Boolean).map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`Print Image ${idx}`}
            className="max-w-full max-h-[45%] object-contain rounded-md"
            style={{ pageBreakInside: 'avoid' }}
          />
        ))}
      </div>
      
      {/* Watermark for Dev/Preview (Hidden on Print) */}
      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded font-bold opacity-50 print:hidden pointer-events-none">
        PREVIEW MODE
      </div>
    </div>
  );
};

// ── PrintField ────────────────────────────────────────────────────
export interface PrintFieldProps {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  value?: string | number | undefined | null;
  className?: string;
  charSpacing?: number; // In px, useful for spreading text like "1 2 3"
  size?: number; // Font size from config (PDF points)
  type?: 'text' | 'line' | 'circle';
  width?: number; // Width for lines/circles (PDF points)
  height?: number; // Height for circles (PDF points)
  thickness?: number; // Border thickness
  isMock?: boolean;
}

export const PrintField = ({ x, y, value, className = '', charSpacing, size = 12, type = 'text', width, height, thickness = 1, isMock = false }: PrintFieldProps) => {
  // Common style for absolute positioning using percentages
  const style: React.CSSProperties = {
    left: `${x}%`,
    top: `${y}%`,
    position: 'absolute',
    transform: type === 'text' || type === undefined ? `translateY(${PDF_BASELINE_OFFSET_EM}em)` : 'none',
    margin: 0,
    padding: 0,
  };

  if (type === 'line') {
    const widthPercent = ((width || 100) / A4_W) * 100;
    return (
      <div
        className="bg-black print:bg-black absolute"
        style={{
          ...style,
          width: `${widthPercent}%`,
          height: `${thickness}px`,
          transform: 'none' // Lines draw from exactly x, y
        }}
      />
    );
  }

  if (type === 'circle') {
    const widthPercent = ((width || 20) / A4_W) * 100;
    const heightPercent = ((height || 20) / A4_H) * 100;
    return (
      <div
        className="absolute border-black print:border-black rounded-full"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          borderWidth: `${thickness}px`,
          borderStyle: 'solid',
          transform: 'translate(-50%, -50%)',
        }}
      />
    );
  }

  if (value === undefined || value === null || value === '') return null;

  const content = charSpacing
    ? String(value).split('').map((char, i) => (
        <span key={i} style={{ display: 'inline-block', width: `${charSpacing}px`, textAlign: 'center' }}>
          {char}
        </span>
      ))
    : value;

  // Font size: convert PDF points to container-relative units (cqi)
  // A4 is 595.32 points wide. So 1pt = (1/595.32 * 100)% of container width = cqi units
  const fontSizeVw = (size / A4_W) * 100;

  return (
    <div
      className={`absolute ${width ? 'whitespace-pre-wrap' : 'whitespace-pre'} ${isMock ? 'text-red-500/70 print:text-transparent print:hidden' : 'text-black print:text-black font-semibold'} ${className}`}
      style={{
        ...style,
        fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif",
        fontSize: className.includes('text-') ? undefined : `${fontSizeVw}cqi`, // container query inline: scales with PrintContainer width
        lineHeight: PDF_LINE_HEIGHT,
      }}
    >
      {content}
    </div>
  );
};
