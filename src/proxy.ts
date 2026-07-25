import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname; 

  // Public paths (Accessible to public visitors without staff authentication)
  if (
    pathname === '/' ||
    pathname.startsWith('/customer') ||
    pathname.startsWith('/my-application') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/api/portal') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/faq') ||
    pathname.startsWith('/api/ai') ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/onboarding') ||
    pathname.startsWith('/api/ocr') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/logo.png')
  ) {
    return NextResponse.next();
  }

  // Helper to handle unauthorized access
  const handleUnauthorized = (req: NextRequest) => {
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  };

  // Check employee auth cookie for internal staff pages (/applications, /customers, /hr, /finance, /messenger, /settings)
  const employeeAuth = request.cookies.get('nenkin_staff_session')?.value;
  
  if (!employeeAuth) {
    return handleUnauthorized(request);
  }

  if (employeeAuth.length < 32) {
    return handleUnauthorized(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/portal|api/auth|api/ocr|api/faq|api/ai|api/public|customer|my-application|onboarding|portal|login|_next|favicon.ico).*)',
  ],
};
