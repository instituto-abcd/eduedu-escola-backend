/*
  Warnings:

  - The primary key for the `StudentPlanetResult` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "StudentPlanetResult" DROP CONSTRAINT "StudentPlanetResult_pkey",
ADD CONSTRAINT "StudentPlanetResult_pkey" PRIMARY KEY ("studentExamId", "planetId", "studentId");
