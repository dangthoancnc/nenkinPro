# Adversarial Gap Report

## Observations
- Analyzed src/app/api/generate-doc/route.ts and src/app/api/onboarding/route.ts.
- eq.json() payloads are destructured and used directly without type validation (e.g., zod/joi).
- **generate-doc**: 
  - 	emplateType from payload is passed directly to an object lookup TEMPLATE_MAP[templateType]. Passing 'constructor' or '__proto__' returns the built-in Object/Function reference. This passes the if check, and is later fed into path.basename(), which expects a string. This causes a TypeError.
  - pplicationId is expected to be a string but is passed as-is to prisma.nenkinApplication.findUnique({ where: { id: applicationId } }). Passing an object (e.g. { contains: "123" }) causes a PrismaClientValidationError because Prisma expects a string.
  - 	emplateName passed as an array (e.g., ["LAN1_DATTAI"]) throws a TypeError in path.basename().
- **onboarding**:
  - ef from payload is passed directly to prisma.user.findUnique({ where: { staffCode: ref } }). Passing an object causes a Prisma validation error.
  - dob is parsed without validation (
ew Date(dob)). If a non-date string is passed, it creates an Invalid Date, causing a Prisma validation error when attempting to insert.
- These endpoints rely on a generic 	ry/catch to return 500 when these unhandled operations (TypeErrors, Prisma errors) crash. They do not validate input types and return proper 400 Bad Request responses.

## Logic Chain
1. By not validating JSON payloads, attackers can supply objects or arrays instead of strings.
2. Unsafe object lookups (TEMPLATE_MAP[templateType]) allow prototype property access (constructor).
3. Core Node.js functions (path.basename) and Prisma queries strictly require specific types and throw errors on invalid types.
4. While the 	ry/catch block prevents the server process from crashing completely, returning 500 for validation failures is an anti-pattern. This hides the actual errors, litters logs with false-positive server errors, and exposes the system to potential application-level DoS via resource exhaustion (e.g., generating endless Prisma error stack traces).

## Conclusion
The codebase lacks payload validation (schema validation), leaving endpoints vulnerable to prototype pollution-like crashes and ORM validation errors when provided with unexpected object/array structures. While they fail "safely" via catch block 500s, this is missing coverage of proper 400 rejection handling.

## Verification Method
Run the Playwright tests I've created:

px playwright test e2e/api/adversarial_gen2.spec.ts
They assert that these endpoints should properly return 400 Bad Request. They currently fail against the codebase because the server returns 500 Internal Server Error.
