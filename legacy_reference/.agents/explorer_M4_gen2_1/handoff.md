# Handoff Report: M4 Form Generator Vulnerability Fixes

## 1. Observation
- **Broken Access Control (`src/app/api/generate-form/route.ts`)**: 
  - Lines 8-14 show that the `POST` handler does not check for authentication before generating a form or querying the database.
  - In `src/app/api/customers/route.ts`, authentication is correctly verified via `const cookieStore = await cookies(); const userId = cookieStore.get('employee_auth')?.value;`.
- **Path Traversal (`src/app/api/generate-form/route.ts`)**: 
  - Line 25: `const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);` directly concatenates `templateName` from the request JSON, allowing attackers to access arbitrary files by supplying paths like `../../etc/passwd`.
- **HTTP Header Encoding Crash (`src/app/api/generate-form/route.ts`)**:
  - Line 59: `'Content-Disposition': \`attachment; filename="Generated_${templateName}"\`,` will crash Node's HTTP layer with `TypeError: Cannot convert argument to a ByteString` if `templateName` contains Japanese or non-ASCII characters.
- **DOM Cleanup (`src/app/customers/page.tsx`)**:
  - Lines 148-153:
    ```typescript
    const a = document.createElement('a');
    a.href = url;
    a.download = `Generated_${templateName}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    ```
    The anchor element is appended to `document.body` but `document.body.removeChild(a)` is never called, causing DOM pollution.

## 2. Logic Chain
1. **Broken Access Control**: Adding the same cookie-based authentication check (`employee_auth`) used in other API routes will ensure only authenticated employees can generate forms. This requires importing `cookies` from `next/headers` and returning a `401 Unauthorized` if the cookie is missing.
2. **Path Traversal**: To prevent directory traversal, `templateName` should be sanitized using `path.basename(templateName)`. This strips any directory paths (like `../`) and ensures only the base file name is used.
3. **HTTP Header Encoding Crash**: Using the `filename*` parameter with `UTF-8` encoding avoids the ByteString conversion issue for non-ASCII characters in headers. The proposed header format is `filename*=UTF-8''${encodeURIComponent(safeTemplateName)}`.
4. **DOM Cleanup**: Adding `document.body.removeChild(a);` immediately after `a.click();` safely removes the temporary anchor element from the DOM without affecting the file download.

## 3. Caveats
- It is assumed that the `employee_auth` cookie stores the user ID as a string, matching behavior in other API routes.
- Using `path.basename` means any subdirectories inside `/public/templates/` will no longer be accessible via this API. This is assumed to be intentional.

## 4. Conclusion
Both files require precise modifications to address the four vulnerabilities:

**Proposed changes for `src/app/api/generate-form/route.ts`:**
```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers'; // [NEW] Added import

export async function POST(req: Request) {
  try {
    // [NEW] Added Authentication Check
    const cookieStore = await cookies();
    const userId = cookieStore.get('employee_auth')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // [NEW] Path traversal fix
    const safeTemplateName = path.basename(templateName);
    const templatePath = path.join(process.cwd(), 'public', 'templates', safeTemplateName);
    
    // ... (unchanged template logic) ...

    // [NEW] HTTP Header Encoding fix
    const encodedFilename = encodeURIComponent(`Generated_${safeTemplateName}`);
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
```

**Proposed changes for `src/app/customers/page.tsx` (Lines 148-153):**
```typescript
      const a = document.createElement('a');
      a.href = url;
      a.download = `Generated_${templateName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a); // [NEW] DOM Cleanup fix added here
      window.URL.revokeObjectURL(url);
```

## 5. Verification Method
- **Path Traversal & Auth:** Run the API server and attempt to send a POST request to `/api/generate-form` without a cookie, or with `templateName = "../../../etc/passwd"`. Expect `401 Unauthorized` initially, then a `404 Template not found`.
- **HTTP Header Encoding Crash:** Trigger a form generation using a Japanese template name. No 500 server crash should be returned.
- **DOM Cleanup:** Open Chrome DevTools Elements panel. Download a generated file. Ensure no orphan `<a>` tags remain appended to the `<body>` element.
- **Build/Test:** Run `npm run build` or the project's test suite to ensure type checking passes without errors.
