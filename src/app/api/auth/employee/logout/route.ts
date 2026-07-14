import { NextResponse } from 'next/server';
import { revokeSession } from '@/lib/auth/session';
import { clearSessionCookie, getSessionCookie } from '@/lib/auth/cookies';

export async function POST() {
  try {
    const token = await getSessionCookie();
    
    if (token) {
      // Revoke session in database
      await revokeSession(token);
    }
    
    // Clear cookie regardless
    await clearSessionCookie();
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Employee Logout Error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
