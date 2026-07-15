import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nenkin_customer_session')?.value;
    
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.customerSession.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() }
      });
      cookieStore.delete('nenkin_customer_session');
    }
    
    cookieStore.delete('portal_auth'); // Just in case
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
