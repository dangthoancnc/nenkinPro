const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    console.log('USERS_IN_DATABASE:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('DB ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
