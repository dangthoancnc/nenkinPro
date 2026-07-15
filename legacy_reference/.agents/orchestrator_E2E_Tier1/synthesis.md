# Explorer Findings Synthesis

## Overview
Multiple issues were identified preventing the Tier 1 E2E tests and production build from passing. They fall into Data Mapping, API enhancements, UI types, Security, and E2E Test Teardowns.

## 1. Build and Type Errors
- **Dependencies**: Missing types causing build failures. Need to run `npm install -D @types/pizzip @prisma/config` (DO NOT install `@types/docxtemplater`).
- **prisma.config.ts**: Remove or comment out `earlyAccess: true` to fix TS2353.
- **src/app/applications/[id]/page.tsx**: Add `tax2ndJpy: ''` to `formData` state initialization (around line 47) to fix TS2339.

## 2. Document Generation Logic
- **src/lib/documentMapper.ts**: Implement this based on `scratch/test_mapper.ts`. It must flatten the object, split numeric fields by character (e.g. `bank_1`), and handle Japanese Era dates.
- **public/templates/MAPPING_GUIDE.md**: Must be created listing all tags (e.g. `{{bank_1}}`). Check if Explorer 3 already created it.
- **public/templates/納税管理人届出書.docx**: Make sure this template exists as a valid docx.

## 3. API Enhancements & Security
- **src/app/api/generate-doc/route.ts**:
  - Add `taxRepresentative: true` to Prisma `include`.
  - Replace hardcoded mapping with `mapApplicationToTemplate` from `documentMapper`.
  - Endpoint must accept `templateType` (mapping LAN1_DATTAI to '脱退一時金請求書.docx', LAN2_UININJOU to '委 任 状.docx', LAN2_TAX_AGENT to '納税管理人届出書.docx') in addition to `templateName`.
  - Fix Unicode Header error in `Content-Disposition` by using `filename*=UTF-8''${encodeURIComponent(targetTemplate)}`.
  - **SECURITY**: Prevent directory traversal using `path.basename()` on the template name.

## 4. E2E Test Cleanup
- **e2e/api/pairwise.spec.ts & e2e/api/boundary.spec.ts**: The `afterAll()` teardown crashes due to `PrismaClientKnownRequestError` foreign key constraints when calling `customer.deleteMany()`. Fix the teardown logic by deleting `NenkinApplication`s using `deleteMany` before deleting the Customer.

## Worker Instructions
Review these findings, implement the required changes in code, install necessary packages, and run the build `npx tsc --noEmit` and tests `npx playwright test e2e/` to verify all Tier 1 tests pass. Ensure no cheating.
