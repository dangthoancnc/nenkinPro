import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname; 
  
  // Public paths
  if (
    pathname.startsWith('/portal') ||
    pathname.startsWith('/api/portal') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/onboarding') ||
    pathname.startsWith('/_next')
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

  // Validate the UUID stateless check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(employeeAuth)) {
    return handleUnauthorized(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/portal|api/auth|portal|login|_next|favicon.ico).*)',
  ],
};
