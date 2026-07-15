# M4 Form Generator - Handoff Report

## 1. Observation
- The templates directory exists at `E:\AntiGravity\apps\nenkin\public\templates` and contains templates such as `脱退一時金請求書.docx` and `委 任 状.docx`.
- The `prisma/schema.prisma` file defines the `Customer` model with relation to `TaxOffice`. A similar document generation API already exists at `src/app/api/generate-doc/route.ts` but it queries by `applicationId`.
- The frontend UI file for customers is located at `src/app/customers/page.tsx`. This file displays a list of customers and has a workspace panel for updates.
- Dependencies for DOCX generation (`docxtemplater` and `pizzip`) are already listed in `package.json`.

## 2. Logic Chain
- **Templates**: Since `public/templates` is already present with the target DOCX files, no new directory needs to be created.
- **Data Query**: The required API endpoint `POST /api/generate-form` should take a `customerId` and query the database using Prisma:
  ```typescript
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { taxOffice: true }
  });
  ```
- **Generation Mechanism**: We can replicate the approach used in `api/generate-doc/route.ts`. The new route `src/app/api/generate-form/route.ts` will load the template using `pizzip`, map the customer data (e.g., `fullName`, `dob`, `address`, `taxOffice.name`) into the template using `docxtemplater`, and return the generated `.docx` file as a binary response (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- **UI Updates**: The generation action should be added to `src/app/customers/page.tsx`. 
  - A client-side function (e.g., `handleGenerateForm`) should be added to make a `POST` request to `/api/generate-form`, parse the response as a Blob, and trigger a file download via an `<a>` tag.
  - Buttons for generation (e.g., "Tạo Đơn Xin", "Tạo Uỷ Quyền") should be added to the customer list row actions (around line 818 in the `TableCell`), and optionally to the Workspace header.

## 3. Caveats
- The template fields (e.g., `{{customerName}}`, `{{customerAddress}}`) inside the existing `.docx` templates need to match the keys provided in the `doc.render(data)` method of the API route. I have not inspected the exact variable names used inside the `.docx` files.
- The `generate-form` route will need proper error handling if a requested `templateName` does not exist in `public/templates`.

## 4. Conclusion
To implement the M4 Form Generator:
1. **Create** `src/app/api/generate-form/route.ts`: Implement `POST` handling `customerId` and `templateName`, fetch data via Prisma (`customer`), use `pizzip` and `docxtemplater`, and return the DOCX Blob.
2. **Modify** `src/app/customers/page.tsx`:
   - Add a `handleGenerateForm` function to call the API and download the Blob.
   - Add generation buttons passing the specific `templateName` (like `'脱退一時金請求書.docx'` and `'委 任 状.docx'`) in the list view (and/or workspace header) for each customer.

## 5. Verification Method
- **Check Backend**: Create `src/app/api/generate-form/route.ts`, send a test POST request with a valid `customerId` and `templateName: "脱退一時金請求書.docx"` to ensure it returns a valid DOCX blob.
- **Check Frontend**: Open the Customers page (`/customers`), click the new "Tạo Form" button, and verify that the browser downloads a valid `.docx` file with populated customer data.
