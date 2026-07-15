# Handoff Report: Milestone 3 (Staff Review) Strategy

## 1. Observation
- **List Page (`src/app/applications/page.tsx`)**: The UI defines an internal `ApplicationStatus` type and `statusConfig` object for rendering statuses. However, `PENDING` is missing from these front-end configurations, despite existing in `prisma/schema.prisma`.
- **Detail Page (`src/app/applications/[id]/page.tsx`)**: The page lacks a section to display the customer's uploaded document images (such as `zairyuFrontUrl`, `passportUrl`, etc.) and does not have dedicated review action buttons. The application query in `GET /api/applications/[id]` already includes the `customer` relation, so the image URLs are available in the front-end state.
- **API (`src/app/api/applications/[id]/route.ts`)**: Standard REST methods exist, but there is no dedicated endpoint for the staff workflow review actions (Approve / Request Retake).
- **Database (`prisma/schema.prisma`)**: The `NenkinApplication` model has a `status` field using the `ApplicationStatus` enum (which includes `PENDING`). However, there is no field to store a rejection reason if the staff requests a retake.

## 2. Logic Chain
Based on the observations, the implementation strategy is as follows:

1. **Highlight PENDING Applications**:
   - In `src/app/applications/page.tsx` and `src/app/applications/[id]/page.tsx`, add `PENDING` to the `ApplicationStatus` UI types.
   - In `statusConfig`, configure `PENDING` with an orange tag: `{ label: 'Chờ duyệt', color: 'bg-orange-50 text-orange-700', icon: Clock }` (or similar).

2. **Image Preview Capability**:
   - In `src/app/applications/[id]/page.tsx`, create a "Hồ sơ đính kèm" (Attached documents) section.
   - Render `<img>` elements for available customer document URLs (`appData.customer.zairyuFrontUrl`, `appData.customer.passportUrl`, etc.).
   - Implement a simple click-to-preview feature (e.g., opening the image in a modal or a new tab).

3. **Staff Review Actions**:
   - In `src/app/applications/[id]/page.tsx`, conditionally render a "Review Actions" panel when `appData.status === 'PENDING'`.
   - Add a button for "Duyệt" (Approve) that allows the staff to select the next state (`DRAFT` or `RECEIVED_1ST`) and calls the review API.
   - Add a button for "Yêu cầu chụp lại ảnh" (Request Retake) that prompts for a reason and calls the review API.

4. **API Integration**:
   - Create `src/app/api/applications/[id]/review/route.ts` (POST method).
   - The endpoint will accept a payload like `{ action: 'APPROVE', nextStatus: 'DRAFT' | 'RECEIVED_1ST' }` or `{ action: 'REJECT', reason: string }`.
   - For `APPROVE`, update the `NenkinApplication` status to `nextStatus`.
   - For `REJECT`, update the `NenkinApplication` status to `CANCELLED` (or leave it `PENDING`) and set the `CustomerStatus` back to `NEW` so the user can re-submit.

## 3. Caveats
- **Rejection Reason Storage**: There is currently no `notes` or `rejectionReason` column in the `NenkinApplication` schema. The API can accept the reason, but it will not be persisted in the DB unless the schema is updated. For this milestone, the action can just update the statuses to allow a re-submission.
- **Image Optimization**: If using Next.js `<Image>`, the remote domains must be configured in `next.config.js`. It is safer and simpler to use standard `<img>` tags for the previews to avoid build/runtime config errors.
- **Routing Context**: The prompt specified `/staff/applications`, but the investigation confirms that the staff portal is located at `/applications`. The strategy correctly targets the existing `/applications` routes.

## 4. Conclusion
The implementation can proceed entirely within the existing `/applications` routes without needing to scaffold a new `/staff` section. 
**Next steps for the Implementer:**
1. Update `src/app/applications/page.tsx` and `[id]/page.tsx` types/configs to support and style the `PENDING` status with an orange tag.
2. Add the Image Preview section and the conditionally rendered Review Action buttons to `src/app/applications/[id]/page.tsx`.
3. Create the `POST /api/applications/[id]/review/route.ts` API endpoint to handle the `APPROVE` and `REJECT` logic, updating the database accordingly.

## 5. Verification Method
- **UI Tag**: Seed or manually update an application's status to `PENDING` in the database. Open `/applications` and verify the "Chờ duyệt" orange tag appears.
- **Preview & Actions**: Navigate to the detail page of the `PENDING` application. Verify that the customer's uploaded images are visible and can be clicked/previewed. Verify that the "Duyệt" and "Yêu cầu chụp lại ảnh" buttons are visible.
- **API Flow**: Click "Duyệt", select `DRAFT`, and submit. Verify that the UI updates, the API returns a 200 OK, and the database status is updated to `DRAFT`.
