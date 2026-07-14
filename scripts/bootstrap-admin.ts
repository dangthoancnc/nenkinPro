import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function bootstrap() {
  console.log('--- Admin Bootstrap Script ---');

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Error: BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set in environment variables.');
    process.exit(1);
  }

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('An ADMIN user already exists. Skipping bootstrap.');
      process.exit(0);
    }

    const hashedPassword = await hashPassword(adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN',
        staffCode: 'ADMIN-01',
      },
    });

    console.log(`Bootstrap successful. Admin user created with email: ${admin.email}`);
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap();
