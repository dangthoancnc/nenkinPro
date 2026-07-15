# Observation
- With the cookie `employee_auth=fake-uuid-1234`, `GET /api/dashboard` via Python's `urllib.request` returns HTTP 200 OK with the actual JSON dashboard data `{"success":true,"data":{"kpis":...`.
- However, making the same request via PowerShell `Invoke-WebRequest` without `MaximumRedirection 0` results in a redirect `307 Temporary Redirect` to `/login`.
- A POST request to `/api/generate-form` or `/api/generate-doc` using Python `urllib.request` with the same fake cookie returns HTTP 401 Unauthorized.
- The `src/middleware.ts` has a configuration matcher: `'/((?!api/portal|api/auth|portal|login|_next/static|_next/image|favicon.ico).*)'`. This correctly includes `/api/dashboard`.

# Logic Chain
- Why does `urllib.request` get HTTP 200 for `/api/dashboard` while PowerShell gets a 307 Temporary Redirect?
- `urllib.request` by default follows redirects! Wait, if it followed the redirect to `/login`, it would get the HTML content of the login page, not the JSON from `/api/dashboard`.
- Let's check the Python script result. The script prints:
  `200`
  `b'{"success":true,"data":{"kpis":...}}'`
- If it were redirected to `/login`, it would not return the JSON data. This means the server ACTUALLY RETURNED 200 OK and the JSON for `urllib.request`.
- Wait, what headers does `urllib.request` send by default? It sends `User-Agent: Python-urllib/3.x`.
- What headers does PowerShell `Invoke-WebRequest` send? `User-Agent: Mozilla/5.0... WindowsPowerShell/...`
- Why does Next.js middleware allow the request sometimes and block it sometimes?
- Could `/api/dashboard` be a Server Component or statically generated, or cached?
- Yes! Next.js App Router might aggressively cache `GET` API routes unless they use dynamic functions.
- In `src/app/api/dashboard/route.ts`, there is no `export const dynamic = 'force-dynamic'` and it does not use `cookies()` or `headers()` from `next/headers`.
- Because it does not use dynamic functions, Next.js caches the response at build time!
- Wait, but the middleware should intercept the request BEFORE it hits the cache?
- According to Next.js docs, middleware runs before cached responses. But wait, Next.js also has a client-side router cache.
- Wait, if the middleware intercepts it, why does `urllib.request` get 200?
- Is it possible that `urllib.request` is NOT hitting the proxy.ts middleware?
- Ah! In the worker's changes, they created `src/proxy.ts`. Wait! Is `proxy.ts` being used by Next.js?
- Next.js uses `src/middleware.ts`. The worker updated `src/proxy.ts` but the file is named `proxy.ts`, not `middleware.ts`.
- Wait, did the worker rename it to `src/middleware.ts`? I saw `src/middleware.ts` exists and its content is identical to `proxy.ts`!
- So `middleware.ts` IS running.
- Let's check `Invoke-WebRequest -Uri http://localhost:3015/api/dashboard ...` in PS.
- PowerShell's `Invoke-WebRequest` returned a 307 Redirect to `/login`.
- If the middleware redirects to `/login`, it should return 307. Wait, why did `Invoke-WebRequest` get 307 while `urllib.request` got 200?
- Ah, PowerShell `Invoke-WebRequest` was run with `-MaximumRedirection 0`. It caught the 307.
- Wait! In my `urllib.request` script for `/api/dashboard`, I just ran:
  `python .agents/critic/test-dash.py`
  And it returned 200 OK with the JSON data!
  But wait, why did it return 200?
  Let me check my `test-dash.py` again.
  `req.add_header('Cookie', 'employee_auth=123e4567-e89b-12d3-a456-426614174000')`
  Wait! I didn't see `urllib.request` following a redirect to `/login`. If it followed the redirect to `/login`, it would get the HTML of `/login`, but it got the JSON of `/api/dashboard`. This means NO REDIRECT happened for `urllib.request`.
- WHY did NO REDIRECT happen for Python but it happened for PowerShell?
- Maybe the server I am hitting in Python is `http://localhost:3015` and in PS I hit `3015`? Yes, both 3015.
- Let's re-read the PowerShell task output for task-294.
  `Invoke-WebRequest -Uri http://localhost:3015/api/dashboard ... -ErrorAction Stop` returned 307 Location: `/login`.
- In `middleware.ts`:
  ```typescript
  const handleUnauthorized = (req: NextRequest) => {
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  };
  ```
- If the URL starts with `/api`, it should return 401!
- Why did PowerShell get 307 Redirect to `/login` for `/api/dashboard`?
- Wait, `req.nextUrl.pathname` might be different if the request is not exactly what we think?
- No, `req.nextUrl.pathname` should be `/api/dashboard`, which starts with `/api`, so it should return 401, NOT 307!
- Why did it return 307?
- Because NEXT.JS automatically redirects if there's a trailing slash? No, there is no trailing slash.
- Wait, maybe the 307 is NOT from our `handleUnauthorized` function?
- Could the 307 be from something else? Like Next.js's internal routing?
- Wait... I ran `curl -v http://localhost:3015/api/dashboard` and it returned the HTML for the PORTAL, wait no, it returned the HTML for the DASHBOARD!
  `outerText=T?ng quan`
  `href=/customers`
  Wait, `curl -v http://localhost:3015/api/dashboard` returned HTML?!
  No, it returned HTML because Next.js has an App Router page for `/api/dashboard`? No, API routes are in `/api/...` but wait, in App Router, the API route is `app/api/dashboard/route.ts`.
- Wait, what if there is a page at `src/app/api/dashboard/page.tsx`? No.
- Wait, let me check the result of `curl -v http://localhost:3015/api/dashboard` without cookie.
  It returned a 200 with HTML! 
  Look at the `curl` output in task-285! 
  It returned the Dashboard HTML!
  Ah! If it's returning HTML, then `http://localhost:3015/api/dashboard` is somehow rendering the dashboard layout?
  No! Look closely at the `curl -v http://localhost:3015/api/dashboard` output in task-290. 
  The output is a PowerShell `Invoke-WebRequest` output parsed as HTML (`ParsedHtml: mshtml.HTMLDocumentClass`), NOT raw curl output. Why?
  Because in PowerShell, `curl` is an alias for `Invoke-WebRequest`!!!
  So `curl -v` just ran `Invoke-WebRequest -v` and followed redirects and got the `/login` page HTML!
  Wait, did it redirect to `/login`? Yes, the HTML contains `<SPAN class="font-medium text-sm whitespace-nowrap">Khách hàng</SPAN>`, wait, the Login page has the sidebar? No, the login page doesn't have a sidebar! The Dashboard has the sidebar!
  So it means it got the DASHBOARD HTML!
  But `/api/dashboard` should return JSON!
- Wait, why does `/api/dashboard` return HTML?
  Let me test with a real `curl.exe` instead of `curl` alias in PowerShell!
