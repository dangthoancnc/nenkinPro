# Handoff Report: Authentication Validation Fix

## 1. Observation
In `src/middleware.ts`, the app currently validates the `employee_auth` cookie by making a fetch request to its own API endpoint (`/api/auth/employee/me`). This is currently implemented using `request.nextUrl.port` or `process.env.PORT` to construct the URL, which has caused two distinct issues in previous iterations:
- Broken dev setups when using `-p` without environment variables (Iteration 9).
- SSRF vulnerabilities due to Next.js parsing the `Host` header to populate `request.nextUrl.port`, allowing attackers to force the server to fetch internal services (Iteration 10).

Furthermore, a review of the API routes reveals that several routes (e.g., `api/applications/route.ts`, `api/dashboard/route.ts`, `api/hr/staffs/route.ts`) completely lack internal database authentication checks, relying entirely on the middleware to reject unauthenticated requests. Conversely, other routes (e.g., `api/customers/route.ts`, `api/generate-form/route.ts`) redundantly perform their own `prisma.user.findUnique` lookups.

## 2. Logic Chain
1. Attempting to securely determine the Next.js port in the Edge Runtime (middleware) is brittle and prone to bypasses, as `request.nextUrl` inherently trusts the `Host` header.
2. Making HTTP requests to your own API within Next.js middleware is considered an anti-pattern. It introduces unnecessary latency and fails in Edge deployment environments (like Vercel) where `127.0.0.1` cannot resolve the Next.js server.
3. Because the Edge Runtime does not support Prisma natively, the middleware cannot safely perform a database query directly.
4. Therefore, the most robust and architecturally sound approach (Option 2) is to remove the database validation from the global middleware and delegate it to the API routes/Server Components where Prisma is fully supported.
5. However, since the middleware currently acts as the *sole* database validation barrier for several endpoints, moving the DB check out of the middleware mandates that we introduce a centralized authentication helper and apply it to **every** protected API route. Failure to do so would leave routes like `/api/dashboard` exposed to any user who simply provides a syntactically valid UUID in their cookie.
6. The middleware should be downgraded to perform a fast, superficial validation (e.g., checking if the cookie exists and matches a standard UUID regex).
7. Finally, to ensure users with invalid/deleted UUIDs are smoothly redirected to the login page (a function previously handled by the middleware), the client-side `Topbar.tsx` (which already fetches `/api/auth/employee/me` on mount) must be updated to push the router to `/login` upon receiving a 401 response.

## 3. Caveats
- This architectural shift requires touching approximately 20 API route files to ensure full security coverage.
- Server Components that fetch data directly from the DB (if any are introduced later) will also need to manually invoke the new auth helper.
- The `api/auth/employee/me/route.ts` already correctly checks the database, so it can be utilized natively by `Topbar.tsx` to handle client-side redirections.

## 4. Conclusion
The best fix is Option 2: Remove the database fetch from the global middleware and implement centralized authentication in the route handlers.

### Implementation Plan:
1. **Update `src/middleware.ts`**:
   - Remove the `fetch()` call to `/api/auth/employee/me`.
   - Validate that the `employee_auth` cookie exists and matches a valid UUID format using a RegExp (e.g., `/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/`). If invalid, redirect to `/login` or return 401.
2. **Create Central Auth Utility (`src/lib/auth.ts`)**:
   - Export an `async function getAuthenticatedUser()` that reads `cookies().get('employee_auth')` and queries `prisma.user.findUnique`. Return the user object or `null`.
3. **Secure All Protected API Routes**:
   - Import and call `getAuthenticatedUser()` in every API route under `src/app/api/` (except public ones like `portal`, `auth`, `test_bypass`).
   - If it returns `null`, the route must immediately return `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
   - Replace the redundant `prisma.user.findUnique` code in existing protected routes (like `api/customers/route.ts`) with this new helper.
4. **Update Client-Side Redirection (`src/components/Topbar.tsx`)**:
   - Update the existing `useEffect` fetch to `/api/auth/employee/me`. If the response is `401` or `success: false`, invoke `router.push('/login')` to log the user out.

## 5. Verification Method
- **Code Inspection**: Verify `src/middleware.ts` no longer contains a `fetch()` call.
- **Security Testing**: Send a direct `GET` request to `/api/dashboard` with a randomly generated (but syntactically valid) UUID in the `employee_auth` cookie. The API must return `401 Unauthorized`.
- **Functionality Testing**: Ensure running `next dev -p 3015` allows normal login and navigation without breaking.
- **Client Routing**: Delete the user from the database while logged in and refresh the page; the frontend should automatically redirect to `/login`.
