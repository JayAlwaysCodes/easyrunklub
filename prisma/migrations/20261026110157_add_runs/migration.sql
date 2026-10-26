-- CreateEnum
CREATE TYPE "RunFrequency" AS ENUM ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateTable
CREATE TABLE "run_series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "frequency" "RunFrequency" NOT NULL,
    "firstRunAt" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3),
    "capacity" INTEGER,
    "guestsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "maxGuestsPerMember" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "run_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "guestsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "maxGuestsPerMember" INTEGER NOT NULL DEFAULT 1,
    "status" "RunStatus" NOT NULL DEFAULT 'SCHEDULED',
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_rsvps" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 0,
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "run_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "runs_startsAt_idx" ON "runs"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "runs_seriesId_startsAt_key" ON "runs"("seriesId", "startsAt");

-- CreateIndex
CREATE INDEX "run_rsvps_userId_idx" ON "run_rsvps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "run_rsvps_runId_userId_key" ON "run_rsvps"("runId", "userId");

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "run_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_rsvps" ADD CONSTRAINT "run_rsvps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_rsvps" ADD CONSTRAINT "run_rsvps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
