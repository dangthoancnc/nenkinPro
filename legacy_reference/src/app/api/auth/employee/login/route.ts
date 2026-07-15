import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập Email và Mật khẩu.' }, { status: 400 });
    }

    // Auto-seed if database is empty
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await prisma.user.createMany({
        data: [
          { email: "admin@vietnenkin.com", password: "admin2026", name: "Admin VietNenkin", role: "ADMIN", staffCode: "ADMIN" },
          { email: "daoduyen1102@gmail.com", password: "duyen2026", name: "Dao Thi Duyen", role: "MANAGER", staffCode: "NV001" },
          { email: "nguyenvanlong@vietnenkin.com", password: "long2026", name: "Nguyen Van Long", role: "MANAGER", staffCode: "NV002" },
        ]
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    // In a real application, you should use bcrypt to hash and compare passwords.
    // For this prototype, we are doing a plain text comparison.
    if (!user || user.password !== password) {
      return NextResponse.json({ success: false, error: 'Email hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    // Set cookie
    const cookieStore = await cookies();
    
    // Store userId in cookie (in a real app, store a JWT instead)
    cookieStore.set('employee_auth', user.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } });

  } catch (error: unknown) {
    console.error('Employee Auth Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
