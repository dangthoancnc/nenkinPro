import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
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

    // Auto-seed if database is empty
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const p1 = await hashPassword("admin2026");
      const p2 = await hashPassword("duyen2026");
      const p3 = await hashPassword("long2026");

      await prisma.user.createMany({
        data: [
          { email: "admin@vietnenkin.com", password: p1, name: "Admin VietNenkin", role: "ADMIN", staffCode: "ADMIN" },
          { email: "daoduyen1102@gmail.com", password: p2, name: "Dao Thi Duyen", role: "MANAGER", staffCode: "NV001" },
          { email: "nguyenvanlong@vietnenkin.com", password: p3, name: "Nguyen Van Long", role: "MANAGER", staffCode: "NV002" },
        ]
      });
    }

    // Find user
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

    // Clear old session
    await clearSessionCookie();

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
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
