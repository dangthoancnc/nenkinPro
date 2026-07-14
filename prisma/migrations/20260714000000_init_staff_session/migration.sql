-- CreateTable
CREATE TABLE "nenkin_staff_sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "nenkin_staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nenkin_staff_sessions_tokenHash_key" ON "nenkin_staff_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "nenkin_staff_sessions_userId_idx" ON "nenkin_staff_sessions"("userId");

-- CreateIndex
CREATE INDEX "nenkin_staff_sessions_expiresAt_idx" ON "nenkin_staff_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "nenkin_staff_sessions" ADD CONSTRAINT "nenkin_staff_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "nenkin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
