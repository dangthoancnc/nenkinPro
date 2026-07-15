# Handoff Report: Milestone M3 OCR API & UI Update

## Observation
1. **Database Schema (`prisma/schema.prisma`)**: The `Customer` model has new optional fields: `lastName`, `firstName`, `fullNameFurigana`, `nationality`, `sex`, `placeOfBirth`, `passportIssueDate`, `passportExpiryDate`, `phone`, `overseasAddress`, `overseasCountry`, `hasPermanentResidence`, `permanentResidenceDate`, `myNumber`, `bankBranchAddress`, `bankCountry`, `occupation`, `departureDate`, `headOfHouseholdName`, `relationshipToHead`.
2. **API Routes (`src/app/api/customers/[id]/route.ts` & `src/app/api/customers/route.ts`)**: Currently do not map or save these new fields in the `prisma.customer.create()` and `prisma.customer.update()` queries.
3. **OCR Endpoint (`src/app/api/ocr/route.ts`)**: The `buildPrompt` function generates AI prompts, but:
   - `passport` prompt asks for `surname` and `dateOfIssue` instead of mapping directly to DB keys like `lastName` and `passportIssueDate`.
   - `zairyuFront` prompt lacks extraction instructions for `nationality` and `sex`.
   - `nenkin` prompt uses `fullNameKana` instead of `fullNameFurigana`.
   - `bank` prompt does not request `bankBranchAddress` or `bankCountry`.
   - There is no prompt for `departureStamp` to extract `departureDate` from `departureStampUrl`.
4. **Customer UI (`src/app/customers/page.tsx`)**:
   - The `Customer` interface lacks the new fields.
   - The `passport`, `nenkin`, and `bank` tabs in the left form panel are just placeholders ("Giao diện form cho tài liệu này sẽ tương tự tab Zairyu").
   - The extraction handler (`handleExtractOcr`) does not parse the new fields from the AI response.
   - The right panel image viewer for `passport` only allows 1 image upload, missing an upload zone for `departureStampUrl`.

## Logic Chain
1. **API Save Operations**: To persist the new inputs, the backend endpoints `route.ts` (POST) and `[id]/route.ts` (PUT) must explicitly include the new fields in their Prisma query payload. Date fields must be parsed securely using `new Date()`.
2. **OCR Extraction Map**: Updating the Gemini prompts in `src/app/api/ocr/route.ts` to output exact DB-matching keys (e.g., `lastName`, `fullNameFurigana`) removes the need for complex frontend mapping. Adding a `departureStamp` case ensures the AI handles the exit stamp image correctly.
3. **Frontend UI Rendering**: The UI must be updated to fully utilize the new schema:
   - The **Basic tab** gets manual inputs (Phone, Occupation, Overseas Address, Head of Household, etc.).
   - The **Zairyu tab** gets extracted inputs (Nationality, Sex) and manual inputs (MyNumber, PR status).
   - The **Passport tab** needs its placeholder removed and replaced with a form for `lastName`, `firstName`, `passportIssueDate`, etc. The right panel must show two upload blocks: one for Passport, one for Departure Stamp.
   - The **Nenkin and Bank tabs** need their placeholders removed and forms added for their respective fields.
   - The `handleExtractAll` logic must extract both the passport and departure stamp when the `passport` tab is active.

## Caveats
- All new DB fields are optional (e.g., `String?`, `DateTime?`), so they do not strictly need to be added to the `requiredFields` array in `page.tsx`.
- The OCR UI uses a single "Trích xuất dữ liệu" button at the top right of the workspace. This button calls `handleExtractAll`, so adding `departureStampUrl` to the `passport` tab logic in `handleExtractAll` satisfies the requirement to keep the UI clean with a single button.

## Conclusion (Step-by-step instructions for the Worker)
**1. Update Customer Endpoints:**
- In `src/app/api/customers/route.ts` and `src/app/api/customers/[id]/route.ts`:
  - Add all new schema fields to the `data` object of `prisma.customer.create` and `prisma.customer.update`.
  - For date fields (`passportIssueDate`, `passportExpiryDate`, `permanentResidenceDate`, `departureDate`), wrap them in `new Date(body.fieldname) ? ...` conditionally if they are present.

**2. Update OCR API (`src/app/api/ocr/route.ts`):**
- **zairyuFront**: Add instructions to extract `Nationality` as `nationality` and `Sex` as `sex`. Update JSON structure.
- **passport**: Change requested keys to match DB (`surname` -> `lastName`, `givenNames` -> `firstName`, `dateOfIssue` -> `passportIssueDate`, `dateOfExpiry` -> `passportExpiryDate`).
- **nenkin**: Change `fullNameKana` to `fullNameFurigana`.
- **bank**: Add instructions to extract `bankBranchAddress` and `bankCountry`.
- Add a new `case 'departureStamp':` returning JSON `{ "departureDate": "" }`.

**3. Update Customer UI (`src/app/customers/page.tsx`):**
- **Interface**: Add all new optional fields to the `Customer` interface.
- **`handleExtractOcr`**: Add state update cases for `passport`, `departureStamp`, `nenkin`, and `bank` to parse the new variables into `activeCustomer`.
- **`handleExtractAll`**: Update the `activeTab === 'passport'` branch to extract both `passportUrl` (using `documentType: 'passport'`) and `departureStampUrl` (using `documentType: 'departureStamp'`).
- **Right Panel (Image Viewer)**: Split the `passport` tab logic so it renders two image upload blocks: one for `passportUrl` and one for `departureStampUrl`. Leave `nenkin` and `bank` as single blocks.
- **Left Panel (Forms)**:
  - **Basic Tab**: Add standard `<Input>` fields for `phone`, `occupation`, `overseasAddress`, `overseasCountry`, `headOfHouseholdName`, `relationshipToHead`.
  - **Zairyu Tab**: Add `VerifiedInput` fields for `nationality` and `sex`. Add manual inputs for `myNumber`, `hasPermanentResidence` (can use HTML checkbox), and `permanentResidenceDate`.
  - **Passport Tab**: Replace the placeholder with a form using `VerifiedInput` for `lastName`, `firstName`, `nationality`, `sex`, `dob`, `placeOfBirth`, `passportIssueDate`, `passportExpiryDate`, `departureDate`.
  - **Nenkin Tab**: Replace placeholder with a form using `VerifiedInput` for `nenkinNumber`, `fullNameFurigana`.
  - **Bank Tab**: Replace placeholder with a form using `VerifiedInput` for `bankName`, `branchName`, `accountNumber`, `accountName`, `swiftCode`, `bankBranchAddress`, `bankCountry`.

## Verification Method
1. Ensure the app builds (`npm run build`).
2. Start the dev server (`npm run dev`).
3. Open the "Hồ sơ mới" workspace.
4. Upload images for Passport, Departure Stamp, Nenkin, and Bank.
5. Click "Trích xuất dữ liệu" in each tab; verify the new form inputs populate correctly.
6. Check the Checkbox and manually fill `overseasAddress` and `myNumber`.
7. Save the customer, then verify via the UI or by querying PostgreSQL that the new fields were saved successfully.
