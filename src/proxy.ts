import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname; 
  console.log('PROXY INTERCEPTED:', pathname);
  
  // Public paths
  if (
    pathname.startsWith('/portal') ||
    pathname.startsWith('/api/portal') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/onboarding') ||
    pathname.startsWith('/api/ocr') ||
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
  const employeeAuth = request.cookies.get('nenkin_staff_session')?.value;
  
  if (!employeeAuth) {
    return handleUnauthorized(request);
  }

  // Validate the token length (it's a 64 char hex string now, but let's be flexible)
  if (employeeAuth.length < 32) {
    return handleUnauthorized(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/portal|api/auth|api/ocr|portal|login|_next|favicon.ico).*)',
  ],
};
