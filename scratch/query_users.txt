import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('Users:', users);
  
  const taxOffices = await prisma.taxOffice.findMany({ take: 5 });
  console.log('Tax Offices:', taxOffices);
}

main().catch(console.error);
