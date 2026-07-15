# Observation
- With `employee_auth=fake-uuid-1234`, testing `GET /api/dashboard` with python `urllib` gives HTTP 200 OK and successfully returns the JSON body with dashboard KPI data! `{"success":true,"data":{"kpis":[{"title":"Tổng Khách hàng","value":"1"...`.
- This means the fake UUID cookie successfully bypasses authentication for `GET /api/dashboard`.

Why did it bypass? 
1. Next.js App Router API endpoints that don't use dynamic functions (like `cookies()` or `headers()`) are statically evaluated and cached.
2. But `src/middleware.ts` runs on *every request* before the cache, doesn't it?
3. In `middleware.ts`, there is:
```typescript
  // Validate the UUID by calling the internal auth endpoint
  try {
    const authUrl = new URL('/api/auth/employee/me', request.nextUrl.origin);
    const authResponse = await fetch(authUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') || ''
      }
    });

    if (!authResponse.ok) {
```
Wait! Is `middleware.ts` running at all for `urllib.request`?
When I run `curl.exe -v -H "Cookie: employee_auth=fake-uuid-1234" http://localhost:3015/api/dashboard`, I get `200 OK` and the JSON response!
When I run `curl.exe -v -H "Cookie: employee_auth=" http://localhost:3015/api/dashboard`, I get `307 Temporary Redirect` to `/login`.
This means **middleware IS running**. If there's no cookie, it hits `if (!employeeAuth) { return handleUnauthorized(request); }` and redirects to `/login`.
But if the cookie is present (even fake), it calls `fetch(authUrl.toString())`.
Why does `fetch('/api/auth/employee/me')` return `authResponse.ok === true` when the UUID is fake?
In `test-me.py`, I requested `/api/auth/employee/me` with `employee_auth=fake-uuid-1234` and I got `401 Unauthorized` with `{"success":false,"user":null}`!
So `/api/auth/employee/me` properly returns 401 for fake UUIDs.

So why does `authResponse.ok` pass in `middleware.ts`?
Let's look at `middleware.ts` again!
```typescript
    const authUrl = new URL('/api/auth/employee/me', request.nextUrl.origin);
    const authResponse = await fetch(authUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') || ''
      }
    });
```
Wait! Does `fetch` in Next.js middleware follow redirects? No, `authUrl` is `/api/auth/employee/me`.
What does `request.nextUrl.origin` evaluate to in Next.js middleware?
Often in development, it might be `http://localhost:3015`.
But wait! If the middleware runs and calls `fetch`, does it loop?
`'/api/auth/employee/me'` starts with `/api/auth`.
In `middleware.ts`, there is:
```typescript
  if (
    pathname.startsWith('/portal') ||
    pathname.startsWith('/api/portal') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
```
So `/api/auth/employee/me` bypasses the middleware! This is correct.
Then the request goes to `src/app/api/auth/employee/me/route.ts` which returns 401 for fake UUID.

So `fetch` in `middleware.ts` SHOULD get a 401 response!
Why is it getting a 200 response? Or is it throwing an error?
```typescript
  } catch (error) {
    console.error('Proxy auth validation error:', error);
    return handleUnauthorized(request);
  }
```
If it throws an error, it returns 401!
But it returns 200 for `/api/dashboard`!
Wait, if `authResponse.ok` is FALSE, it returns `handleUnauthorized(request)`, which is 401!
But it DOES NOT return 401 for `/api/dashboard`. It returns 200!
This means `authResponse.ok` is TRUE.

HOW CAN `/api/auth/employee/me` return 200 OK for a fake UUID when requested from `middleware.ts`?

Could it be that Next.js caches the `fetch` in `middleware.ts`?
YES! `fetch` in Next.js is heavily cached by default!
If the `middleware.ts` uses `fetch(..., { headers: ... })`, Next.js might cache it!
But `fetch` with varying headers (like cookie) shouldn't be cached?
Wait, if the first time it was called, it was cached?
No, the worker's proxy code has NO `{ cache: 'no-store' }`.
`const authResponse = await fetch(authUrl.toString(), { headers: { cookie: ... } });`
Next.js App Router defaults to `force-cache` for `fetch`!
Wait, if it's cached, then `authResponse` could be returning a previously cached 200 OK?
If I restart the server, does it still return 200?

Let me test restarting the server, or I can just check the code.

Actually, is `/api/auth/employee/me` returning 200 for ANY request without checking the cookie?
Let's see `src/app/api/auth/employee/me/route.ts`:
```typescript
    const cookieStore = await cookies();
    const userId = cookieStore.get('employee_auth')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }, ...
```
If `userId` is fake, `user` is null. It returns 401!
So `/api/auth/employee/me` NEVER returns 200 for a fake UUID.
Then how did `middleware.ts` get `authResponse.ok === true`?
Wait! `POST /api/generate-form` returns 401 Unauthorized!
If `fetch` was cached with 200 OK, then `POST /api/generate-form` should ALSO get 200 OK and bypass auth!
Why did `POST /api/generate-form` get 401 Unauthorized, but `GET /api/dashboard` got 200 OK?
Because `GET /api/dashboard` is statically rendered and CACHED by Next.js!
Wait, if `GET /api/dashboard` is cached, Next.js might NOT EVEN RUN MIDDLEWARE for it?
No, middleware runs BEFORE the cache.
If middleware runs before the cache, why did it let `GET /api/dashboard` through but blocked `POST /api/generate-form`?
Wait! Look at the `test-dash.py` again.
It sends `Cookie: employee_auth=123e4567-e89b-12d3-a456-426614174000`.
Then `middleware.ts` sees `employeeAuth` is present.
Then it `fetch('/api/auth/employee/me')`.
But wait! If the server is running on port 3015. What is `request.nextUrl.origin`?
If you request `http://localhost:3015/api/dashboard`, `request.nextUrl.origin` is `http://localhost:3015`.
But in Next.js middleware, `fetch` to relative or absolute URL to ITSELF can sometimes hang or fail, triggering `catch (error)`.
Wait, if it triggers `catch (error)`, it returns `handleUnauthorized(request)` which is 401!
But `GET /api/dashboard` got 200!
This means `fetch` SUCCEEDED and `authResponse.ok` was TRUE.
HOW?
Is it possible that `authResponse.ok` is true because it was redirected?
Wait! If `request.headers.get('cookie')` is sent to `fetch('/api/auth/employee/me')`, and the server returns 401. `fetch` handles 401 by just returning the response with `.ok = false`.
But what if the `fetch` hits `/api/auth/employee/me` and it redirects? No, it doesn't.
Wait... what if `POST /api/generate-form` was blocked NOT by middleware, but by the route handler itself?
Let's check `src/app/api/generate-form/route.ts`!
Does `src/app/api/generate-form/route.ts` HAVE ITS OWN AUTH CHECK?
