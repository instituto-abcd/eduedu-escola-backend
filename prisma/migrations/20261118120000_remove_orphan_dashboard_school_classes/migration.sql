-- Turmas excluidas continuavam aparecendo no dashboard (EEP-299). O dashboard guarda uma copia
-- de cada turma em "DashboardSchoolClass", com o mesmo id da "SchoolClass" mas sem chave
-- estrangeira entre as duas, e a exclusao da turma nao removia essa copia. Remove as copias
-- cuja turma nao existe mais (o desempenho primeiro, por causa da chave estrangeira); daqui em
-- diante o proprio app remove a copia ao excluir a turma.
DELETE FROM "DashboardPerformance" AS dp
WHERE NOT EXISTS (
    SELECT 1 FROM "SchoolClass" AS sc WHERE sc."id" = dp."dashboardSchoolClassId"
);

DELETE FROM "DashboardSchoolClass" AS dsc
WHERE NOT EXISTS (
    SELECT 1 FROM "SchoolClass" AS sc WHERE sc."id" = dsc."id"
);
