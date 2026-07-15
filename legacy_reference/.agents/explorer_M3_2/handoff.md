# Handoff Report: Milestone 3 (Staff Review)

## Observation
- The data model (`prisma/schema.prisma`) includes `PENDING` for both `CustomerStatus` and `ApplicationStatus`. Images uploaded during onboarding are stored on the `Customer` record (`zairyuFrontUrl`, `zairyuBackUrl`, `passportUrl`, `nenkinBookUrl`, `bankPassbookUrl`).
- The application list (`src/app/applications/page.tsx`) displays applications but currently lacks the `PENDING` state in its `statusConfig` dictionary, meaning PENDING applications might error or not render their status tag correctly.
- The application detail page (`src/app/applications/[id]/page.tsx`) lacks a dedicated review UI (image preview and approval buttons) for newly submitted `PENDING` applications.
- The API route `src/app/api/applications/[id]/review/route.ts` does not currently exist.
- The onboarding API (`src/app/api/onboarding/route.ts`) correctly creates new records with `status: 'PENDING'`.

## Logic Chain
1. **UI List Update (`src/app/applications/page.tsx`)**: 
   - Add `PENDING` to `statusConfig` with an orange tag style (e.g., `bg-orange-100 text-orange-700`). 
   - Add a stat card for "Cần duyệt (Pending)" at the top to prominently highlight applications requiring staff attention.
2. **Review API (`src/app/api/applications/[id]/review/route.ts`)**: 
   - Create this new POST endpoint accepting a body of `{ action: "APPROVE" | "REJECT" }`. 
   - For `APPROVE`, update the `NenkinApplication` status to `DRAFT` and `Customer` status to `VERIFIED`. 
   - For `REJECT`, update the `NenkinApplication` status to `CANCELLED` (since there is no explicit `REJECTED` or `NEEDS_REVISION` state).
3. **Review UI (`src/app/applications/[id]/page.tsx`)**: 
   - Conditionally render a "Review Panel" at the top of the detail page if the application's status is `PENDING`. 
   - This panel must display a grid of the uploaded images using URLs from `appData.customer`.
   - Show OCR fields (`cardNumber`, `zairyuAddress` from the customer record) so staff can verify them against the Zairyu image.
   - Include "Duyệt" (Approve) and "Yêu cầu chụp lại ảnh" (Reject) buttons which trigger the new review API, show a loading state, and redirect back to the application list on success.

## Caveats
- There is currently no email or notification system in place. Therefore, clicking "Yêu cầu chụp lại ảnh" (Reject) will only change the database status to `CANCELLED` without actually notifying the customer. This might be addressed in a future milestone.
- Changing a status to `CANCELLED` upon rejection means the customer might have to restart the onboarding process to submit new photos, unless a specific resubmission flow is introduced later.
- Ensure the image preview UI handles missing images gracefully, in case an image failed to upload during onboarding.

## Conclusion
The worker should execute the implementation in three steps:
1. Create the `POST /api/applications/[id]/review/route.ts` API.
2. Update the `src/app/applications/page.tsx` list to properly style and highlight `PENDING` records.
3. Implement the conditionally rendered Review Panel in `src/app/applications/[id]/page.tsx` to display customer images, OCR data, and the Approve/Reject action buttons.

## Verification Method
- **API**: Create a dummy PENDING application via `POST /api/onboarding`. Then use curl or Postman to call `POST /api/applications/[id]/review` with `{"action": "APPROVE"}` and verify the DB statuses change to `DRAFT` (Application) and `VERIFIED` (Customer).
- **UI**: Navigate to `/applications` in the browser and observe the new orange PENDING tags. Click into a PENDING application and observe the Review Panel with images and functional action buttons.
