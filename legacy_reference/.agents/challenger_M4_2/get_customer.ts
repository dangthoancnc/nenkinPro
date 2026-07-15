import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient();
  const customer = await prisma.customer.findFirst();
  console.log("Customer ID:", customer?.id);
  await prisma.$disconnect();
}
run();
