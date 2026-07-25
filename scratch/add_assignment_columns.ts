import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function addAssignmentColumns() {
  console.log('Adding assignment columns to nenkin_conversations table...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.nenkin_conversations 
    ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT,
    ADD COLUMN IF NOT EXISTS "assignedUserName" TEXT,
    ADD COLUMN IF NOT EXISTS "supportStatus" TEXT NOT NULL DEFAULT 'UNASSIGNED';
  `).catch(err => console.log('Notice:', err.message));
  console.log('Assignment columns added successfully!');
}

addAssignmentColumns().catch(console.error).finally(() => prisma.$disconnect());
