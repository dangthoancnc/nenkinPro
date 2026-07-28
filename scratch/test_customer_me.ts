import prisma from '../src/lib/prisma';

async function main() {
  const targetId = '99feba58-6daf-4132-b488-04a43943a492';
  console.log('Testing customer lookup without histories for targetId:', targetId);

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { id: targetId },
        { code: targetId },
        { applications: { some: { id: targetId } } },
      ],
    },
    include: {
      applications: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      bankAccounts: true,
      taxOffice: true,
    },
  });

  console.log('SUCCESS! Customer match result:', customer ? {
    id: customer.id,
    code: customer.code,
    fullName: customer.fullName,
    appCount: customer.applications?.length,
    appStatus: customer.applications?.[0]?.status
  } : 'NOT FOUND');
}

main().catch(console.error).finally(() => process.exit(0));
