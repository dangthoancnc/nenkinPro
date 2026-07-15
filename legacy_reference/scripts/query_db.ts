import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check NenkinApplication for card data
  const apps = await prisma.nenkinApplication.findMany({
    take: 10,
    select: {
      id: true,
      status: true,
      customer: {
        select: { id: true, code: true, fullName: true, cardNumber: true, passwordPin: true }
      }
    }
  });
  console.log('=== APPLICATIONS (first 10) ===');
  for (const a of apps) {
    console.log(`  App: ${a.id} | Status: ${a.status} | Customer: ${a.customer.fullName} | Card: ${a.customer.cardNumber} | Pin: ${a.customer.passwordPin}`);
  }

  // Search for NP4412243GEA anywhere
  console.log('\n=== SEARCHING NP4412243GEA ===');
  const byCard = await prisma.customer.findFirst({
    where: { cardNumber: 'NP4412243GEA' }
  });
  console.log('By cardNumber:', byCard ? `Found: ${byCard.fullName}` : 'NOT FOUND');

  // Check the customers page data (which might store cardNumber in a different way)
  const customerWithCards = await prisma.customer.findMany({
    where: { cardNumber: { not: null } },
    select: { code: true, fullName: true, cardNumber: true, passwordPin: true }
  });
  console.log(`\nCustomers with cardNumber set: ${customerWithCards.length}`);
  for (const c of customerWithCards) {
    console.log(`  ${c.code} | ${c.fullName} | Card: ${c.cardNumber} | Pin: ${c.passwordPin}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
