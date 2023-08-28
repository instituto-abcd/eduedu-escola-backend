/*
  Warnings:

  - A unique constraint covering the columns `[name,schoolYearId,schoolGrade,schoolPeriod]` on the table `SchoolClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,name,registry]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_name_schoolYearId_schoolGrade_schoolPeriod_key" ON "SchoolClass"("name", "schoolYearId", "schoolGrade", "schoolPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "Student_id_name_registry_key" ON "Student"("id", "name", "registry");
