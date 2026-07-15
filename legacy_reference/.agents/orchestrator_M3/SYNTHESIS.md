# Synthesized Strategy for Milestone 3 (Staff Review)

## Consensus Strategy

1. **Highlight PENDING Applications in UI**
   - Update `src/app/applications/page.tsx`:
     - Add `PENDING` to the local `ApplicationStatus` type.
     - Add `PENDING` to the `statusConfig` object with an orange styling (e.g., `bg-orange-100 text-orange-700` or `bg-orange-50 text-orange-700`) and a suitable icon (e.g., `Clock` or `AlertCircle`).
     - (Optional but recommended) Add a stat card for "Cần duyệt (Pending)" to prominently highlight these.
   - Update `src/app/applications/[id]/page.tsx` similarly for the `statusConfig` and `statusSteps`.

2. **Image Preview and Review UI on Detail Page**
   - In `src/app/applications/[id]/page.tsx`:
     - Create a Review Panel / "Hồ sơ đính kèm" (Attached documents) section that renders conditionally when the application status is `PENDING`.
     - Display the customer's uploaded images (from `appData.customer.zairyuFrontUrl`, `appData.customer.passportUrl`, etc.) using standard `<img>` tags (avoid `<Image>` unless domains are configured in `next.config.js`). Add click-to-preview functionality (e.g., opening in a new tab).
     - Show extracted OCR data (`cardNumber`, `zairyuAddress` from the customer record) alongside the images for easy verification.
     - Add action buttons: "Duyệt" (Approve) and "Yêu cầu chụp lại ảnh" (Request Retake).

3. **Review API Endpoint**
   - Create `src/app/api/applications/[id]/review/route.ts` exporting a POST method.
   - Accepts payload: `{ action: "APPROVE" | "REJECT" }` (or similar).
   - `APPROVE` action: Updates `NenkinApplication` status to `DRAFT` and `Customer` status to `VERIFIED`.
   - `REJECT` action: Updates `NenkinApplication` status to `CANCELLED` (since the schema lacks a specific 'NEEDS_REVISION' state).

## Resolved Conflicts / Scope Clarifications
- **Rejection Flow**: The DB does not currently have a rejection reason column or an email system to notify the user. All explorers agreed that for `REJECT`, updating the status to `CANCELLED` (or similar fallback) is sufficient for this milestone.
- **Routing**: The user prompt mentioned `/staff/applications`, but all explorers verified that the staff portal is actually located at `/applications`. The strategy correctly targets the existing `/applications` routes.
- **Next.js 15 Async Params**: Explorer 1 highlighted that in Next.js 15, route `params` must be awaited (`const { id } = await params;`).

## Task for Worker
Implement the above consensus strategy. Ensure that build and tests pass before handoff.
Integrity constraints: development mode (no cheating, must be authentic implementation).
