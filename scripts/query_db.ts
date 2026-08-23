import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const reps = await prisma.taxRepresentative.findMany();
  console.log('=== TAX REPRESENTATIVES ===', reps.length);
  if (reps.length === 0) {
    const created = await prisma.taxRepresentative.create({
      data: {
        fullName: 'DAO THI DUYEN',
        fullNameKana: 'ダオ ティ デュエン',
        address: '神奈川県川崎市幸区南加瀬4丁目18-48-205号',
        postalCode: '212-0055',
        phone: '080-9876-5432',
        relationship: '納税管理人',
        occupation: '会社員',
        dob: new Date('1991-04-02'),
      }
    });
    console.log('Created default tax rep:', created);
  } else {
    for (const r of reps) {
      const updated = await prisma.taxRepresentative.update({
        where: { id: r.id },
        data: {
          fullName: 'DAO THI DUYEN',
          fullNameKana: 'ダオ ティ デュエン',
          address: '神奈川県川崎市幸区南加瀬4丁目18-48-205号',
          postalCode: '212-0055',
          phone: '080-9876-5432',
          occupation: '会社員',
          dob: new Date('1991-04-02'),
          relationship: '納税管理人',
        }
      });
      console.log('Tax rep updated:', updated);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
