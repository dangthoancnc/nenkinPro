import type { FieldMapping } from './template-schema';
import type { PdfPageMetrics } from './mapper-types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundPt(value: number): number {
  return Math.round(value * 10) / 10;
}

export function pdfPointToCanvasPercent(
  x: number,
  y: number,
  page: PdfPageMetrics,
): { leftPct: number; topPct: number } {
  return {
    leftPct: (x / page.width) * 100,
    topPct: ((page.height - y) / page.height) * 100,
  };
}

export function canvasPointerToPdfPoint(
  pointerX: number,
  pointerY: number,
  canvasW: number,
  canvasH: number,
  page: PdfPageMetrics,
): { x: number; y: number } {
  const x = roundPt(clamp((pointerX / Math.max(canvasW, 1)) * page.width, 0, page.width));
  const y = roundPt(clamp(page.height - (pointerY / Math.max(canvasH, 1)) * page.height, 0, page.height));
  return { x, y };
}

export function patchField(
  fields: FieldMapping[],
  id: string,
  patch: Partial<FieldMapping>,
): FieldMapping[] {
  return fields.map((f) =>
    f.id === id
      ? {
          ...f,
          ...patch,
          coordinate: { ...f.coordinate, ...(patch.coordinate ?? {}) },
          font: { ...f.font, ...(patch.font ?? {}) },
        }
      : f,
  );
}
