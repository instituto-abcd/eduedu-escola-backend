-- CreateTable
CREATE TABLE "StudentPlanetResult" (
    "id" TEXT NOT NULL,
    "studentExamId" TEXT NOT NULL,
    "planetId" TEXT NOT NULL,
    "axisCode" TEXT NOT NULL,
    "stars" DECIMAL(65,30) NOT NULL,
    "lastExecution" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "StudentPlanetResult_pkey" PRIMARY KEY ("studentExamId","axisCode","studentId")
);

-- AddForeignKey
ALTER TABLE "StudentPlanetResult" ADD CONSTRAINT "StudentPlanetResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
