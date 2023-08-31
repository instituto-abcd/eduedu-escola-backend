/*
  Warnings:

  - You are about to drop the column `percentage` on the `DashboardPerformance` table. All the data in the column will be lost.
  - Added the required column `result` to the `DashboardPerformance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DashboardPerformance" DROP COLUMN "percentage",
ADD COLUMN     "result" DECIMAL(65,30) NOT NULL;
