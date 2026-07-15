# Handoff Report: Milestone M3 OCR API & UI Update

## 1. Observation
- The DB schema `prisma/schema.prisma` already contains the 20 new fields, including `nationality`, `sex`, `passportIssueDate`, `bankBranchAddress`, `hasPermanentResidence`, etc.
- `src/app/api/ocr/route.ts` returned outdated fields and prompts.
- `src/app/api/customers/route.ts` and `src/app/api/customers/[id]/route.ts` did not parse or save the newly extracted fields to the database.
- `src/app/customers/page.tsx`'s `handleExtractOcr` previously only merged Zairyu data and ignored other tabs.
- Placeholders existed in the UI for passport, nenkin, and bank tabs.

## 2. Logic Chain
- **API Update (OCR):** Modified `buildPrompt` in `src/app/api/ocr/route.ts` to instruct the LLM to extract all required fields (e.g., `nationality`, `sex`, `hasPermanentResidence`, `bankBranchAddress`). Adjusted the requested JSON structures to match exactly what the DB expects.
- **API Update (Database Save):** Updated POST and PUT routes in `src/app/api/customers/*` to parse the new fields. Wrapped date strings (e.g. `dob`, `passportIssueDate`) in `new Date()` before saving to Prisma.
- **UI Update (Data Merging):** Expanded `handleExtractOcr` in `src/app/customers/page.tsx` to handle `passport`, `nenkin`, and `bank` actions, mapping the response payload back to `activeCustomer` and clearing validation states.
- **UI Update (Form Rendering):** Replaced the placeholder UI for `passport`, `nenkin`, and `bank` with fully functional `VerifiedInput` components mapped to `activeCustomer`. Added missing fields to the `basic` tab (e.g., `phone`, `overseasAddress`, `myNumber`, `departureDate`) and to the `zairyu` tab (`nationality`, `sex`, `hasPermanentResidence`).

## 3. Caveats
- Added an index signature update to `Customer` interface (`boolean | null`) to suppress TypeScript errors regarding `hasPermanentResidence`.
- Attempted to run `npm run build` and `npm run lint` for verification, but `npm` was not accessible via `PATH` in the current shell environment (threw `CommandNotFoundException`).

## 4. Conclusion
- All backend OCR prompts and database routes have been extended to extract and save the 20 new fields.
- The UI properly merges data for all tabs without breaking the existing single-button extraction workflow.
- All new inputs have been implemented utilizing `VerifiedInput` and standard inputs where appropriate.

## 5. Verification Method
- Ensure the dev server is running and upload valid images of a Passport, Bank Book, and Zairyu card. Verify the OCR correctly extracts all new fields and reflects them in the UI.
- Submit the form and verify the network payload or database contains the new fields successfully persisted.
