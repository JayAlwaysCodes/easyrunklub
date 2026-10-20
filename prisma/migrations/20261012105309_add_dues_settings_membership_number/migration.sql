/*
  Warnings:

  - A unique constraint covering the columns `[membershipNumber]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionPurpose" AS ENUM ('ACTIVATION', 'TOPUP', 'DUES', 'OTHER');

-- CreateEnum
CREATE TYPE "DuesStatus" AS ENUM ('DUE', 'PAID', 'WAIVED');

-- AlterEnum
ALTER TYPE "MembershipStatus" ADD VALUE 'LAPSED';

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "membershipNumber" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "purpose" "TransactionPurpose";

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "dues_charges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "DuesStatus" NOT NULL DEFAULT 'DUE',
    "paidAt" TIMESTAMP(3),
    "paidVia" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dues_charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dues_charges_transactionId_key" ON "dues_charges"("transactionId");

-- CreateIndex
CREATE INDEX "dues_charges_status_dueDate_idx" ON "dues_charges"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "dues_charges_userId_periodStart_key" ON "dues_charges"("userId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_membershipNumber_key" ON "memberships"("membershipNumber");

-- AddForeignKey
ALTER TABLE "dues_charges" ADD CONSTRAINT "dues_charges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dues_charges" ADD CONSTRAINT "dues_charges_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
