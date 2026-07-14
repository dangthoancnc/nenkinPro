import { randomBytes, createHash } from 'crypto';
import prisma from '../prisma';

export const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '14', 10);
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  // 32 bytes provides 256 bits of entropy, recommended for secure session tokens
  return randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.staffSession.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function validateSession(token: string) {
  const tokenHash = hashSessionToken(token);

  const session = await prisma.staffSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check if revoked
  if (session.revokedAt) {
    return null;
  }

  // Check if expired
  if (session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  // Update lastSeenAt (throttled to 5 minutes to avoid DB pressure)
  const FIVE_MINUTES = 5 * 60 * 1000;
  if (Date.now() - session.lastSeenAt.getTime() > FIVE_MINUTES) {
    prisma.staffSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() }
    }).catch(console.error);
  }

  return session;
}

export async function revokeSession(token: string) {
  const tokenHash = hashSessionToken(token);
  
  await prisma.staffSession.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() }
  });
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.staffSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}
