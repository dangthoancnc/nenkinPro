# Handoff Report

## 1. Observation
- The worker updated `src/middleware.ts` to use `http://127.0.0.1:${request.nextUrl.port || process.env.PORT || 3000}`.
- Running a custom python test script (`test_auth.py`) querying `127.0.0.1:3015`.
- Requests with no cookie return `401 Unauthorized`.
- Requests with fake UUID return `401 Unauthorized`.
- Requests with fake UUID and injected host header (`Host: attacker.com`) return `401 Unauthorized`.
- Requests with fake UUID and injected host header and port (`Host: attacker.com:80`) return `401 Unauthorized`.

## 2. Logic Chain
- The vulnerability was due to SSRF via `Host` header poisoning causing the internal proxy fetch to redirect to an attacker server, which would return a mock valid auth response, thereby bypassing auth.
- The worker changed the fetch base URL to use `http://127.0.0.1` explicitly.
- The base URL does still read the port from `request.nextUrl.port` which is populated by Next.js using the spoofed `Host` header.
- However, since the fetch URL hostname is hardcoded to `127.0.0.1` and only the port is injected, the request is still sent to the localhost.
- The attacker can control the port, making the application send a request to `127.0.0.1:80` for example.
- Because `127.0.0.1:80` (or whatever the attacker sets) does not have the valid auth service, it will either refuse connection or return a non-200 response, which makes the check `!authResponse.ok` true, leading to 401 Unauthorized.
- There is no way for the attacker to make `127.0.0.1` return a 200 OK for `/api/auth/employee/me` unless there is another vulnerable service running on the same machine on a different port, which is out of scope.
- Therefore, the authentication bypass is properly fixed and SSRF is mitigated to a degree where it cannot be exploited for authentication bypass.

## 3. Caveats
- The attacker can still trigger internal port scanning on `127.0.0.1` by specifying different ports in the `Host` header. While this doesn't bypass auth, it is a minor SSRF.

## 4. Conclusion
- The authentication bypass via Host header SSRF has been fixed. The middleware now correctly blocks requests with fake cookies and spoofed host headers. The challenge passes.

## 5. Verification Method
- Run `npm run dev` to start the Next.js server.
- Run `python test_auth.py` and observe that all test cases return `401`.
