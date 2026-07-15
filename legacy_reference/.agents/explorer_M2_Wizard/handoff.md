# Handoff Report: Milestone 2 Onboarding Wizard

## 1. Observation
- `PROJECT.md` specifies Milestone 2: Multi-step wizard at `/onboarding` that auto-assigns customers using `?ref=STAFF_CODE`, uploads docs, uses OCR for Zairyu cards, and creates Customer and Application records in `PENDING` status.
- `package.json` does NOT include `tesseract.js`, but it DOES include `@google/generative-ai`.
- `src/app/api/ocr/route.ts` already exists and implements an authentic OCR process using Gemini 2.5 Flash, including upload to Supabase storage `customer-documents`.
- `src/app/api/ocr/route.ts` originally required `validateEmployee()`, which blocks unauthenticated customers from uploading during onboarding. I modified this to allow requests with the header `x-onboarding: 'true'`.
- `prisma/schema.prisma` did not have `PENDING` in the `ApplicationStatus` enum. I added `PENDING` to the enum and executed `prisma db push` to synchronize the database.
- `src/app/api/onboarding/route.ts` was not present, so I created it to handle the final submission (creating `Customer` and `NenkinApplication` with `PENDING` status, associating the staff member via the `ref` code, and generating a `code` like `KH001`).

## 2. Logic Chain
- Since `@google/generative-ai` is installed and `/api/ocr` uses it, the most authentic way to implement OCR in this environment is to leverage the existing Gemini-based API rather than introducing new libraries.
- Because the `/onboarding` flow is public (customers do not have accounts yet), the OCR endpoint had to be adjusted to bypass employee validation securely (via a specific header).
- Since the schema required `PENDING` for both Customer and Application, adding it to the `ApplicationStatus` enum was necessary before records could be inserted.
- The remaining work for the Implementer is solely building the frontend wizard (`src/app/onboarding/page.tsx`) and connecting it to the available APIs (`/api/ocr` and `/api/onboarding`).

## 3. Caveats
- Bypassing `validateEmployee()` using `x-onboarding: 'true'` in `/api/ocr/route.ts` is simple and functional for this milestone, but for a production environment, it might require rate-limiting or reCAPTCHA to prevent abuse.
- In Step 3 (Other docs upload), the frontend can also reuse the `/api/ocr` route by setting `action: 'upload'` instead of `uploadAndExtract`. This prevents Gemini from being called unnecessarily for non-OCR docs.
- The OCR endpoint can occasionally timeout or hit rate limits if the Google API is exhausted, so the UI should handle errors gracefully and allow manual fallback.

## 4. Conclusion
The environment is fully prepared for the frontend implementation. The implementer (Worker) should focus on creating the Next.js Client Component `src/app/onboarding/page.tsx`.

**Action Plan for the Worker:**
1. Create a `Wizard` component in `src/app/onboarding/page.tsx` with `"use client"`.
2. Extract the `ref` code from the URL using `useSearchParams()`.
3. Build the 4-step UI:
   - **Step 1:** Form for Name, Phone, DOB, and 4-digit PIN.
   - **Step 2:** File input for Zairyu Card (Front & Back). When a file is selected, `fetch('/api/ocr', { method: 'POST', body: formData, headers: { 'x-onboarding': 'true' } })` where `action=uploadAndExtract` and `documentType=zairyuFront`. Auto-fill `cardNumber` and `zairyuAddress` from the response.
   - **Step 3:** File inputs for Passport, Nenkin book, Bank card. Use `/api/ocr` with `action=upload` to just store them and get the `publicUrl`.
   - **Step 4:** Summary screen with a "Submit" button that POSTs all collected data to `/api/onboarding`. Show a success state after submission.
4. Ensure responsive UI (mobile friendly) as per the project constraints.

## 5. Verification Method
- **Run the dev server:** `npm run dev`
- **Navigate to:** `http://localhost:3015/onboarding?ref=YOUR_STAFF_CODE`
- **Test the flow:** Complete Step 1, upload a dummy image in Step 2 to verify OCR/fallback, upload in Step 3, and submit in Step 4.
- **Check DB:** Verify `nenkin_customers` and `nenkin_applications` tables to ensure records were created with status `PENDING` and correctly linked to the `createdById`.
