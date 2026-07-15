# Observation
- The `src/app/api/generate-form/route.ts` has its own auth check:
```typescript
    const cookieStore = await cookies();
    const userId = cookieStore.get('employee_auth')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
```
This is why `POST /api/generate-form` returned `401 Unauthorized` with `{"error":"Unauthorized"}`.

- The `src/app/api/generate-doc/route.ts` DOES NOT have its own auth check!
```typescript
export async function POST(req: Request) {
  try {
    const { applicationId, templateName } = await req.json();

    if (!applicationId || !templateName) {
      return NextResponse.json({ error: 'Missing applicationId or templateName' }, { status: 400 });
    }
```
This is why `POST /api/generate-doc` returned `400 Bad Request` instead of `401 Unauthorized`. It successfully parsed the body and ran the logic!

- But wait, if `src/middleware.ts` is running and properly checking auth for ALL `/api/.*`, then `src/app/api/generate-doc/route.ts` SHOULD HAVE BEEN BLOCKED by `middleware.ts`.
- Why wasn't it blocked?
- Let's check `middleware.ts` fetch behavior!
In `src/middleware.ts`:
```typescript
    const authUrl = new URL('/api/auth/employee/me', request.nextUrl.origin);
    const authResponse = await fetch(authUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') || ''
      }
    });

    if (!authResponse.ok) { ...
```
Why is `authResponse.ok` true?
Is the URL wrong? `request.nextUrl.origin` might be `http://localhost:3015`.
Is the port correctly resolved in middleware?
Let me check the `test-dash.py` output again.
When I call `test-dash.py` which sends `GET /api/dashboard` with a fake cookie, it gets `200 OK`.
Wait, why did `curl.exe` with `Cookie: employee_auth=somethingelse` fail?
Ah, task 340 failed because `curl.exe` couldn't connect, possibly because I restarted the server at the exact same time.

Wait, if `authResponse.ok` is true, why did `authResponse.ok` become true?
Because `/api/auth/employee/me` is CACHED?
Let's see: `src/app/api/auth/employee/me/route.ts` uses `cookies()`, whichOpts Next.js into dynamic rendering!
Wait, `cookies()` opts into dynamic rendering, so it shouldn't be cached!

Is it possible that Next.js middleware is NOT running for API routes?
Look at `middleware.ts` config:
```typescript
export const config = {
  matcher: [
    '/((?!api/portal|api/auth|portal|login|_next/static|_next/image|favicon.ico).*)',
  ],
};
```
This matches `api/dashboard` and `api/generate-doc` because they don't start with `api/portal` or `api/auth`.
But wait, look closely at the regex:
`'/((?!api/portal|api/auth|portal|login|_next/static|_next/image|favicon.ico).*)'`
This regex means "match anything that does not start with `api/portal`, `api/auth`, `portal`, `login`, `_next/...`".
Does `/api/dashboard` start with `api/portal`? No.
Does it start with `api/auth`? No.
So it matches.

Wait, is `fetch` in middleware somehow FAILING but `authResponse.ok` is considered TRUE?
If `fetch` fails, it throws an error and goes to `catch (error)`.
```typescript
  } catch (error) {
    console.error('Proxy auth validation error:', error);
    return handleUnauthorized(request);
  }
```
If it goes to catch, it returns `handleUnauthorized(request)`, which is `401 Unauthorized` for `/api/*`.
BUT `/api/dashboard` returns 200 OK!
This means `fetch` SUCCEEDS and `authResponse.ok` is TRUE.
BUT `/api/auth/employee/me` returns 401 for fake cookies!
How can `fetch('/api/auth/employee/me')` return 200?

Let's test `fetch('/api/auth/employee/me')` from the middleware by adding a log or creating a test endpoint.
I can't modify `middleware.ts`, but I can write a script that mimics what `middleware.ts` does.
What if `request.headers.get('cookie')` is returning `null`?
If cookie is `null`, `fetch` sends NO cookie.
If no cookie is sent, `/api/auth/employee/me` returns 401.
So `authResponse.ok` would be FALSE.

Wait. Is it possible that `authResponse` is a 307 Redirect?
Wait, if `/api/auth/employee/me` redirects? No, it returns `NextResponse.json(..., { status: 401 })`.
Does `fetch()` follow redirects? Yes, but there's no redirect.
What if the URL `new URL('/api/auth/employee/me', request.nextUrl.origin)` resolves to something else?
If `request.nextUrl.origin` is `http://localhost:3015`, it resolves to `http://localhost:3015/api/auth/employee/me`.

Is there ANY WAY that `middleware.ts` is NOT EVEN COMPILED or USED?
Yes! The worker wrote the code in `src/proxy.ts`!
```
File Path: file:///E:/AntiGravity/apps/nenkin/src/proxy.ts
Total Lines: 73
```
Wait, the worker wrote `src/proxy.ts` AND `src/middleware.ts`?
Let me check the `task-248` output for `Get-ChildItem -Path . -Filter middleware.ts -Recurse`:
```
    Directory: E:\AntiGravity\apps\nenkin\src
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        2026/05/30      2:26           2063 middleware.ts
```
Wait, the `LastWriteTime` is `2:26`. The worker updated `src/proxy.ts` at `2:09`.
Who created `src/middleware.ts` at `2:26`?
Wait, when I called `view_file` on `src/middleware.ts`, it successfully opened it.
BUT I got a `File Not Found` error when I first tried to read `middleware.ts` at the root!
Ah! The worker's `proxy.ts` was literally the file they modified.
Is `src/middleware.ts` loaded by Next.js?
Yes, Next.js supports `src/middleware.ts`.
But wait! If `src/middleware.ts` is loaded, why is `GET /api/dashboard` returning 200 without auth?

Let's do a simple test. Send a request to an endpoint with NO cookie.
`curl.exe -v http://localhost:3015/api/dashboard`
Wait! `task-375` (curl -v -H "Cookie: ...") is returning what?
Let me check `task-375`.
