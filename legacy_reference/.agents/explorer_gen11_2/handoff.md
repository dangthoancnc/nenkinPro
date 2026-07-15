# Observation
- In `src/middleware.ts:62-67`, the Next.js edge middleware uses `fetch` to call the internal API (`/api/auth/employee/me`) using the request's parsed port (`request.nextUrl.port`). This `Host` header can be spoofed by an attacker, leading to an SSRF vulnerability. 
- Using `process.env.PORT` as a fallback was vetoed because custom dev ports (`next dev -p 3015`) are not automatically exported to environment variables.
- Reviewing protected API routes like `src/app/api/dashboard/route.ts` and `src/app/api/applications/route.ts` reveals they do **not** perform database-level authentication checks. They assume the middleware has fully validated the request. 
- However, `src/app/api/customers/route.ts` correctly reads the cookie and queries Prisma for the user before proceeding.
- All Client Components (like `src/app/page.tsx` and `src/app/applications/page.tsx`) perform client-side `fetch` calls to these API routes. If unauthorized, the middleware currently redirects page requests (e.g., `/`) to `/login` but returns `401` JSON for API requests.

# Logic Chain
1. Next.js Edge Middleware cannot reliably resolve the listening port or base URL when the `Host` header is untrusted, rendering loopback `fetch` calls fragile or insecure.
2. The middleware also lacks direct Prisma support as it runs in the Edge runtime.
3. Therefore, Option 2 is architecturally sound: the middleware should only serve as a lightweight gatekeeper that strictly verifies the existence and format of the session cookie (UUID format).
4. If the middleware only verifies the UUID format, an attacker could bypass it using an arbitrary well-formed UUID.
5. To prevent unauthorized data access, the actual DB validation (querying Prisma) must be pushed down to the Node.js API layer (Server Components, API Route Handlers).
6. Because some API routes (like `/api/dashboard/route.ts`) completely omit DB user checks, we must implement a centralized auth helper and invoke it across all protected API endpoints.

# Caveats
- Since the middleware will only check the cookie string format, deleted or invalidated users will still be able to load initial page shells until their client-side `fetch` requests hit the API and receive a `401 Unauthorized`.
- Client Components will need to gracefully handle `401` API responses in future iterations by forcibly logging out the user (clearing the cookie) and redirecting to `/login`.
- This approach requires updating all currently unprotected backend routes (~20 endpoints).

# Conclusion
We should adopt Option 2: Remove DB validation from the global middleware. 
1. **In `src/middleware.ts`:** Remove the `fetch` block. Add a Regex test: `const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;`. If the cookie is absent or fails the regex, return `handleUnauthorized`. Otherwise, return `NextResponse.next()`.
2. **Central Auth Helper:** Create `src/lib/auth.ts` exporting an async `getEmployeeUser()` function that queries Prisma using the `employee_auth` cookie from `next/headers`.
3. **API Routes:** Update every protected API route in `src/app/api/...` to call `await getEmployeeUser()`. If null, immediately return `401 Unauthorized`.

# Verification Method
- Execute `next dev -p 3015` and verify you can log in without issues.
- Spoof the Host header using `curl -H "Host: attacker.com:6379" -H "Cookie: employee_auth=<valid_uuid>" http://127.0.0.1:3000/api/dashboard` and verify no SSRF occurs, and the server returns valid data.
- Supply a non-existent UUID in the cookie `employee_auth=00000000-0000-4000-8000-000000000000` and hit `/api/dashboard` directly; verify that the API route correctly returns `401 Unauthorized`.
