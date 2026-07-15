# Handoff Report: M4 Form Generator

## 1. Observation
- **Templates Directory**: Verified that `public/templates` exists. It currently contains important DOCX templates such as `脱退一時金請求書.docx` and `委 任 状.docx` among other files.
- **Customer Data Query**: The Prisma schema (`prisma/schema.prisma`) defines a `Customer` model that includes fields like `fullName`, `dob`, `zairyuAddress`, `postalCode`, `nenkinNumber`, and a relation to `TaxOffice`. Data can be fetched via `prisma.customer.findUnique({ where: { id: customerId }, include: { taxOffice: true } })`.
- **Generation Mechanism**: The codebase already includes `docxtemplater` and `pizzip` in `package.json`. There is an existing prototype endpoint at `src/app/api/generate-doc/route.ts` that relies on `applicationId`. However, the M4 interface contract requires a new endpoint `POST /api/generate-form` that accepts a `customerId`.
- **UI File to Update**: The customer list view is implemented in `src/app/customers/page.tsx`. The table rows (around line 818) currently only have "Xử lý & Cập nhật" and "Xóa" buttons in the `TableCell`.

## 2. Logic Chain
1. To meet the M4 requirements, we need a dedicated API route for generating forms by `customerId` instead of `applicationId`. We should create a new file `src/app/api/generate-form/route.ts`.
2. The logic within `/api/generate-form/route.ts` will mirror the approach in the existing `generate-doc` prototype: it will receive `customerId` and `templateName` from the request body, fetch the `Customer` and related `TaxOffice` via Prisma, read the template from `public/templates`, populate `docxtemplater` fields, and return a DOCX blob.
3. In `src/app/customers/page.tsx`, we need to implement a client-side function (e.g., `handleGenerateForm`) to make the POST request to `/api/generate-form`, handle the returned blob, and trigger a file download.
4. Finally, we should add UI buttons for generating the two primary forms (`脱退一時金請求書.docx` and `委 任 状.docx`) to the action `TableCell` for each customer row in `src/app/customers/page.tsx`.

## 3. Caveats
- I did not verify if the physical DOCX files (`脱退一時金請求書.docx`, `委 任 状.docx`) currently contain the exact `{keys}` (e.g., `{customerName}`, `{customerAddress}`) needed by `docxtemplater`. The implementer must ensure the DOCX templates contain the correct mapping tags before testing the generation.
- The `generate-doc` endpoint maps `zairyuAddress` for the address field; the implementer should verify which address (e.g. `zairyuAddress` vs `overseasAddress`) should be mapped for the specific Nenkin templates.

## 4. Conclusion
The architecture is fully supported by existing dependencies.
Proposed action plan for the implementer:
1. **Create** `src/app/api/generate-form/route.ts` that handles `POST` requests with `{ customerId, templateName }`, queries the DB, uses `docxtemplater` to process the file in `public/templates/`, and returns the blob.
2. **Update** `src/app/customers/page.tsx` to add a `handleGenerateForm` function.
3. **Update** `src/app/customers/page.tsx` (around line 818) to add two generation buttons: one for Nenkin (`脱退一時金請求書.docx`) and one for Proxy (`委 任 状.docx`), next to the existing action buttons.

## 5. Verification Method
- **Static Analysis**: Verify `src/app/api/generate-form/route.ts` exists and compiles without type errors.
- **UI Check**: Run the app (`npm run dev`) and visit `/customers`. Verify the new generation buttons appear in each row.
- **Functional Test**: Click the generate buttons. Verify that a file named `Generated_<templateName>.docx` is downloaded and contains the customer data.
