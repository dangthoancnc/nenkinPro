-- AlterTable
ALTER TABLE "nenkin_customers" ADD COLUMN "pinResetRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "nenkin_customer_sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "nenkin_customer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nenkin_customer_sessions_tokenHash_key" ON "nenkin_customer_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "nenkin_customer_sessions_customerId_idx" ON "nenkin_customer_sessions"("customerId");

-- CreateIndex
CREATE INDEX "nenkin_customer_sessions_expiresAt_idx" ON "nenkin_customer_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "nenkin_customer_sessions" ADD CONSTRAINT "nenkin_customer_sessions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "nenkin_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
