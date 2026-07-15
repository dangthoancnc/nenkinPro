# Observation
- **Requirements**: `ORIGINAL_REQUEST.md` (R1-R4) outlines the Form Generator (M4), including a data mapper for `.docx` templates, an API endpoint (`/api/generate-doc`), UI export buttons, and a mapping guide.
- **Test Infra**: `TEST_INFRA.md` specifies an opaque-box, requirement-driven Playwright test suite separated into 4 tiers (Tier 1: Core, Tier 2: Boundary, Tier 3: Pairwise, Tier 4: Real-world scenarios).
- **Application State**: The app is built on Next.js (`http://localhost:3015`) using Prisma (`NenkinApplication`, `Customer`, `User` models).
- **Authentication & API**: API routes like `/api/applications` and `/api/generate-doc` require authentication (`validateEmployee()`). The UI has a list page at `/applications` and details at `/applications/[id]`.

# Logic Chain
1. **Playwright Installation**: We need to install `@playwright/test` as a dev dependency to satisfy the test framework requirement.
2. **Configuration & Data Seeding**:
   - `playwright.config.ts` must use a `global-setup.ts` to seed the database directly via Prisma (creating a mock User, Customer, and Application).
   - This setup will authenticate the test user and save the storage state (cookies/session), ensuring all subsequent Playwright tests start logged in.
   - The seeded `applicationId` can be stored in an environment variable (e.g., `process.env.TEST_APP_ID`) to bridge the gap between opaque-box interactions and the need for valid IDs.
3. **Opaque-Box Testing Strategy**:
   - **UI Tests**: Navigate to `/applications`, click the seeded test application, and click the document download buttons. Playwright's `page.waitForEvent('download')` will catch the Blob and verify the filename and size.
   - **API Tests**: Directly invoke `POST /api/generate-doc` using the APIRequestContext in Playwright with the seeded `TEST_APP_ID`.
4. **Tier Design**:
   - **Tier 1 (Core)**: Basic API/UI tests confirming functionality for valid data.
   - **Tier 2 (Boundary)**: Create applications with missing data (e.g., no postal code, missing bank info) to test how the mapper and API handle nulls.
   - **Tier 3 (Pairwise)**: Combinations of Document Type (Dattai, Uininjou, TaxAgent) × Application State (Draft, Completed) × Data Completeness.
   - **Tier 4 (Scenarios)**: Full user journeys from the applications list to downloading multiple documents.

# Caveats
- Strictly validating the generated text inside the `.docx` file (e.g., confirming `post_1` mapped correctly) during UI tests is difficult without an external library like `mammoth` or `unzipper`. We will rely on `scratch/test_mapper.ts` for deep logic validation, and use Playwright to ensure the file is generated, non-empty, and downloads successfully.
- If the application enforces strict UI-based flow, the global setup must accurately replicate the login session cookies.

# Conclusion
The E2E Test Suite for the Form Generator will be structured around Playwright with Prisma-based data seeding.

## Implementation Plan

### 1. Install Dependencies
```bash
npm install -D @playwright/test
```

### 2. `playwright.config.ts` Structure
```typescript
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),
  use: {
    baseURL: 'http://localhost:3015',
    storageState: 'e2e/.auth/user.json', // Use authenticated state
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### 3. Global Setup (`e2e/global-setup.ts`)
- Import `PrismaClient`.
- Upsert a test user, customer, and application.
- Log in programmatically or via UI to generate `e2e/.auth/user.json`.
- Expose `process.env.TEST_APP_ID`.

### 4. Test Design (Tiers 1 - 4)

**Tier 1: Core Functionality (e2e/api/generate-doc.spec.ts, e2e/ui/export-form.spec.ts)**
- API: POST `/api/generate-doc` with valid `applicationId` and `templateType='LAN1_DATTAI'`. Assert 200 OK and `content-type` is docx.
- UI: Navigate to `/applications/[id]`, click 'LAN1_DATTAI' download, assert download succeeds.
- Repeat for 'LAN2_UININJOU', 'LAN2_TAX_AGENT'.

**Tier 2: Boundary Value Analysis (e2e/api/boundary.spec.ts)**
- Seed an application with exactly 6-digit postal code (invalid), no bank account, empty DOB.
- Call `/api/generate-doc`. Assert it gracefully handles missing fields without crashing (returns 200 with partial docx).
- Call `/api/generate-doc` with a completely non-existent `applicationId` (assert 404).

**Tier 3: Pairwise Interactions (e2e/api/pairwise.spec.ts)**
- Matrix testing:
  - Template types: Dattai, Uininjou
  - Application Status: DRAFT, COMPLETED
  - Tax Rep assigned: Yes, No
- Validate that Uininjou generation fails or returns empty fields if Tax Rep is "No".

**Tier 4: Real-World Scenarios (e2e/ui/scenarios.spec.ts)**
- Scenario 1 (Full Journey): User navigates to `/applications`, searches for test customer, clicks view, downloads all three forms sequentially, verifying UI feedback.
- Scenario 2: User attempts to generate an unsupported template via API, asserts graceful error handling (e.g., 400 Bad Request).

# Verification Method
After implementation, run:
`npx playwright test`
Verify that tests pass, data is isolated (Prisma setup and teardown working), and UI/API tests correctly retrieve the `applicationId` context.
