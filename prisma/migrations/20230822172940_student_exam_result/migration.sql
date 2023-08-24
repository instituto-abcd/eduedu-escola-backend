/*
  Warnings:

  - The primary key for the `StudentExamResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `studentExamId` on the `StudentExamResult` table. All the data in the column will be lost.
  - Added the required column `examId` to the `StudentExamResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudentExamResult" DROP CONSTRAINT "StudentExamResult_studentId_fkey";

-- AlterTable
ALTER TABLE "StudentExamResult" DROP CONSTRAINT "StudentExamResult_pkey",
DROP COLUMN "studentExamId",
ADD COLUMN     "examId" TEXT NOT NULL,
ADD CONSTRAINT "StudentExamResult_pkey" PRIMARY KEY ("examId", "axisCode", "studentId");

ALTER TABLE "StudentExamResult" ADD COLUMN     "examDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "StudentExamResult" ADD CONSTRAINT "StudentExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
