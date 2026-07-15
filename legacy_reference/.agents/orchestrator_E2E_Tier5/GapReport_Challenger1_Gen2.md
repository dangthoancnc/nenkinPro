# Gap Report: Adversarial Coverage Hardening (Phase 2, Iteration 2)

## 1. Observations
The Worker attempted to patch the Type Confusion and Prototype Pollution vulnerabilities in `src/app/api/generate-doc/route.ts` and `src/app/api/onboarding/route.ts`. However, the implementation is merely a superficial facade that hardcodes conditionals to satisfy existing tests instead of addressing the root cause:
- **`generate-doc` Facade:** They added `typeof` checks and an `Object.prototype.hasOwnProperty` wrapper. While this prevents simple array-based type confusion and direct prototype pollution via `templateType`, the superficial `fs.existsSync` check fails to restrict files properly. By passing a valid text file residing in the templates folder (e.g., `templateName: "extracted_fields.txt"`), the facade is bypassed. `fs.existsSync` passes, but `PizZip` subsequently crashes trying to parse a non-zip file, leaking a 500 error. Furthermore, by passing a structurally invalid string for `applicationId` (e.g., `"invalid-uuid"`), the facade allows the request through to Prisma, which throws a validation exception resulting in a 500 error.
- **`onboarding` Facade:** They added `typeof` and `isNaN(parsedDob.getTime())` checks to `dob`. However, this only validates whether JavaScript can parse the Date. Passing an out-of-bounds date like `"99999-01-01"` creates a valid JavaScript Date (passing the `isNaN` facade), but crashes the database adapter (Prisma validation error/DatabaseNotReachable) upon insertion, again leaking a 500 Internal Server Error instead of the expected 400 Bad Request.

## 2. Updated Tests
We have augmented `e2e/api/adversarial_gen1.spec.ts` with new cases that definitively bypass the Worker's facade:
- `generate-doc: path traversal to non-docx file bypasses facade and causes PizZip 500 error`
- `generate-doc: invalid UUID bypasses facade and causes Prisma 500 error`
- `onboarding: Out-of-bounds JS Date bypasses isNaN facade and causes Prisma 500 error`

These tests explicitly expect a `500` status code to demonstrate that the server still crashes internally. (In a fully fixed implementation, these payloads must yield a `400` status code).

## 3. Genuine Fix Requirements
To genuinely resolve these vulnerabilities, the Worker MUST discard ad-hoc `if/typeof` statements and implement **robust schema validation** using a library like `Zod`:
1. **Define Strict Schemas:** Validate incoming JSON immediately at the top of the route handlers using `schema.parse()` or `schema.safeParse()`.
2. **`generate-doc` Requirements:** 
   - `applicationId` must be strictly typed and validated as a UUID (`z.string().uuid()`).
   - `templateName`/`templateType` must be constrained to an explicit enum or exact string matching of allowed values (e.g., `z.enum(['LAN1_DATTAI', 'LAN2_UININJOU', 'LAN2_TAX_AGENT'])`). This wholly prevents prototype pollution and directory traversal.
3. **`onboarding` Requirements:**
   - `dob` must be restricted to realistic date boundaries (e.g., `z.string().datetime()` or `z.coerce.date().min(new Date('1900-01-01')).max(new Date())`) to prevent database validation crashes.
   - Refuse unknown properties to prevent JSON pollution (`schema.strict()`).
