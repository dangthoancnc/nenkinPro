import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth/authorization';
import { clearSessionCookie } from '@/lib/auth/cookies';

export async function GET() {
  try {
    const { user, error } = await requireStaff();

    if (error || !user) {
      await clearSessionCookie();
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, name: user.name, role: user.role, email: user.email }
    });

  } catch (error: unknown) {
    console.error('Employee Me Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
