# Liberar planetas em lote (múltiplos alunos)

**Data:** 2026-07-02
**Repos afetados:** `eduedu-escola-backend`, `eduedu-escola-admin`

## Objetivo

Hoje o admin libera planetas ("Liberar mais planetas") para um aluno por vez, na página de detalhes do aluno (`PUT /student/:id/release-planets`). O objetivo é permitir a liberação para vários alunos de uma vez, a partir da listagem de alunos, espelhando o padrão já existente de "Autorizar Nova Prova" (`POST /student/authorize-new-exam` com `{ ids: string[] }`).

## Backend (`eduedu-escola-backend`)

### 1. DTO de request

Novo arquivo `src/student/dto/request/release-planets-request.dto.ts`:

```ts
export class ReleasePlanetsRequestDto {
  ids: string[];
}
```

Espelho de `AuthorizeNewExamRequestDto` (mesmas decorações de validação/Swagger usadas lá).

### 2. Controller (`src/student/student.controller.ts`)

Novo endpoint:

- `@Put('release-planets')` com `@ApiBearerAuth()` e `@UseGuards(JwtAuthGuard)` (igual `authorize-new-exam`).
- Body: `ReleasePlanetsRequestDto`.
- Chama `studentService.releasePlanetsBulk(dto)`.

Sem conflito de rota: `PUT /student/release-planets` (1 segmento) ≠ `PUT /student/:id/release-planets` (2 segmentos).

O endpoint antigo `PUT /student/:id/release-planets` permanece intocado — continua atendendo o botão da página de detalhes do aluno.

### 3. Service (`src/student/student.service.ts`)

Novo método `releasePlanetsBulk(dto: ReleasePlanetsRequestDto)`:

1. `ids` ausente ou vazio → `EduException('IDS_REQUIRED')` (código já existente).
2. Busca todas as provas atuais de uma vez: `studentExamModel.find({ studentId: { $in: ids }, lastExam: true })`.
3. **Validação fail-all antes de qualquer escrita:** se algum id não tiver prova correspondente → `EduException('EXAM_NOT_FOUND')` ("Prova não encontrada.", 404). Nenhum documento é salvo.
4. Para cada prova, aplica a lógica de liberação e salva.

**Refatoração:** a lógica de liberação existente em `releasePlanets` (reset de `availableAt` para planetas futuros, liberando 2 planetas por dia, e reordenação por `order`) é extraída para um helper privado (ex.: `applyPlanetRelease(studentExam)`), reusado tanto pelo método single quanto pelo bulk. O comportamento do endpoint single não muda.

## Frontend (`eduedu-escola-admin`)

### 4. API (`src/api/student.ts`)

- Nova URL: `RELEASE_PLANETS_BULK: "/student/release-planets"`.
- Novo método estático: `putReleasePlanetsBulk(ids: string[])` → `PUT` com body `{ ids }`.
- Novo hook: `usePutReleasePlanetsBulk`, invalidando `KEY.ALL` no sucesso (mesmo padrão de `useAuthorizeNewExam`).

### 5. Listagem de alunos (`src/pages/Students/List/Students.tsx`)

- Novo botão "Liberar Mais Planetas" no grupo de ações em lote (visível quando `selected.length > 0`), ao lado de "Autorizar Nova Prova", com o mesmo estilo.
- Clique abre `modals.openConfirmModal` de confirmação (mesmo padrão do modal de autorizar prova).
- Confirmação chama o hook com `selected`.
- Sucesso: notificação de sucesso + `setSelected([])`.
- Erro: `errorNotification` com a mensagem do backend; seleção mantida para o usuário corrigir.

## Fluxo de erro (decisão: fail-all)

Se qualquer aluno selecionado não tiver prova realizada (sem trilha de planetas), a operação inteira falha com 404 "Prova não encontrada." e nenhum planeta é liberado para nenhum aluno. A seleção na tela é mantida.

## Testes

Teste de service no backend (`student.service.spec.ts` ou arquivo dedicado):

1. Bulk feliz: N alunos com prova → todos os `planetTrack` atualizados e salvos.
2. `ids` vazio → `IDS_REQUIRED`.
3. Um dos alunos sem prova → `EXAM_NOT_FOUND` e nenhum `save()` chamado.

## Fora de escopo

- Alterar o comportamento/quantidade de planetas liberados por dia (mantém 2/dia).
- Alterar o endpoint ou botão single da página de detalhes.
- Feedback parcial (lista de alunos que falharam) — descartado em favor do fail-all.
