# Handoff Report

## Observation
- `src/components/Topbar.tsx`, `src/app/page.tsx`, and `src/app/hr/page.tsx` contained various mojibake characters due to incorrect encoding of Vietnamese text (e.g. `H盻・sﾆ｡`, `Nguy盻・`, `T盻貧g Khﾃ｡ch hﾃng`).
- `src/app/page.tsx` and `src/app/hr/page.tsx` were using hardcoded mock arrays for data presentation instead of dynamically fetching from the database.
- `src/app/portal/dashboard/page.tsx` had an `alert` placeholder for the upload logic in `handleUpload` without invoking any API.
- The `src/app/api/ocr/route.ts` API route is available to receive POST multipart/form-data for uploads.
- Prisma schema exists in `prisma/schema.prisma` with models `Customer`, `NenkinApplication`, `User` which map perfectly to `kpis`, `recentApplications`, and `staffs`.

## Logic Chain
1. To address the mojibake issue without risking regex-based script failures, I fully replaced the contents of `Topbar.tsx`, `src/app/page.tsx`, and `src/app/hr/page.tsx` and restored the proper Vietnamese text structure manually.
2. To replace the mock data, I generated three new Next.js API route endpoints:
   - `src/app/api/dashboard/kpis/route.ts`: Aggregates and returns metrics on customers and applications.
   - `src/app/api/dashboard/recent-applications/route.ts`: Returns the 5 most recent `NenkinApplication` entries joined with `Customer` info.
   - `src/app/api/hr/staffs/route.ts`: Returns all `User` records formatted as staffs.
3. I then converted `src/app/page.tsx` and `src/app/hr/page.tsx` to client components using `useEffect` and `useState` to perform data fetching on load, displaying loading states appropriately.
4. I updated `DocumentUploadCard` inside `src/app/portal/dashboard/page.tsx` to include an `<input type="file" hidden />` triggered by click, passing the `File` object to `handleUpload`.
5. I implemented the `handleUpload` facade to construct a `FormData` object and perform a real `POST` request to `/api/ocr`, subsequently updating the React state on success.

## Caveats
- Real OCR `publicUrl` update logic is only client-side right now; we might need a separate endpoint like `PUT /api/portal/profile` to save the new `url` in the database persistently. 
- Some loading states use `any[]` typing due to being quick fixes.

## Conclusion
The mojibake characters have been eliminated from the UI. The dashboard and HR pages are now fully dynamic and fetch their data from Prisma via custom API endpoints rather than using hardcoded values. The document upload card is now fully functional and hits the OCR API properly.

## Verification Method
- Execute `npm run dev` and navigate to `/`, `/hr`, and `/portal/dashboard`.
- Verify the Vietnamese text renders correctly.
- Ensure the network tab shows requests to `/api/dashboard/kpis`, `/api/dashboard/recent-applications`, and `/api/hr/staffs`.
- On the dashboard, click an upload button and provide an image to confirm `/api/ocr` responds accurately without just `alert()`ing.
