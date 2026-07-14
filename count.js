const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const c = await prisma.customer.count();
  console.log('Total customers in DB:', c);
  const customers = await prisma.customer.findMany();
  if (c > 0) {
    console.log(customers.map(cu => ({ id: cu.id, code: cu.code, fullName: cu.fullName })));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
