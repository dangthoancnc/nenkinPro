import { getSessionCookie } from './auth/cookies';
import { validateSession } from './auth/session';

export async function validateEmployee() {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  try {
    const session = await validateSession(token);
    return session ? session.user : null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}
