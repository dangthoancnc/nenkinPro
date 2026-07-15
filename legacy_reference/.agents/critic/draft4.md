# Observation
- The middleware successfully rejects `POST /api/generate-form` and `POST /api/generate-doc` when a fake UUID cookie is provided, returning `401 Unauthorized` and `404 Not Found`/`400 Bad Request` respectively (wait, if it returns 404, it means it bypassed the middleware).
- Wait, when I sent `POST /api/dashboard` with the fake UUID, it returned `405 Method Not Allowed`, meaning it bypassed the middleware.
- When I sent `POST /api/generate-doc` it returned `400 Bad Request`, meaning it bypassed the middleware.
- When I sent `POST /api/generate-form` it returned `401 Unauthorized` with `{"error":"Unauthorized"}`.

Wait! The middleware handles `handleUnauthorized` like this:
```typescript
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
```
If the middleware blocked it, it would return `401 Unauthorized`.
Why did `/api/generate-form` get `401 Unauthorized`? Yes, middleware blocked it!
Wait, why did `/api/dashboard` GET get `200 OK`?
Why did `/api/dashboard` POST get `405 Method Not Allowed`?
Why did `/api/generate-doc` POST get `404 Not Found` (when sending `applicationId`)?

Because `/api/dashboard` is apparently matching a different rule or bypassing middleware entirely!

Wait! Look at `middleware.ts`'s matcher:
```typescript
export const config = {
  matcher: [
    '/((?!api/portal|api/auth|portal|login|_next/static|_next/image|favicon.ico).*)',
  ],
};
```
Is `src/middleware.ts` actually running?
Let's see: `curl.exe -v http://localhost:3015/api/dashboard` WITHOUT cookie gets a 307 Redirect to `/login`.
So the middleware IS RUNNING for `/api/dashboard`!
But wait, if we send an empty cookie, it redirects to `/login`.
If we send `employee_auth=somethingelse`, wait, let me check the output of task-340.
