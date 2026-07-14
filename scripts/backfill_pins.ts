import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Backfill passwordPin = year from dob for all customers who have null passwordPin
  const customers = await prisma.customer.findMany({
    where: { passwordPin: null },
    select: { id: true, code: true, fullName: true, dob: true, passwordPin: true }
  });

  console.log(`Found ${customers.length} customers with null passwordPin. Backfilling...`);

  let updated = 0;
  let skipped = 0;

  for (const c of customers) {
    if (c.dob) {
      const year = new Date(c.dob).getFullYear().toString();
      // Skip if DOB is the default date (2026 = current year, means DOB was not set)
      if (year === '2026') {
        // Set pin to a temporary value based on default
        await prisma.customer.update({
          where: { id: c.id },
          data: { passwordPin: '0000' } // Placeholder for missing DOB
        });
        skipped++;
        continue;
      }
      await prisma.customer.update({
        where: { id: c.id },
        data: { passwordPin: year }
      });
      updated++;
      console.log(`  ✅ ${c.code} ${c.fullName} → Pin: ${year} (DOB: ${c.dob})`);
    } else {
      console.log(`  ⚠️ ${c.code} ${c.fullName} → No DOB, setting pin to '0000'`);
      await prisma.customer.update({
        where: { id: c.id },
        data: { passwordPin: '0000' }
      });
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped (no real DOB): ${skipped}`);
  
  // Verify the NP44122436EA customer specifically
  const target = await prisma.customer.findFirst({
    where: { cardNumber: 'NP44122436EA' },
    select: { code: true, fullName: true, cardNumber: true, passwordPin: true, dob: true }
  });
  console.log(`\n=== VERIFICATION: NP44122436EA ===`);
  if (target) {
    console.log(`  Name: ${target.fullName}`);
    console.log(`  Code: ${target.code}`);
    console.log(`  Card: ${target.cardNumber}`);
    console.log(`  Pin: ${target.passwordPin}`);
    console.log(`  DOB: ${target.dob}`);
  } else {
    console.log('  NOT FOUND');
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
