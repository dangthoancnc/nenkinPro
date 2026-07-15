# Observation
- Checked `public/templates` and found existing DOCX templates (`脱退一時金請求書.docx` and `委 任 状.docx`).
- Analyzed `package.json` and verified that `docxtemplater` and `pizzip` are installed and ready to use.
- Located Prisma schema (`prisma/schema.prisma`) which clearly defines `Customer` model and `TaxOffice` relationships containing all fields needed for form generation (e.g., `fullName`, `zairyuAddress`, `nenkinNumber`, `bankName`, etc).
- Examined `src/app/api/generate-doc/route.ts` which already exists and performs template mapping based on `NenkinApplication` model.
- Inspected the frontend Customer List at `src/app/customers/page.tsx` to identify the appropriate location for form generation triggers (the `<TableCell className="text-right flex gap-2 justify-end">` rendering the list items).

# Logic Chain
1. **Templates Location**: The templates are available in `public/templates/` folder and do not need to be relocated or created. The system can read them using Node `fs` module and `process.cwd()`.
2. **Data Querying**: The new route needs to be bound strictly to the `Customer` scope, matching the `customerId` from the request body. Prisma client (`prisma.customer.findUnique`) is perfectly suited to retrieve customer data and its nested `TaxOffice` relation.
3. **Generation Implementation**: `docxtemplater` with `pizzip` works by loading a DOCX template buffer and mapping an object dictionary to `{variable}` placeholders. We will create a `POST /api/generate-form` route that loads the template, constructs a comprehensive data object using Prisma results, and returns the constructed `nodebuffer` as an `application/vnd.openxmlformats-officedocument.wordprocessingml.document` response.
4. **UI Updates**: To allow users to generate these forms, we need to inject a fetch handler and a simple dropdown/button interface on the Customer List view (`src/app/customers/page.tsx`). When the user selects a template, it will send the `POST` request with the `customerId` and trigger a blob download.

# Caveats
- The template mapping object in `/api/generate-form` might need tweaking based on the exact placeholder tags (`{customerName}`, `{customerAddress}`, etc.) present within the Japanese `.docx` templates. The implementer should verify placeholder strings.
- We are retaining `/api/generate-doc` intact, as it may be tied to the `NenkinApplication` workflow, and creating a new independent `/api/generate-form` solely for the `Customer` scope to satisfy the M4 milestone requirements without breaking existing dependencies.

# Conclusion
The Form Generator can be built cleanly using existing packages. The implementation will require:
1. **Creating a new route**: `src/app/api/generate-form/route.ts`.
2. **Modifying the UI**: `src/app/customers/page.tsx` to add a `handleGenerateForm` function and UI buttons in the list view.

# Proposed Design & Exact File Paths

## 1. Create `src/app/api/generate-form/route.ts`
Implement a new Next.js Route handler that takes `customerId` and `templateName`.

**Proposed Code snippet:**
```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { customerId, templateName } = await req.json();

    if (!customerId || !templateName) {
      return NextResponse.json({ error: 'Missing customerId or templateName' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { taxOffice: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: `Template not found` }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    const data = {
      customerName: customer.fullName || '',
      customerFurigana: customer.fullNameFurigana || '',
      customerDob: customer.dob ? customer.dob.toISOString().split('T')[0] : '',
      customerAddress: customer.zairyuAddress || '',
      customerRomajiAddress: customer.zairyuRomajiAddress || '',
      customerPostalCode: customer.postalCode || '',
      customerNenkin: customer.nenkinNumber || '',
      taxOfficeName: customer.taxOffice?.name || '',
      taxOfficeAddress: customer.taxOffice?.address || '',
      bankName: customer.bankName || '',
      branchName: customer.branchName || '',
      accountNumber: customer.accountNumber || '',
      accountName: customer.accountName || '',
    };

    doc.render(data);
    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': \`attachment; filename="Generated_\${templateName}"\`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
```

## 2. Update `src/app/customers/page.tsx`
Add logic to download the Blob from the API and update the Table UI.

**Changes required:**
1. **Add the handler inside the `CustomersPage` component (around line ~110-140):**
```tsx
  const handleGenerateForm = async (customerId: string, templateName: string) => {
    try {
      const res = await fetch('/api/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, templateName }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Generated_\${templateName}\`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo đơn.');
    }
  };
```

2. **Modify the list view `TableCell` (around line 818-821):**
```tsx
// Before:
<TableCell className="text-right flex gap-2 justify-end">
  <Button variant="outline" size="sm" className="h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleOpenWorkspace(customer)}>Xử lý & Cập nhật</Button>
  <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-red-600">Xóa</Button>
</TableCell>

// After:
<TableCell className="text-right flex gap-2 justify-end">
  <select 
    className="h-8 text-sm border border-indigo-200 rounded px-2 bg-white text-indigo-700 outline-none hover:bg-indigo-50"
    onChange={(e) => {
      if (e.target.value && customer.id) {
        handleGenerateForm(customer.id, e.target.value);
        e.target.value = "";
      }
    }}
  >
    <option value="">Tạo đơn...</option>
    <option value="脱退一時金請求書.docx">Rút Nenkin</option>
    <option value="委 任 状.docx">Ủy quyền</option>
  </select>
  <Button variant="outline" size="sm" className="h-8 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleOpenWorkspace(customer)}>Xử lý & Cập nhật</Button>
  <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-red-600">Xóa</Button>
</TableCell>
```

# Verification Method
- **Code implementation:** Apply the changes proposed.
- **Frontend test:** Open the Customer Management view `/customers`, find the "Tạo đơn..." dropdown in a list row. Select an option.
- **Backend check:** Verify that the browser downloads a valid `.docx` file mapping the customer data.
