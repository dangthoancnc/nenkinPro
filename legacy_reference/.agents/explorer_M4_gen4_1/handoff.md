# Handoff: Middleware Authentication & Next.js 16.2.6 Deprecation Fixes

## 1. Observation
- `src/middleware.ts` blindly redirects unauthenticated users to `/login`. API clients querying `/api/*` endpoints currently receive a 307 redirect instead of a JSON response with a 401 status code (`{ error: "Unauthorized" }`).
- Next.js 16.2.6 emits a deprecation warning for the `middleware` file convention and requires the file to be renamed to `proxy.ts` exporting a `proxy` function instead.
- The authentication check in `src/middleware.ts` only verifies the existence of the `employee_auth` cookie and does not validate the UUID against the database. `GET /api/auth/employee/me` effectively validates the cookie (it queries the database and returns 401 if invalid).

## 2. Logic Chain
- To resolve the deprecation warning, we must rename `src/middleware.ts` to `src/proxy.ts` and change `export function middleware` to `export async function proxy`.
- To fix the API routing issue, we can check if `request.nextUrl.pathname.startsWith('/api')`. If true, return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })`. Otherwise, redirect to `/login`.
- To fix the integrity violation (blind trust of cookie value), we can use `fetch` to call `request.nextUrl.origin + '/api/auth/employee/me'` from within the proxy. If the response is not `ok` (e.g., 401), we consider the user unauthenticated and apply the unauthorized logic.

## 3. Caveats
- `fetch` inside `src/proxy.ts` will create an additional internal network request for every authenticated route. This is acceptable given the constraints (Edge runtime cannot easily import Prisma directly).
- The `src/app/api/auth/employee/me/route.ts` API route is explicitly excluded from the proxy via the matcher (`/((?!api/portal|api/auth|...).*)`), so calling it from within the proxy will not cause an infinite loop.

## 4. Conclusion
The implementer (Worker) should:
1. Rename `src/middleware.ts` to `src/proxy.ts`.
2. Change the export to `export async function proxy(request: NextRequest)`.
3. Implement a `handleUnauthorized(req)` helper to return a 401 JSON for `/api/*` routes and a redirect to `/login` for other routes.
4. Add a `fetch` call to `${request.nextUrl.origin}/api/auth/employee/me` passing the cookie header to validate the UUID.

## 5. Verification Method
- **Static Check**: Verify `src/proxy.ts` exists and `src/middleware.ts` does not.
- **Build Check**: Run the build (`npm run build` or the project build command) and ensure the Next.js proxy/middleware compiles without the "middleware file convention is deprecated" warning.
- **Runtime Check**: Send a request to an authenticated API route with a fake UUID in the `employee_auth` cookie. It should return a 401 JSON response, not a 307 redirect, and it must reject the fake UUID.
