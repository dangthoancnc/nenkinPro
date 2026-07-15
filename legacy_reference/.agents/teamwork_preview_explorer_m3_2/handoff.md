# Observation
1. **Database Schema (`prisma/schema.prisma`)**:
   - The `Customer` model has 20 new fields added: `lastName`, `firstName`, `fullNameFurigana`, `nationality`, `sex`, `placeOfBirth`, `passportIssueDate`, `passportExpiryDate`, `phone`, `overseasAddress`, `overseasCountry`, `hasPermanentResidence`, `permanentResidenceDate`, `myNumber`, `bankBranchAddress`, `bankCountry`, `occupation`, `departureDate`, `headOfHouseholdName`, `relationshipToHead`.
2. **OCR API (`src/app/api/ocr/route.ts`)**:
   - The `buildPrompt` function returns prompts for `zairyuFront`, `zairyuBack`, `passport`, `nenkin`, `bank`.
   - The `passport` prompt extracts `surname`, `givenNames`, `dateOfIssue`, `dateOfExpiry`, etc., but does not match the exact new DB schema naming (`lastName`, `firstName`, `passportIssueDate`, `passportExpiryDate`).
   - The `bank` prompt extracts basic info but misses `bankBranchAddress` and `bankCountry`.
   - `zairyuFront` does not extract `hasPermanentResidence`, `permanentResidenceDate`, `nationality`, `sex` which can be determined from the card.
3. **Customer Save API (`src/app/api/customers/[id]/route.ts` & `src/app/api/customers/route.ts`)**:
   - Both API routes only handle the old fields (e.g., `fullName`, `cardNumber`, `dob`, `address`, `taxOfficeId`, etc.) in the `prisma.customer.update` and `prisma.customer.create` calls.
   - The 20 new fields (and even some older bank fields) are ignored in the data payload.
4. **Customer UI (`src/app/customers/page.tsx`)**:
   - In `handleExtractOcr`, only `zairyuFront` and `zairyuBack` are handled to map extracted data to `activeCustomer` state. The data from `passport`, `nenkin`, and `bank` is currently ignored by the state updater!
   - The UI for `passport`, `nenkin`, and `bank` tabs are just placeholders: `{(activeTab === 'passport' || activeTab === 'nenkin' || activeTab === 'bank') && ( ... placeholder ... )}`.
   - The `basic` tab only has `phone` and `addressVN`.

# Logic Chain
To fulfill Milestone M3:
1. **Update OCR Prompts**:
   - Modify `src/app/api/ocr/route.ts` -> `buildPrompt`.
   - For `passport`: Change the JSON output keys to match the DB fields exactly: `lastName`, `firstName`, `nationality`, `sex`, `placeOfBirth`, `passportNumber`, `passportIssueDate`, `passportExpiryDate`.
   - For `zairyuFront`: Add extraction for `nationality`, `sex`, `hasPermanentResidence` (boolean: true if status is Permanent Resident / 永住者), and `permanentResidenceDate` (Date).
   - For `bank`: Add extraction for `bankBranchAddress` and `bankCountry` (default to Japan if unknown).
2. **Update API Routes**:
   - In `src/app/api/customers/route.ts` (POST) and `src/app/api/customers/[id]/route.ts` (PUT), include all new fields in the Prisma data payload.
   - Parse Date strings properly using `body.fieldName ? new Date(body.fieldName) : undefined/null`.
   - Make sure to also map `bankName`, `branchName`, `accountNumber`, `accountName`, `swiftCode`, `nenkinNumber` as they were missing in the POST handler or partially missing.
3. **Update UI (`src/app/customers/page.tsx`)**:
   - **State Update in `handleExtractOcr`**: Expand the `setActiveCustomer` call to properly spread extracted data for `passport`, `nenkin`, and `bank`. e.g., `...(type === 'passport' && { ...data.extractedData })`.
   - **Render Tabs**: Replace the placeholder for `passport`, `nenkin`, and `bank` tabs with actual `VerifiedInput` fields mapping to `activeCustomer` state.
   - **New Fields UI**:
     - In the `basic` tab (or a new tab/section), add inputs for `myNumber`, `occupation`, `departureDate`, `overseasAddress`, `overseasCountry`, `headOfHouseholdName`, `relationshipToHead`.
     - In the `passport` tab, map `lastName`, `firstName`, `nationality`, `sex`, `placeOfBirth`, `passportNumber`, `passportIssueDate`, `passportExpiryDate`.
     - In the `bank` tab, map `bankName`, `branchName`, `accountNumber`, `accountName`, `swiftCode`, `bankBranchAddress`, `bankCountry`.
   - Ensure the new fields are tracked in `verifiedFields` if necessary, or simply as regular Inputs if verification isn't strictly required for every single new field (to avoid overwhelming the user).

# Caveats
- AI extraction can be unreliable with date formats. Ensure date parsing in the API handles `YYYY-MM-DD` gracefully or returns `null` if invalid.
- `hasPermanentResidence` is boolean, make sure the prompt explicitly instructs Gemini to return a JSON boolean `true` or `false`.
- The OCR UI must retain its current clean single-button extraction design. We just need to replace the placeholders with standard form inputs.
- Some fields might not be present on documents (like `myNumber` or `departureDate`). Users will manually input these, so standard `<Input>` or `<VerifiedInput>` components are fine.

# Conclusion (Worker Instructions)
1. **Modify `src/app/api/ocr/route.ts`**:
   - Update `buildPrompt` for `passport`, `zairyuFront`, and `bank` to extract the new DB fields with exact matching keys (e.g., `lastName`, `passportIssueDate`).
2. **Modify `src/app/api/customers/route.ts` and `src/app/api/customers/[id]/route.ts`**:
   - Add mapping for all 20 new fields (and any missing bank fields) from `body` to the Prisma `data` object. Handle Date conversions correctly.
3. **Modify `src/app/customers/page.tsx`**:
   - In `handleExtractOcr`, update the `setActiveCustomer` logic to merge data for `passport`, `nenkin`, and `bank`.
   - Replace the UI placeholders in the `passport`, `nenkin`, and `bank` tabs with real form fields (`VerifiedInput`).
   - Add the remaining fields (`myNumber`, `occupation`, etc.) to the `basic` tab.

# Verification Method
1. Run `npm run build` or `npm run type-check` to ensure no TypeScript errors from the `Customer` interface or API payloads.
2. Manually test the Customer UI (run `npm run dev`) by creating a new customer, uploading a mock passport/bank image, clicking "Trích xuất dữ liệu", and verifying that the fields populate correctly in the form.
3. Save the customer and check the database (via Prisma Studio `npx prisma studio`) to confirm the new fields are properly persisted.
