# Milestone 1: Explorer Synthesis

## Consensus
- **OCR API Error**: `src/app/api/ocr/route.ts` directly calls `fetch(imageUrl)` without validating the URL or handling exceptions. This bubbles up to a 500 error. The fix is to add URL validation (`new URL()`) and a `try/catch` around the fetch, returning a 400 Bad Request if the URL is invalid.
- **UI Consolidation**: `src/app/customers/page.tsx` contains separate "Trích xuất bằng AI" buttons. These need to be removed. A single "Trích xuất dữ liệu" button must be added to the header section (left panel). The new button should trigger `handleExtractOcr` for all relevant uploaded images (Front and Back).
- **UI Redesign**: The right-side image panel in `src/app/customers/page.tsx` uses dark mode Tailwind classes (`bg-slate-800`, `bg-slate-900`, `border-slate-700`, `bg-black/50`, etc.). These must be replaced with light enterprise-standard UI classes (`bg-slate-100`, `bg-white`, `border-slate-200`, `bg-slate-50/50`).

## Gaps
- None identified.

## Instruction for Worker
Implement the changes identified above. Verify by running the Next.js build and any lint/test commands.
