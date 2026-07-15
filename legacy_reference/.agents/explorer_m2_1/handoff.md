# Handoff Report: Milestone 2 - Onboarding Wizard

## 1. Observation
- The project architecture is Next.js (App Router) using Prisma and PostgreSQL.
- **Dependencies (`package.json`)**: `@google/generative-ai` is installed. `tesseract.js` is **NOT** installed.
- **OCR API (`src/app/api/ocr/route.ts`)**: Is already fully implemented using Gemini API (`gemini-2.5-flash`). It handles both uploading images to Supabase and extracting data based on `documentType` (e.g., `zairyuFront`, `zairyuBack`, `passport`, etc.).
- Currently, `/api/ocr` contains `const employee = await validateEmployee(); if (!employee) return 401;` which prevents unauthenticated access.
- **Database Schema (`prisma/schema.prisma`)**:
  - `Customer` has fields like `phone`, `passwordPin`, `zairyuFrontUrl`, `zairyuBackUrl`, `status` (enum `CustomerStatus` includes `PENDING`).
  - `NenkinApplication` has a `status` field (enum `ApplicationStatus` defaults to `DRAFT`. **Note:** It does not have `PENDING`).
  - `User` has `staffCode` and `id` which can be mapped to `Customer.createdById`.
- `/onboarding` route and `/api/onboarding` do not exist yet.

## 2. Logic Chain
1. **OCR Implementation**: Since `@google/generative-ai` is already integrated and `/api/ocr` is written specifically to use it, the Worker **MUST NOT** use `tesseract.js`. The Gemini API is the authentic implementation for this environment.
2. **API Access**: The Onboarding Wizard is a public-facing flow. Since `/api/ocr` requires employee authentication, the Worker must update it to bypass `validateEmployee()` when called from the onboarding flow (e.g., by checking for an `isPublic` flag in the form data).
3. **Routing & Data Flow**: 
   - `src/app/onboarding/page.tsx` must be created as a multi-step form (client component) capturing text inputs and file uploads.
   - Files will be sent to `/api/ocr` with `action: 'uploadAndExtract'` (for Zairyu) or `action: 'upload'` (for other docs), returning a `publicUrl` and `extractedData`.
   - The final submission sends all data to a new endpoint `POST /api/onboarding`.
4. **Data Creation**: `/api/onboarding` must look up the staff by `ref` (staff code), generate a customer code (e.g., `KH001` like in `/api/customers`), and create both a `Customer` (status: `PENDING`) and `NenkinApplication` (status: `DRAFT`). 

## 3. Caveats
- The spec states to create the `NenkinApplication` in `PENDING` status. However, `ApplicationStatus` in `schema.prisma` does not have `PENDING` (it uses `DRAFT`). The Worker should use `DRAFT` for the application to avoid a schema migration, while using `PENDING` for the `CustomerStatus`.
- Uploading files to Supabase via `/api/ocr` requires valid environment variables (`GEMINI_API_KEY`, Supabase keys). Ensure development environment is set up.

## 4. Conclusion
The Worker needs to implement the `/onboarding` multi-step UI, adapt the existing `/api/ocr` for public access, and create the `/api/onboarding` submission endpoint.

### Actionable Steps for Worker:
1. **Update `src/app/api/ocr/route.ts`**:
   - Add a check for `isPublic`: `const isPublic = formData.get('isPublic') === 'true';`
   - Modify auth check: `if (!employee && !isPublic) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }`
2. **Create `src/app/onboarding/page.tsx`**:
   - Use `useSearchParams` to retrieve `ref`.
   - **Step 1**: Inputs for `fullName`, `phone`, `dob`, `passwordPin`.
   - **Step 2**: File inputs for Zairyu Card (Front/Back). Call `/api/ocr` (`isPublic: 'true'`, `documentType: 'zairyuFront'/'zairyuBack'`). Display extracted OCR data for user verification.
   - **Step 3**: File inputs for Passport, Nenkin book, Bank card. Upload via `/api/ocr` (`action: 'upload'`, `isPublic: 'true'`).
   - **Step 4**: Review and Submit to `/api/onboarding`.
3. **Create `src/app/api/onboarding/route.ts`**:
   - Receive JSON payload. Find user by `staffCode === ref` to set `createdById`.
   - Generate Customer `code` (`count + 1` padded).
   - Create `Customer` with `status: 'PENDING'`.
   - Create `NenkinApplication` with `status: 'DRAFT'` and `customerId`.

## 5. Verification Method
- **Static**: Check for TS errors by running `npm run build` or `npx tsc --noEmit`.
- **Manual Flow**: 
  1. Navigate to `/onboarding?ref=EMP-001` in the browser.
  2. Complete the wizard steps, uploading a sample image to verify OCR extraction succeeds without 401 Unauthorized.
  3. Submit the form and verify in the database (or via Prisma Studio) that `nenkin_customers` and `nenkin_applications` records were created correctly with the provided data and assigned staff ID.
