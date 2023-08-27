/*
  Warnings:

  - The primary key for the `StudentExamResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `examId` on the `StudentExamResult` table. All the data in the column will be lost.
  - Added the required column `studentExamId` to the `StudentExamResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StudentExamResult" DROP CONSTRAINT "StudentExamResult_pkey",
DROP COLUMN "examId",
ADD COLUMN     "studentExamId" TEXT NOT NULL,
ADD CONSTRAINT "StudentExamResult_pkey" PRIMARY KEY ("studentExamId", "axisCode", "studentId");
