-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Profile" AS ENUM ('DIRECTOR', 'TEACHER');

-- CreateEnum
CREATE TYPE "SchoolGradeEnum" AS ENUM ('CHILDREN', 'FIRST_GRADE', 'SECOND_GRADE', 'THIRD_GRADE');

-- CreateEnum
CREATE TYPE "SchoolPeriodEnum" AS ENUM ('MORNING', 'AFTERNOON', 'FULL');

-- CreateEnum
CREATE TYPE "StatusSchoolYear" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "AxisEnum" AS ENUM ('PHONOLOGICAL_AWARENESS', 'ALPHABETIC_WRITING_SYSTEM', 'READING_AND_TEXT_COMPREHENSION');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolGrade" "SchoolGradeEnum" NOT NULL,
    "schoolPeriod" "SchoolPeriodEnum" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "schoolId" TEXT,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolYear" (
    "id" TEXT NOT NULL,
    "name" INTEGER NOT NULL,
    "status" "StatusSchoolYear" NOT NULL DEFAULT 'DRAFT',
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registry" TEXT NOT NULL DEFAULT '',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "owner" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "password" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "profile" "Profile" NOT NULL DEFAULT 'TEACHER',
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSchoolClass" (
    "userId" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,

    CONSTRAINT "UserSchoolClass_pkey" PRIMARY KEY ("userId","schoolClassId")
);

-- CreateTable
CREATE TABLE "SchoolClassStudent" (
    "schoolClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "SchoolClassStudent_pkey" PRIMARY KEY ("schoolClassId","studentId")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "synchronizationPlanets" BOOLEAN NOT NULL,
    "smtpHostName" TEXT NOT NULL,
    "smtpUserName" TEXT NOT NULL,
    "smtpPassword" TEXT NOT NULL,
    "sslIsActive" BOOLEAN NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "schoolYear" INTEGER NOT NULL,
    "teachersCounter" INTEGER NOT NULL,
    "schoolClassesCounter" INTEGER NOT NULL,
    "studentsCounter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSchoolGrade" (
    "id" TEXT NOT NULL,
    "name" "SchoolGradeEnum" NOT NULL,
    "teachersCounter" INTEGER NOT NULL,
    "schoolClassesCounter" INTEGER NOT NULL,
    "studentsCounter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dashboardId" TEXT NOT NULL,

    CONSTRAINT "DashboardSchoolGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSchoolClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studentsCounter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dashboardGradeId" TEXT NOT NULL,

    CONSTRAINT "DashboardSchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardPerformance" (
    "id" TEXT NOT NULL,
    "axis" TEXT NOT NULL,
    "percentage" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dashboardSchoolClassId" TEXT NOT NULL,
    "dashboardSchoolGradeId" TEXT,

    CONSTRAINT "DashboardPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_accessKey_key" ON "User"("accessKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_document_key" ON "User"("document");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_token_key" ON "AuthToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_schoolId_key" ON "Settings"("schoolId");

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolYear" ADD CONSTRAINT "SchoolYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchoolClass" ADD CONSTRAINT "UserSchoolClass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSchoolClass" ADD CONSTRAINT "UserSchoolClass_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClassStudent" ADD CONSTRAINT "SchoolClassStudent_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClassStudent" ADD CONSTRAINT "SchoolClassStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSchoolGrade" ADD CONSTRAINT "DashboardSchoolGrade_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSchoolClass" ADD CONSTRAINT "DashboardSchoolClass_dashboardGradeId_fkey" FOREIGN KEY ("dashboardGradeId") REFERENCES "DashboardSchoolGrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardPerformance" ADD CONSTRAINT "DashboardPerformance_dashboardSchoolClassId_fkey" FOREIGN KEY ("dashboardSchoolClassId") REFERENCES "DashboardSchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardPerformance" ADD CONSTRAINT "DashboardPerformance_dashboardSchoolGradeId_fkey" FOREIGN KEY ("dashboardSchoolGradeId") REFERENCES "DashboardSchoolGrade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
