# Handoff Report: M3 OCR API & UI Update

## 1. Observation
- `prisma/schema.prisma`: The `Customer` model has been updated with new fields such as `lastName`, `firstName`, `fullNameFurigana`, `nationality`, `sex`, `placeOfBirth`, `passportIssueDate`, `passportExpiryDate`, `phone`, `overseasAddress`, `overseasCountry`, `hasPermanentResidence`, `permanentResidenceDate`, `myNumber`, `bankBranchAddress`, `bankCountry`, `occupation`, `departureDate`, `headOfHouseholdName`, `relationshipToHead`. There are also bank fields (`bankName`, `branchName`, `accountNumber`, `accountName`, `swiftCode`) that were present but not previously wired in API endpoints.
- `src/app/api/ocr/route.ts`: `buildPrompt` returns hardcoded JSON structures for `zairyuFront`, `zairyuBack`, `passport`, `nenkin`, `bank`. These do not request the newly added DB fields.
- `src/app/api/customers/route.ts` (POST) and `src/app/api/customers/[id]/route.ts` (PUT): The data payload mapping to Prisma ignores the new DB fields and bank fields entirely.
- `src/app/customers/page.tsx`: The UI uses tabs (`basic`, `zairyu`, `passport`, `nenkin`, `bank`) to display and edit form fields. Currently, only `zairyu` and `basic` are partially fleshed out. The other tabs show placeholder messages. The single extraction button logic works cleanly by delegating extraction to the currently `activeTab`.

## 2. Logic Chain
- To fulfill M3, the AI needs to extract the new data points from the appropriate documents. The API must ask the AI to output exactly the field names that match the DB schema.
  - Zairyu: Extract `nationality`, `sex`, `hasPermanentResidence` (Boolean based on status), `permanentResidenceDate`.
  - Passport: Extract `lastName`, `firstName`, `nationality`, `sex`, `passportIssueDate`, `passportExpiryDate`, `placeOfBirth`.
  - Nenkin: Extract `fullNameFurigana`.
  - Bank: Extract `bankBranchAddress`, `bankCountry`, along with `bankName`, `branchName`, etc.
  - Departure Stamp: We need to add a `departureStamp` case to OCR to extract `departureDate`.
- To save these fields, both the `POST` and `PUT` customer endpoints must map the respective keys from the request `body` to the Prisma `data` object. Date strings (e.g., `dob`, `passportIssueDate`, `passportExpiryDate`, `departureDate`, `permanentResidenceDate`) need to be converted to `Date` objects before saving.
- For the user to view, edit, and confirm these extracted fields, the UI (`page.tsx`) must be updated:
  - The `Customer` state interface needs to include the new fields.
  - The `handleExtractOcr` switch blocks must map AI output to the correct state fields.
  - New tab inputs:
    - **Basic Tab**: `phone`, `overseasAddress`, `overseasCountry`, `myNumber`, `occupation`, `headOfHouseholdName`, `relationshipToHead`.
    - **Zairyu Tab**: `nationality`, `sex`, `hasPermanentResidence` (Checkbox/Select), `permanentResidenceDate`.
    - **Passport Tab**: Full form for passport details including `lastName`, `firstName`, `nationality`, `sex`, `passportIssueDate`, `passportExpiryDate`, `placeOfBirth`. Also add a Departure Stamp image viewer and input for `departureDate`.
    - **Nenkin Tab**: Full form for `nenkinNumber`, `fullNameKanji`, `fullNameFurigana`, `dob`.
    - **Bank Tab**: Full form for `bankName`, `branchName`, `accountNumber`, `accountName`, `swiftCode`, `bankBranchAddress`, `bankCountry`.
  - Ensure the "Single Extraction Button" pattern is preserved (already done by the tab-based extraction logic).

## 3. Caveats
- `hasPermanentResidence` is a boolean. The prompt must explicitly instruct the LLM to return `true` or `false` based on the status "Permanent Resident" on the Zairyu card.
- Dates from OCR might come back in various formats, so the AI prompt should explicitly request dates in `YYYY-MM-DD` format to ensure `new Date()` parses them correctly without errors in Next.js.
- `departureStamp` is currently just a string `departureStampUrl`. The implementation should add a file input for it, either inside the `passport` tab or a new tab, so it can be extracted for `departureDate`.

## 4. Conclusion (Implementation Strategy)
**Step 1: Update API Handlers (`src/app/api/customers/route.ts` & `src/app/api/customers/[id]/route.ts`)**
- In POST and PUT handlers, parse all the newly added schema fields from `req.json()` to Prisma query payload.
- Ensure date fields use `new Date(body.field)` conditionally.

**Step 2: Update OCR Prompts (`src/app/api/ocr/route.ts`)**
- Modify `buildPrompt`:
  - `zairyuFront`: Request `nationality`, `sex`, `hasPermanentResidence` (boolean), `permanentResidenceDate`.
  - `passport`: Use DB keys (`lastName`, `firstName`, `passportIssueDate`, `passportExpiryDate`, `placeOfBirth`, `nationality`, `sex`).
  - `nenkin`: Request `fullNameFurigana`.
  - `bank`: Request `bankBranchAddress`, `bankCountry`.
  - `departureStamp` (new case): Request `departureDate` (YYYY-MM-DD).

**Step 3: Build Out UI Form Tabs (`src/app/customers/page.tsx`)**
- Replace placeholders in Passport, Nenkin, and Bank tabs with `VerifiedInput` components.
- Add `departureStamp` file upload and `departureDate` input to the Passport tab.
- Update `handleExtractOcr` state mapping to merge newly extracted fields for every document type.
- Update the `Customer` interface in `page.tsx` with explicit optional fields to avoid TypeScript warnings.
- Expand `verifiedFields` logic if new fields are deemed mandatory.

## 5. Verification Method
- **Code:** Review the modifications in `src/app/api/customers/route.ts`, `src/app/api/customers/[id]/route.ts`, `src/app/api/ocr/route.ts`, and `src/app/customers/page.tsx`.
- **Build/Test:** Run `npm run build` and `npm run lint` (or project equivalent) to ensure no typing errors with Prisma schema mismatch.
- **Functional Check:** Open the frontend UI, upload a dummy image in the new tabs, and confirm the extracted values populate the inputs and successfully save to PostgreSQL without errors.
