import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { verifyPassword, hashPassword } from '../src/lib/auth/password';

async function main() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@nenkin.com' }
    });
    if (admin) {
      const isPass123 = await verifyPassword(admin.password, 'admin123');
      const isPass123456 = await verifyPassword(admin.password, '123456');
      console.log('ADMIN USER FOUND:', admin.email);
      console.log('Password is admin123?', isPass123);
      console.log('Password is 123456?', isPass123456);

      if (!isPass123 && !isPass123456) {
        // Reset admin@nenkin.com password to admin123 for convenience
        const newPass = await hashPassword('admin123');
        await prisma.user.update({
          where: { email: 'admin@nenkin.com' },
          data: { password: newPass }
        });
        console.log('RESET admin@nenkin.com password to: admin123');
      }
    } else {
      console.log('admin@nenkin.com not found');
    }
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
