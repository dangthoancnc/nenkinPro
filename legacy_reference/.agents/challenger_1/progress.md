# Progress
Last visited: 2026-05-30T01:45:00Z

- Analyzed `src/app/api/generate-form/route.ts` and `src/app/api/customers/route.ts` for Auth Bypass and RBAC evasions.
- Found the local manual implementations to be robust: cookies are strictly verified against the database and COLLABORATORs are correctly restricted to their own `createdById` customers.
- Discovered that the global middleware (`src/proxy.ts`) is inactive because it is not named `middleware.ts`. This means other endpoints (like `/api/generate-doc` and `/api/dashboard/recent-applications`) are still completely vulnerable to auth bypass.
