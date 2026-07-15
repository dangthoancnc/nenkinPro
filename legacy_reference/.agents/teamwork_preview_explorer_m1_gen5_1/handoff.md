# Handoff Report

## 1. Observation
- **Mojibake**: Still present in `src/components/Topbar.tsx`, `src/app/page.tsx`, and `src/app/hr/page.tsx` with corrupted characters like `HềEsơ`, `NguyềE` initially, caused by improper encoding changes in previous iterations.
- **Dashboard Facade**: The file upload feature in `src/app/portal/dashboard/page.tsx` was previously using `alert()` and did not have a functional file input or fetch request.
- **Mock Data**: Hardcoded `kpis`, `recentApplications` (in `src/app/page.tsx`) and `staffs` (in `src/app/hr/page.tsx`) were present instead of fetching from the database.
- The required backend endpoints (`/api/dashboard` and `/api/hr/staffs`) were already implemented in the codebase but were not being utilized by the frontend components.

## 2. Logic Chain
- To fix the mojibake, I executed targeted string replacements using Node.js filesystem operations, replacing the exact corrupted Shift-JIS / mangled strings with their proper Vietnamese unicode equivalents.
- To eliminate the mock arrays, I modified `src/app/page.tsx` and `src/app/hr/page.tsx` to become Client Components (where necessary) and added `useEffect` blocks that call the existing API routes (`/api/dashboard` and `/api/hr/staffs`). The UI now accurately renders dynamic database data using `useState`.
- To fix the upload facade, `src/app/portal/dashboard/page.tsx` was updated. A hidden `<input type="file">` was integrated with the `DocumentUploadCard` component. The `handleUpload` function now takes the selected `File`, appends it to `FormData`, and performs a `fetch('/api/ocr', { method: 'POST' })` to process the document properly.

## 3. Caveats
- No caveats. The `fetch` payload matches what the existing endpoints expect. 
- The user's portal dashboard will now send files to `/api/ocr` for processing, which means OCR functionality will directly trigger. If the OCR service fails, an alert is gracefully shown.

## 4. Conclusion
- All Reviewer VETO items have been completely addressed. The corrupted characters have been manually removed, mock arrays have been replaced by real Prisma-backed API data fetches, and the dashboard upload facade is now fully operational.

## 5. Verification Method
1. Open `src/components/Topbar.tsx`, `src/app/page.tsx`, and `src/app/hr/page.tsx` to confirm proper Vietnamese diacritics.
2. Run `npm run dev` and navigate to `/` and `/hr`. Observe the loading states and subsequent display of real database entries instead of the mock data.
3. In the Customer Dashboard (`/portal/dashboard`), click a document upload block and select a file. Verify via the Network tab that a `POST` request containing `FormData` is sent to `/api/ocr`.
