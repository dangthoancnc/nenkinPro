# Milestone 3 (Staff Review) Handoff Report

## Observation
- **List Page** (`src/app/applications/page.tsx`): The table lists applications fetched from `/api/applications`. Currently, the `ApplicationStatus` TypeScript type and `statusConfig` object are missing the `PENDING` state, which causes PENDING applications to lack styling or icon.
- **Detail Page** (`src/app/applications/[id]/page.tsx`): Displays application details, progress bar (`STATUS_STEPS`), and forms for financial calculation. It fetches the application data including the `Customer` object via `/api/applications/[id]/route.ts`. The UI currently lacks a way to display customer uploaded images (Zairyu Card, Passport, etc.) and lacks specific controls for the "Review" phase.
- **Prisma Schema** (`prisma/schema.prisma`): Both `CustomerStatus` and `ApplicationStatus` enums contain the `PENDING` value. The `Customer` model contains image URLs: `zairyuFrontUrl`, `zairyuBackUrl`, `passportUrl`, `nenkinBookUrl`, `bankPassbookUrl`.
- **API (Existing)**: `POST /api/onboarding` already correctly creates both `Customer` and `NenkinApplication` with `status: 'PENDING'`.
- **API (Missing)**: The `POST /api/applications/[id]/review` endpoint does not exist yet.

## Logic Chain
**1. Applications List (`src/app/applications/page.tsx`)**
- Add `PENDING` to the local `ApplicationStatus` type.
- Add an entry to `statusConfig` for `PENDING` using an orange color (e.g., `bg-orange-100 text-orange-700`) and an appropriate icon (e.g., `AlertCircle` or `Clock`).
- This will automatically highlight new applications prominently in the table as requested by the scope.

**2. Applications Detail Page (`src/app/applications/[id]/page.tsx`)**
- Add `PENDING` to the local `ApplicationStatus` and `statusSteps` arrays.
- Create an **Image Preview Section** that renders conditionally when `formData.status === 'PENDING'`. This section should display the customer's uploaded images side-by-side or in a grid (fetching them from `appData.customer.zairyuFrontUrl`, etc.).
- Add two primary action buttons in this Review section:
  - **Duyệt**: Calls `POST /api/applications/${id}/review` with `{ action: 'APPROVE' }`. On success, update the local status to `DRAFT` and re-render.
  - **Yêu cầu chụp lại ảnh**: Calls the same endpoint with `{ action: 'REJECT' }`. On success, update status to `CANCELLED` (or route back to list).

**3. API Endpoint (`src/app/api/applications/[id]/review/route.ts`)**
- Create this new route file exporting a `POST` method.
- The route expects `params: Promise<{ id: string }>` (following Next.js 15 conventions as seen in sibling routes) and a JSON body `{ action: 'APPROVE' | 'REJECT' }`.
- If `action === 'APPROVE'`:
  - Update `NenkinApplication` status to `DRAFT`.
  - Update the associated `Customer` status to `VERIFIED`.
- If `action === 'REJECT'`:
  - Update `NenkinApplication` status to `CANCELLED` (since the schema lacks a specific 'NEEDS_RETAKE' status).

## Caveats
- **Rejection Flow**: The schema does not have a dedicated status for "Request retake" (e.g., `REJECTED` or `NEEDS_REVISION`). We will use `CANCELLED` for now. Since there is no email field in the `Customer` model (only phone/PIN), the system cannot automatically notify the user. The staff will likely need to contact them manually via phone.
- **Image Accessibility**: We assume the URLs stored in the DB (like `blob:` or S3 URLs) are fully accessible by the staff client.
- **Next.js 15 Async Params**: Make sure to await `params` in the new API route to prevent Next.js 15 runtime errors.

## Conclusion & Next Steps for Worker
The worker can proceed with full implementation.
1. Update `src/app/applications/page.tsx` and `src/app/applications/[id]/page.tsx` types/configs to support `PENDING`.
2. Add the Image Preview and Approve/Reject UI to the Detail page (`src/app/applications/[id]/page.tsx`), visible during the `PENDING` state.
3. Create the missing API endpoint at `src/app/api/applications/[id]/review/route.ts` to handle the `APPROVE` and `REJECT` actions as outlined above.

## Verification Method
- **UI Test**: Navigate to `/applications`. Verify that `PENDING` records have an orange tag.
- **Detail Test**: Click on a `PENDING` application. Verify that uploaded images are visible.
- **Action Test**: Click "Duyệt" and ensure the application status changes to `DRAFT` without errors.
- **Build Check**: Run `npm run build` to ensure no TypeScript or Next.js 15 routing errors are introduced.
