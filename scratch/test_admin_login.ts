import prisma from '../src/lib/prisma';
import { verifyPassword } from '../src/lib/auth/password';
import { createSession } from '../src/lib/auth/session';

async function main() {
  console.log('Testing full admin login flow...');
  const user = await prisma.user.findUnique({
    where: { email: 'admin@nenkin.com' }
  });
  console.log('User found:', user ? { id: user.id, email: user.email, name: user.name } : null);

  if (user) {
    const isValid = await verifyPassword(user.password, 'admin2026');
    console.log('Password valid (admin2026):', isValid);
    if (isValid) {
      const token = await createSession(user.id);
      console.log('CREATE SESSION SUCCESS! Token:', token ? 'OK' : 'FAILED');
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
