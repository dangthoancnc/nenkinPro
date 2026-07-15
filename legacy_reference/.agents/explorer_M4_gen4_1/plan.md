# Implementation Plan for src/proxy.ts

Replace `src/middleware.ts` with a new file `src/proxy.ts` containing the following code:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Public paths
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

  // Helper to handle unauthorized access
  const handleUnauthorized = (req: NextRequest) => {
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  };

  // Check employee auth cookie
  const employeeAuth = request.cookies.get('employee_auth')?.value;
  
  if (!employeeAuth) {
    return handleUnauthorized(request);
  }

  // Validate the UUID by calling the internal auth endpoint
  try {
    const authUrl = new URL('/api/auth/employee/me', request.nextUrl.origin);
    const authResponse = await fetch(authUrl.toString(), {
      headers: {
        cookie: request.headers.get('cookie') || ''
      }
    });

    if (!authResponse.ok) {
      const res = handleUnauthorized(request);
      res.cookies.delete('employee_auth');
      return res;
    }
  } catch (error) {
    console.error('Proxy auth validation error:', error);
    return handleUnauthorized(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/portal (API routes for portal)
     * - api/auth (API routes for auth)
     * - portal (Portal pages)
     * - login (Login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/portal|api/auth|portal|login|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

1. **Delete** `src/middleware.ts`.
2. **Create** `src/proxy.ts` with the code above.
