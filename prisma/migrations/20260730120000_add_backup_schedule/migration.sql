-- CreateTable
CREATE TABLE "BackupSchedule" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "dayOfWeek" INTEGER NOT NULL DEFAULT 0,
    "hour" INTEGER NOT NULL DEFAULT 2,
    "minute" INTEGER NOT NULL DEFAULT 0,
    "retentionCount" INTEGER NOT NULL DEFAULT 4,
    "lastRunAt" TIMESTAMP(3),
    "lastRunFile" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "runningSince" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);
