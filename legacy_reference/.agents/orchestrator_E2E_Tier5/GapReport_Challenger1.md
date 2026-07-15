### Gap Report:
1. **Type Confusion in `generate-doc` (DoS via Unhandled Exception)**
   - **Gap**: `templateName` is extracted from JSON without string validation.
   - **Exploit**: Sending `templateName: ["test.docx"]` bypasses truthiness checks. Passing an array to `path.basename` throws `TypeError [ERR_INVALID_ARG_TYPE]`.
   - **Impact**: Returns a 500 Internal Server Error exposing the Node.js stack trace/error details, bypassing standard 400 validation.

2. **NoSQL-like Type Confusion in Prisma Filter (`api/onboarding`)**
   - **Gap**: `ref` is extracted and passed directly to Prisma's `findUnique`.
   - **Exploit**: Sending `ref: {"contains": "A"}` injects an advanced filter object. `findUnique` only accepts exact matches, causing Prisma to throw a strict validation exception.
   - **Impact**: Bubbles to a 500 error exposing Prisma internal query logic.

3. **Date Parse Bypass (`api/onboarding`)**
   - **Gap**: `dob` uses `new Date(dob)` without validating if the output is valid.
   - **Exploit**: Sending `dob: "invalid-date"` creates an `Invalid Date` object, which Prisma rejects.
   - **Impact**: 500 error leaking Prisma schema types instead of a 400 validation error.

4. **Improper Handling of Unique Constraints (`api/onboarding`)**
   - **Gap**: The retry logic for unique `code` collision explicitly re-throws any `P2002` error that is not related to `code`.
   - **Exploit**: A customer registering with an existing unique `cardNumber` triggers `P2002`.
   - **Impact**: The endpoint crashes with a 500 error instead of gracefully returning a 400 "Card number already exists".
