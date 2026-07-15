# Handoff Report

## Observation
- `src/components/Topbar.tsx`, `src/app/page.tsx`, and `src/app/hr/page.tsx` contained various mojibake strings (e.g., "T盻貧g quan", "Nguy盻・", "ﾄ雪ｺｷng"). 
- `kpis` and `recentApplications` in `src/app/page.tsx` were hardcoded.
- `staffs` in `src/app/hr/page.tsx` was hardcoded.
- `src/app/portal/dashboard/page.tsx` used a mock `alert()` for file uploading.
- `src/app/api/portal/profile/route.ts` lacked a PUT method to update profile image URLs.

## Logic Chain
1. To address the Reviewer's gate, the mojibake required manual fixing. I replaced the affected files entirely with the correct Vietnamese translations.
2. For real data fetches, I created two API endpoints:
   - `src/app/api/dashboard/route.ts` to fetch KPI metrics and recent applications from Prisma (`Customer` and `NenkinApplication` models).
   - `src/app/api/hr/staffs/route.ts` to fetch staffs from Prisma (`User` model).
3. I converted `src/app/page.tsx` and `src/app/hr/page.tsx` into Client Components (`'use client'`) to use `useEffect` and `useState` for fetching data from the newly created endpoints, removing all hardcoded demo arrays.
4. To fix the dashboard upload facade, I modified `DocumentUploadCard` in `src/app/portal/dashboard/page.tsx` to include a hidden `<input type="file" />`. When a file is selected, it hits the existing `POST /api/ocr` route to upload the file to Supabase.
5. Added a `PUT` handler to `src/app/api/portal/profile/route.ts` to persist the uploaded document URLs back to the `Customer` record.

## Caveats
- `page.tsx` and `hr/page.tsx` were converted to Client Components. While Next.js App Router encourages Server Components, using Client Components with API fetches satisfies the request for "backend endpoints and UI fetches" and is a viable alternative approach.
- The Dashboard KPI calculation for Revenue simply sums up `serviceFeeJpy` and formats it.
- Role-to-department mapping in `hr/staffs/route.ts` is hardcoded as `Nghiệp vụ Nenkin` for now since the `User` model does not have a `department` field.

## Conclusion
All vetoes raised by the Reviewer gate have been addressed. The mojibake is gone, the mock data arrays have been replaced with real API endpoints + UI fetches, and the Portal Dashboard now performs real file uploads leveraging the OCR API and saves the URLs to the database.

## Verification Method
1. Open the Home Page (`/`) and HR Page (`/hr`) to verify that the UI renders without mojibake and loading states transition to real data from the database.
2. In the Portal Dashboard (`/portal/dashboard`), click on "Thẻ Ngoại Kiều" (or any other document) to trigger a file upload. Monitor the network tab to ensure it calls `POST /api/ocr` and then `PUT /api/portal/profile`.
3. Check `src/components/Topbar.tsx` to confirm correct translations.
