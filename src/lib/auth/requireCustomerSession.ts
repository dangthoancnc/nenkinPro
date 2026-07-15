import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function requireCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nenkin_customer_session')?.value;

  if (!token) {
    throw new Error('401_UNAUTHORIZED');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash },
    include: { customer: true }
  });

  if (!session) {
    throw new Error('401_UNAUTHORIZED');
  }

  const now = new Date();
  if (session.expiresAt < now || session.revokedAt !== null) {
    throw new Error('401_UNAUTHORIZED');
  }

  if (session.customer.pinResetRequired) {
    throw new Error('403_PIN_RESET_REQUIRED');
  }

  return { customerId: session.customerId, session };
}
