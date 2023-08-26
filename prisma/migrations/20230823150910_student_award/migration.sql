/*
  Warnings:

  - The primary key for the `StudentAward` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "StudentAward" DROP CONSTRAINT "StudentAward_studentId_fkey";

-- DropIndex
DROP INDEX "StudentAward_awardId_idx";

-- DropIndex
DROP INDEX "StudentAward_studentId_idx";

-- AlterTable
ALTER TABLE "StudentAward" DROP CONSTRAINT "StudentAward_pkey",
ADD CONSTRAINT "StudentAward_pkey" PRIMARY KEY ("awardId", "studentId");

-- AddForeignKey
ALTER TABLE "StudentAward" ADD CONSTRAINT "StudentAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
