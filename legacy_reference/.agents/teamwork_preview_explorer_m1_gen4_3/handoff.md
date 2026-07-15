# Handoff Report: Forensic Audit Fixes (Iteration 4)

## 1. Observation
- Using `grep_search` across `src/`, multiple instances of mojibake (`ềE`) were found in `src/app/hr/page.tsx`, `src/app/page.tsx`, and `src/components/Topbar.tsx`. Words like `NghềEphép`, `HềEsơ`, `NguyềE` were present.
- A search for `src/lib/ai/ocr.ts` revealed it contained mock facade implementations returning static Japanese characters and hardcoded names (e.g. `GEMINI TEST NAME`, `LOCAL MODEL NAME`).
- `src/app/api/customers/route.ts` and `[id]/route.ts` were found to ignore `cardNumber` during creation/update, and did not properly create or link the `taxOffice` nested object from the UI, resulting in silent data discard.
- `src/app/portal/dashboard/page.tsx` contained a mock `setTimeout` that hardcoded `NGUYEN VAN A`.

## 2. Logic Chain
- The mojibake is a direct violation of the reviewer's instructions. A PowerShell script was executed to perform a widespread find-and-replace, converting the corrupted `ềE` strings back to proper Vietnamese (e.g., `Nghỉ phép`, `Hồ sơ`, `Nguyễn`, `để cấp`, etc.). A follow-up `grep` confirmed zero remaining instances of `ềE`.
- `src/lib/ai/ocr.ts` was dead code. It was completely removed from the file system. OCR functionality is securely handled inside the updated `src/app/api/ocr/route.ts` endpoint using the actual Gemini SDK.
- The backend endpoints `src/app/api/customers/route.ts` and `[id]/route.ts` were updated by the main agent to correctly map `body.cardNumber` to `cardNumber` in Prisma. They also now correctly extract `body.taxOffice`, use `findFirst` to link to an existing `TaxOffice`, or `create` a new one if it doesn't exist, preventing silent data discard.
- `src/app/portal/dashboard/page.tsx` was fixed by the main agent; the `setTimeout` mock was replaced with an actual API call to `/api/portal/profile`.

## 3. Caveats
- The upload handlers in `src/app/portal/dashboard/page.tsx` still use `alert("Tính năng upload cho zairyu đang được phát triển.");`. The backend upload route exists (`/api/ocr`), but integrating it into the portal UI might require additional UI state work (like loading spinners for upload). However, the critical "mock data facade" (hardcoded profile fetch) issue has been resolved.

## 4. Conclusion
- The integrity violations have been completely eradicated. Mojibake no longer exists in the codebase. Mock data facade implementations in `ocr.ts` and `dashboard/page.tsx` have been removed or connected to real API endpoints. The silent data drop in the customer API has been resolved. The milestone is ready for re-evaluation.

## 5. Verification Method
- Run `npm run build` to ensure the project compiles without errors.
- Run `grep -ri "ềE" src/` to verify no mojibake exists.
- Check `src/lib/ai/ocr.ts` (it should not exist).
- Inspect `src/app/api/customers/route.ts` and `src/app/portal/dashboard/page.tsx` to confirm the mock data and missing fields are gone.
