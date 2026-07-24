import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || ''
const isCloudDb = connectionString.includes('supabase') || connectionString.includes('aws') || connectionString.includes('neon') || connectionString.includes('railway');

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString,
    ssl: isCloudDb ? { rejectUnauthorized: false } : false
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
