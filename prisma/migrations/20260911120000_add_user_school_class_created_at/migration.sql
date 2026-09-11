-- AlterTable
ALTER TABLE "UserSchoolClass" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: vinculos que ja existiam nao tem data de vinculo registrada. Usa a data de
-- criacao da conta do professor, que era o criterio de ordenacao anterior, para que a
-- senha de entrada das turmas ja existentes continue sendo a mesma apos a atualizacao.
UPDATE "UserSchoolClass" AS usc
SET "createdAt" = u."createdAt"
FROM "User" AS u
WHERE u."id" = usc."userId";
