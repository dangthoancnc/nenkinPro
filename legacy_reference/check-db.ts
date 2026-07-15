import prisma from './src/lib/prisma';

async function main() {
  const customerCount = await prisma.customer.count();
  const appCount = await prisma.nenkinApplication.count();
  
  console.log(`Customers in DB: ${customerCount}`);
  console.log(`Applications in DB: ${appCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
