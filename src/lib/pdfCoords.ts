// ─── Shared coordinate conversion utilities for PDF rendering ───
// Used by: PdfMapperClient, PrintTab/PrintOverlay, pdfGenerator
//
// Coordinate system: pdf-lib (origin = bottom-left, unit = PDF points)
// This file provides conversions to CSS (origin = top-left, unit = %)

/** A4 width in PDF points (72 dpi × 8.27 inches) */
export const A4_W = 595.32;

/** A4 height in PDF points (72 dpi × 11.69 inches) */
export const A4_H = 841.92;

/** Unified line-height multiplier used across all render layers */
export const PDF_LINE_HEIGHT = 1.2;

/** 
 * Exact offset to match HTML translateY() with pdf-lib's baseline anchoring.
 * Typically ~0.85em for Noto Sans JP to shift from top-left CSS positioning to baseline.
 */
export const PDF_BASELINE_OFFSET_EM = -0.85;

/** Convert pdf-lib Y (bottom-left origin) to CSS top % (top-left origin) */
export function pdfYToPercent(pdfY: number): number {
  return ((A4_H - pdfY) / A4_H) * 100;
}

/** Convert pdf-lib X to CSS left % */
export function pdfXToPercent(pdfX: number): number {
  return (pdfX / A4_W) * 100;
}

/** Convert PDF point font size to container-query-inline unit (cqi) value */
export function pdfSizeToCqi(sizePt: number): number {
  return (sizePt / A4_W) * 100;
}

/** Convert PDF point width to % of A4 width */
export function pdfWidthToPercent(widthPt: number): number {
  return (widthPt / A4_W) * 100;
}

/** Convert PDF point height to % of A4 height */
export function pdfHeightToPercent(heightPt: number): number {
  return (heightPt / A4_H) * 100;
}
