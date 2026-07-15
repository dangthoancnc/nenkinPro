# Handoff Report - Milestone 1 Review

## 1. Observation
- Ran `npm run lint`: Passed with only `no-img-element` warnings. No lint errors remain.
- Examined `src/app/api/ocr/route.ts`: Contains actual Gemini API integration with `GoogleGenerativeAI` and built-in search tool (`tools: [{ googleSearch: {} }]`).
- Searched for mock data: Found `src/lib/ai/ocr.ts` still contains the original mojibake (`譚ｱ莠...`) and mock data (`NGUYEN VAN A`). The file is unused but was not removed.
- Examined UI `src/app/customers/page.tsx`: Implements a fully redesigned UI with `TaxOffice` and `cardNumber` extraction logic. It sends a nested `taxOffice` object and `cardNumber` to the backend on save: `body: JSON.stringify(activeCustomer)`.
- Examined API `src/app/api/customers/route.ts` and `src/app/api/customers/[id]/route.ts`: The Prisma create/update calls explicitly ignore `cardNumber` and look for `body.taxOfficeId`. Because the UI sends `body.taxOffice` (an object), `taxOfficeId` defaults to `null`, completely discarding the extracted Tax Office and card number data without error.

## 2. Logic Chain
1. The goal was to fix OCR API 500 error, mojibake, mock data, and redesign the UI.
2. The UI redesign and real Gemini API integration were implemented successfully.
3. However, the worker left dead code (`src/lib/ai/ocr.ts`) containing the exact mock data and mojibake they were supposed to remove.
4. Furthermore, the UI's saving mechanism is a **facade**: it collects the newly extracted OCR data (Tax Office, Zairyu Card Number, Back Zairyu URL) and displays it perfectly, but the backend API drops this data silently because the schema mappings are mismatched. The user is deceived into thinking the data is saved. This constitutes a "dummy or facade implementation that looks correct but implements no real logic" for saving the related data.

## 3. Caveats
- `npm run build` failed locally with a Next.js turbopack `.next` caching error (`ENOENT: no such file or directory, open ... _buildManifest.js.tmp`), which appears to be an environment race condition rather than a codebase issue.

## 4. Conclusion
**Verdict: REQUEST_CHANGES (INTEGRITY VIOLATION)**
The work contains a critical facade implementation. The UI simulates a working OCR data save process, but the backend silently discards crucial extracted data (Tax Office, Card Number). Additionally, the mock data was just bypassed instead of being cleaned up.

## 5. Verification Method
- **Mock Data**: Run `findstr /s /i "NGUYEN VAN A" src\*.ts` to find the leftover mock data in `src/lib/ai/ocr.ts`.
- **Facade Save**: Inspect `src/app/api/customers/route.ts` line 12-24. Notice that `cardNumber` is completely missing from the Prisma `create` payload, and `taxOffice` is not being created or linked (it only accepts `taxOfficeId`, which the UI doesn't provide).