require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const argon2 = require('argon2');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'superadmin@nenkin.com';
  const plainPassword = 'password123';
  const hashedPassword = await argon2.hash(plainPassword, { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN',
      staffCode: 'SA-001'
    }
  });

  console.log(`Tài khoản Admin đã được tạo/cập nhật thành công!`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${plainPassword}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
