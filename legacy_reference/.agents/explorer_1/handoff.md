# Milestone 2: Onboarding Wizard - Implementation Plan

## 1. Observation
- **Codebase requirements**: `PROJECT.md` specifies a 4-step wizard at `/onboarding` for new customers. The wizard extracts staff assignment via `?ref=STAFF_CODE`, uploads documents (Zairyu, Passport, Nenkin book, Bank card), performs OCR on the Zairyu card, and creates a `Customer` and `NenkinApplication` in `PENDING` status.
- **OCR Constraints**: The prompt asks how OCR should be authentically implemented and specifically references checking `package.json` vs using `tesseract.js`.
- **Existing OCR Implementation**: `package.json` already includes `@google/generative-ai`. Furthermore, `src/app/api/ocr/route.ts` is fully implemented using `gemini-2.5-flash`. It accepts `file`, `documentType`, and `action` (e.g., `uploadAndExtract`), handles Supabase storage uploads, and returns structured JSON (e.g., Name, Address, Card Number).
- **OCR Authentication Blocker**: `src/app/api/ocr/route.ts` (lines 7-10) currently enforces `await validateEmployee()`. Since the onboarding wizard is for public customers, this will block them with a 401 Unauthorized error.
- **Database Schema**: `prisma/schema.prisma` defines a `CustomerStatus` enum that includes `PENDING`. However, the `ApplicationStatus` enum only includes `DRAFT`, `SENT_1ST`, etc., and is missing `PENDING`.

## 2. Logic Chain
1. **OCR Implementation Strategy**: Because `src/app/api/ocr/route.ts` already leverages Gemini for high-quality, structured OCR data extraction (which is vastly superior to `tesseract.js` for unstructured document reading), the **authentic** implementation for this environment is to use the existing Gemini setup. The Worker MUST NOT install `tesseract.js` or any other library.
2. **OCR Route Modification**: To allow new customers to use `/api/ocr` during the public onboarding flow, the Worker must bypass the `validateEmployee()` check. A recommended approach is to accept a `source=onboarding` field in the FormData, and conditionally skip the auth check if it's present.
3. **Document Uploads**: The existing `/api/ocr` route also handles pure uploads via Supabase (if `action='upload'`). The Worker can reuse this endpoint for Step 3 (Passport, Nenkin book, Bank card) to obtain `publicUrl`s.
4. **Schema Update**: To satisfy the requirement of creating a `NenkinApplication` with status `PENDING`, the Worker must add `PENDING` to the `ApplicationStatus` enum in `prisma/schema.prisma` and sync the database (e.g., `npx prisma db push` or `npx prisma generate`).
5. **Customer & Application Creation**: The Worker needs to build a new `POST /api/onboarding` endpoint that accepts the final payload, looks up the staff by `STAFF_CODE`, generates a unique Customer `code` (e.g., `CUST-YYYYMMDD-XXXX`), and uses Prisma transactions to create both the `Customer` and `NenkinApplication` in `PENDING` status.

## 3. Caveats
- Bypassing `validateEmployee()` in `/api/ocr` introduces a risk of unauthorized use of the Gemini API. For this milestone, a simple `source=onboarding` parameter bypass is acceptable, but in a real production environment, rate limiting or Captcha should be added.
- `ApplicationStatus.PENDING` is newly introduced. The Worker must ensure they run the database schema generation tools to apply it.
- The wizard UI is responsive (desktop vs mobile). The Worker should use Tailwind classes (e.g., `hidden md:block`) to handle responsive layouts if necessary, though most form elements will just stack natively.

## 4. Conclusion & Step-by-Step Guide
The Worker should execute the following steps to implement Milestone 2:

**Step 1: Update Prisma Schema**
- In `prisma/schema.prisma`, add `PENDING` to the `ApplicationStatus` enum (before `DRAFT`).
- Run `npx prisma generate` and `npx prisma db push` (or create a migration) to update the local database.

**Step 2: Update OCR API for Public Access**
- Edit `src/app/api/ocr/route.ts`.
- Add `const source = formData.get('source') as string;`
- Modify the auth check to allow access if `source === 'onboarding'`, e.g.:
  ```typescript
  if (source !== 'onboarding') {
    const employee = await validateEmployee();
    if (!employee) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```

**Step 3: Create the Onboarding API**
- Create `src/app/api/onboarding/route.ts`.
- Parse the incoming JSON body containing customer details and document URLs.
- Look up the staff member using the provided `ref` code.
- Create the `Customer` (status `PENDING`) and `NenkinApplication` (status `PENDING`), linking the staff member as `createdById`.

**Step 4: Build the Multi-Step Wizard UI**
- Create `src/app/onboarding/page.tsx` as a client component (`"use client"`).
- Use `useSearchParams` to capture the `ref` parameter.
- Implement a state machine (Step 1 to 4).
- **Step 1**: Basic info inputs (Name, Phone, DOB, PIN).
- **Step 2**: Zairyu upload. Send FormData to `/api/ocr` with `action=uploadAndExtract`, `documentType=zairyuFront`, and `source=onboarding`. Pre-fill state with the extracted OCR data.
- **Step 3**: Upload other documents. Send FormData to `/api/ocr` with `action=upload` (and `source=onboarding`) to get the `publicUrl` for Passport, Nenkin book, and Bank card.
- **Step 4**: Submit all collected data to `/api/onboarding`. Show a success message.

## 5. Verification Method
1. Verify `package.json` contains no new/unnecessary OCR libraries.
2. Verify `prisma/schema.prisma` has `PENDING` in `ApplicationStatus` and `npx prisma db push` succeeds.
3. Start the dev server (`npm run dev`) and navigate to `/onboarding?ref=STAFF123`.
4. Progress through the steps, upload test images, and verify OCR extraction succeeds (no 401 error).
5. Submit the final form and check the database (via Prisma Studio or SQL) to ensure `Customer` and `NenkinApplication` are created with `status = 'PENDING'`.
