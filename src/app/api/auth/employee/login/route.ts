import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, revokeAllUserSessions } from '@/lib/auth/session';
import { setSessionCookie, clearSessionCookie } from '@/lib/auth/cookies';

// Simple in-memory rate limiting for login attempts
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip);
    
    if (rateLimit && now < rateLimit.resetAt) {
      if (rateLimit.count > 10) {
        return NextResponse.json({ success: false, error: 'Quá nhiều yêu cầu. Thử lại sau.' }, { status: 429 });
      }
      rateLimit.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 }); // 5 minutes window
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập Email và Mật khẩu.' }, { status: 400 });
    }

    // User lookup
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Email hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    // Secure argon2 password verification
    const isValid = await verifyPassword(user.password, password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Email hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    // Clear old session cookie and revoke any active sessions from database
    await clearSessionCookie();
    await revokeAllUserSessions(user.id);

    // Create secure session
    const token = await createSession(user.id);
    
    // Set cookie
    await setSessionCookie(token);

    // Reset rate limit on success
    rateLimitMap.delete(ip);

    // Never return password hash or token in JSON response
    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });

  } catch (error: unknown) {
    console.error('Employee Auth Error:', error);
    return NextResponse.json({ success: false, error: 'Không thể đăng nhập. Vui lòng thử lại sau.' }, { status: 500 });
  }
}
