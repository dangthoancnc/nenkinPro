import 'dotenv/config';
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
  const isCloudDb = connectionString.includes('supabase') || connectionString.includes('aws') || connectionString.includes('neon') || connectionString.includes('railway');

  const pool = new Pool({
    connectionString,
    ssl: isCloudDb ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const SCHEMA_VERSION = '2026-09-21-collaborator-v1'

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
  var prismaSchemaVersion: undefined | string
}

if (process.env.NODE_ENV !== 'production' && globalThis.prismaSchemaVersion !== SCHEMA_VERSION) {
  globalThis.prismaGlobal = undefined
  globalThis.prismaSchemaVersion = SCHEMA_VERSION
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
