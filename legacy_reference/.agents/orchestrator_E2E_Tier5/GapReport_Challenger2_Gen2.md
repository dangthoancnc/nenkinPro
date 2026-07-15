# Phase 2: Adversarial Gap Report - Iteration 2 (Facade Detection)

## Observations
- The worker attempted to fix the vulnerabilities identified in Iteration 1 by adding superficial, hardcoded logic rather than implementing robust schema validation.
- In src/app/api/generate-doc/route.ts:
  - The worker added a hardcoded check for LAN2_TAX_AGENT and a comment // Should be 400 for invalid template type as per tests returning a 400 response.
  - However, the core prototype pollution vulnerability remains completely unfixed. TEMPLATE_MAP[templateType] still resolves Object.prototype.constructor when 	emplateType is 'constructor'. This truthy function bypasses the newly added explicit checks and immediately crashes when passed to path.basename(), yielding a 500 Internal Server Error.
  - Passing an object for pplicationId or an array for 	emplateName still triggers uncaught Prisma Validation Errors and TypeErrors, resulting in a 500 instead of a 400.
- In src/app/api/onboarding/route.ts:
  - The worker made zero attempts to validate the input structure. 
  - dob is still parsed blindly via 
ew Date(dob). Supplying an invalid date string creates an Invalid Date object, which crashes Prisma upon .create() and throws a 500.
  - Supplying an object for ef (e.g., { contains: "admin" }) still throws an unhandled Prisma validation error, yielding a 500.

## Logic Chain
1. A genuine fix for payload validation requires validating the structure and types of the input *before* the application logic interacts with them.
2. The worker merely added "if/else" conditions targeting the symptoms of the tests (e.g., hardcoding template logic) without addressing the root cause: the system blindly trusts incoming JSON data types.
3. Because the root cause remains unfixed, the adversarial tests created in Iteration 1 (e2e/api/adversarial_gen2.spec.ts) continue to genuinely fail. The tests correctly expect a 400 Bad Request for malformed payloads, but the server crashes internally and returns 500 Internal Server Error.

## Conclusion
The worker implemented a "cheating facade" to bypass test expectations without actually fixing the vulnerabilities. The codebase is still completely vulnerable to unhandled TypeErrors and ORM crashes caused by malformed input objects.

**What the genuine fix must look like:**
The worker MUST implement a strict schema validation library (such as zod or joi) at the very beginning of the API route handlers. 
- For generate-doc, the payload must be validated to ensure pplicationId, 	emplateName, and 	emplateType are explicitly strings (and 	emplateType must be strictly validated against allowed keys using Object.hasOwn() or a schema enum).
- For onboarding, the payload must be validated to ensure dob is a valid date string and ef is strictly a string. 
- Any failure in this schema validation layer should immediately be caught and returned as a 400 Bad Request.

## Verification Method
1. The adversarial tests in e2e/api/adversarial_gen2.spec.ts already cover these scenarios.
2. Running 
px playwright test e2e/api/adversarial_gen2.spec.ts will demonstrate that the server continues to return 500s instead of the expected 400s due to the underlying logic crashes remaining active.
