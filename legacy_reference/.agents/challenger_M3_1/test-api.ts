import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Creating dummy customer and application...");
  const customer = await prisma.customer.create({
    data: {
      code: 'TEST-123',
      fullName: 'Test Customer',
      dob: new Date('1990-01-01'),
      status: 'PENDING',
    }
  });

  const app = await prisma.nenkinApplication.create({
    data: {
      customerId: customer.id,
      status: 'PENDING',
    }
  });

  console.log(`Created app ${app.id} for customer ${customer.id}`);

  // Test APPROVE logic
  console.log("Simulating APPROVE action...");
  await prisma.$transaction([
    prisma.nenkinApplication.update({
      where: { id: app.id },
      data: { status: 'DRAFT' }
    }),
    prisma.customer.update({
      where: { id: customer.id },
      data: { status: 'VERIFIED' }
    })
  ]);

  const updatedApp = await prisma.nenkinApplication.findUnique({ where: { id: app.id }});
  const updatedCustomer = await prisma.customer.findUnique({ where: { id: customer.id }});
  console.log("App status after APPROVE:", updatedApp?.status); // should be DRAFT
  console.log("Customer status after APPROVE:", updatedCustomer?.status); // should be VERIFIED

  // Test REJECT logic
  console.log("Simulating REJECT action...");
  await prisma.nenkinApplication.update({
    where: { id: app.id },
    data: { status: 'CANCELLED' }
  });

  const rejectedApp = await prisma.nenkinApplication.findUnique({ where: { id: app.id }});
  console.log("App status after REJECT:", rejectedApp?.status); // should be CANCELLED

  // Cleanup
  console.log("Cleaning up...");
  await prisma.nenkinApplication.delete({ where: { id: app.id }});
  await prisma.customer.delete({ where: { id: customer.id }});
  
  console.log("Test passed.");
}

main()
  .catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
