const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.customer.findFirst();
  if (customer) {
    console.log("Customer ID:", customer.id);
  } else {
    // Create one
    const newCustomer = await prisma.customer.create({
      data: {
        id: "test-customer-123",
        fullName: "Test Customer",
        status: "ACTIVE"
      }
    });
    console.log("Created customer ID:", newCustomer.id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
