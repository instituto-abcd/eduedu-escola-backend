# Liberar Planetas em Lote — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir liberar planetas para vários alunos de uma vez, a partir da listagem de alunos do portal Admin.

**Architecture:** Novo endpoint bulk `PUT /student/release-planets` com `{ ids: string[] }` no backend NestJS, espelhando o padrão existente de `POST /student/authorize-new-exam`. Validação fail-all (aluno sem prova → 404, nada é salvo). No frontend, botão em lote na listagem de alunos, reusando o padrão de seleção por checkbox já existente.

**Tech Stack:** NestJS 9 + Mongoose (backend), React 18 + Mantine v6 + TanStack Query v4 (admin).

**Spec:** `docs/superpowers/specs/2026-07-02-release-planets-bulk-design.md`

## Global Constraints

- Branch nova a partir de `development` em ambos os repos: `feat/liberar-planetas-em-lote`.
- Backend: repo principal tem WIP não commitado na branch `EEP-515` (inclusive `src/student/student.service.ts`) — trabalhar em **git worktree** para não misturar.
- Commits em português, formato convencional (`feat: ...`, `test: ...`, `docs: ...`). **Sem** `Co-Authored-By` e **sem** menções a Claude/geração automática em commits e PRs.
- PRs abertos para `development`, corpo seguindo `PULL_REQUEST_TEMPLATE.md` (Descrição / Como testar? / Capturas de tela / Checklist).
- Endpoint single `PUT /student/:id/release-planets` e botão da página de detalhes permanecem com comportamento inalterado.
- Erro: `ids` vazio → `EduException('IDS_REQUIRED')`; qualquer aluno sem prova (`lastExam: true`) → `EduException('EXAM_NOT_FOUND')` sem salvar nada.

---

### Task 1: Worktree do backend a partir de development

**Files:** nenhum arquivo de código — setup de workspace.

**Interfaces:**
- Produces: worktree em `../eduedu-escola-backend-lote` na branch `feat/liberar-planetas-em-lote`, com dependências instaladas. Todas as tasks 2–5 rodam dentro desse worktree.

- [ ] **Step 1: Criar worktree**

```bash
cd "/c/Users/danil/OneDrive/Área de Trabalho/IABCD/eduedu-escola-backend"
git fetch origin development
git worktree add -b feat/liberar-planetas-em-lote "../eduedu-escola-backend-lote" origin/development
```

Expected: `Preparing worktree (new branch 'feat/liberar-planetas-em-lote')`.

- [ ] **Step 2: Instalar dependências no worktree**

```bash
cd "/c/Users/danil/OneDrive/Área de Trabalho/IABCD/eduedu-escola-backend-lote"
npm install
```

Expected: instalação sem erro fatal (warnings ok).

- [ ] **Step 3: Sanidade — jest roda**

```bash
npx jest --listTests
```

Expected: sai sem erro (lista pode ser vazia — não há specs unitários hoje).

### Task 2: DTOs de request e response (backend)

**Files:**
- Create: `src/student/dto/request/release-planets-request.dto.ts`
- Create: `src/student/dto/request/release-planets-response.dto.ts`
  (response no diretório `request/` para espelhar `authorize-new-exam-response.dto.ts`, que vive lá)

**Interfaces:**
- Produces: `ReleasePlanetsRequestDto { ids: string[] }` e `ReleasePlanetsResponseDto { success: boolean }` — consumidos pelas tasks 3 e 4.

- [ ] **Step 1: Criar `release-planets-request.dto.ts`**

```ts
import { ApiProperty } from '@nestjs/swagger';

export class ReleasePlanetsRequestDto {
  @ApiProperty({
    description: 'IDs dos Estudantes',
    example: [
      '4d63086b-5b83-418b-bb28-761e5accb978',
      'e57136f7-9df1-4644-b9a7-bfddfd799c77',
      '274f258c-cf3b-4bbc-b0cf-48a12f95657f',
    ],
  })
  ids: string[];
}
```

- [ ] **Step 2: Criar `release-planets-response.dto.ts`**

```ts
import { ApiProperty } from '@nestjs/swagger';

export class ReleasePlanetsResponseDto {
  @ApiProperty({
    description: 'Planetas liberados para os Estudantes',
    example: true,
  })
  success: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/student/dto/request/release-planets-request.dto.ts src/student/dto/request/release-planets-response.dto.ts
git commit -m "feat: adiciona DTOs de liberação de planetas em lote"
```

### Task 3: Service `releasePlanetsBulk` com TDD (backend)

**Files:**
- Test: `src/student/student.service.spec.ts` (novo — não existe spec unitário no repo)
- Modify: `src/student/student.service.ts` (método `releasePlanets` em ~linha 1082; adicionar `releasePlanetsBulk` e helper `applyPlanetRelease`)

**Interfaces:**
- Consumes: `ReleasePlanetsRequestDto`, `ReleasePlanetsResponseDto` (Task 2); `EduException` já importada no service.
- Produces: `releasePlanetsBulk(requestDto: ReleasePlanetsRequestDto): Promise<ReleasePlanetsResponseDto>` no `StudentService` — consumido pela Task 4.

- [ ] **Step 1: Escrever teste que falha**

Criar `src/student/student.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AwardsService } from '../awards/awards.service';
import { StudentAwardService } from './studentAward.service';
import { StudentExamService } from './studentExam.service';
import { StudentPlanetExecutionService } from './studentPlanetExecution.service';
import { StorageService } from '../planet-sync/storage.service';
import { ExamStorageService } from '../exam/exam-storage.service';
import { Exam } from '../exam/schemas/exam.schema';
import { StudentExam, Planet } from './schemas/studentExam.schema';
import { EduException } from '../common/exceptions/edu-school.exception';

function makeStudentExam(studentId: string) {
  const future = new Date();
  future.setDate(future.getDate() + 10);

  return {
    studentId,
    planetTrack: [
      { order: 1, availableAt: new Date('2000-01-01') },
      { order: 2, availableAt: new Date(future) },
      { order: 3, availableAt: new Date(future) },
      { order: 4, availableAt: new Date(future) },
    ],
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('StudentService - releasePlanetsBulk', () => {
  let service: StudentService;
  const studentExamModel = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: PrismaService, useValue: {} },
        { provide: DashboardService, useValue: {} },
        { provide: AwardsService, useValue: {} },
        { provide: StudentAwardService, useValue: {} },
        { provide: StudentExamService, useValue: {} },
        { provide: StudentPlanetExecutionService, useValue: {} },
        { provide: getModelToken(Exam.name), useValue: {} },
        { provide: getModelToken(StudentExam.name), useValue: studentExamModel },
        { provide: getModelToken(Planet.name), useValue: {} },
        { provide: StorageService, useValue: {} },
        { provide: ExamStorageService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(StudentService);
  });

  it('libera planetas para todos os alunos informados', async () => {
    const examA = makeStudentExam('aluno-a');
    const examB = makeStudentExam('aluno-b');
    studentExamModel.find.mockResolvedValue([examA, examB]);

    const result = await service.releasePlanetsBulk({
      ids: ['aluno-a', 'aluno-b'],
    });

    expect(result).toEqual({ success: true });
    expect(studentExamModel.find).toHaveBeenCalledWith({
      studentId: { $in: ['aluno-a', 'aluno-b'] },
      lastExam: true,
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const exam of [examA, examB]) {
      expect(exam.save).toHaveBeenCalledTimes(1);
      // 2 planetas liberados hoje, o seguinte amanhã
      expect(exam.planetTrack[1].availableAt).toEqual(today);
      expect(exam.planetTrack[2].availableAt).toEqual(today);
      expect(exam.planetTrack[3].availableAt).toEqual(tomorrow);
      // planeta já disponível permanece intacto
      expect(exam.planetTrack[0].availableAt).toEqual(new Date('2000-01-01'));
    }
  });

  it('lança IDS_REQUIRED quando ids está vazio', async () => {
    await expect(service.releasePlanetsBulk({ ids: [] })).rejects.toThrow(
      EduException,
    );
    expect(studentExamModel.find).not.toHaveBeenCalled();
  });

  it('lança EXAM_NOT_FOUND e não salva nada quando algum aluno não tem prova', async () => {
    const examA = makeStudentExam('aluno-a');
    studentExamModel.find.mockResolvedValue([examA]);

    await expect(
      service.releasePlanetsBulk({ ids: ['aluno-a', 'aluno-b'] }),
    ).rejects.toThrow('Prova não encontrada.');

    expect(examA.save).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/student/student.service.spec.ts
```

Expected: FAIL — `service.releasePlanetsBulk is not a function` (ou erro de compilação por método inexistente).

- [ ] **Step 3: Implementar no `student.service.ts`**

Adicionar imports no topo (junto aos DTOs existentes):

```ts
import { ReleasePlanetsRequestDto } from './dto/request/release-planets-request.dto';
import { ReleasePlanetsResponseDto } from './dto/request/release-planets-response.dto';
```

Substituir o método `releasePlanets` existente (~linha 1082) e adicionar os novos, mantendo o comportamento single idêntico:

```ts
  async releasePlanets(studentId: string): Promise<any> {
    // Obtém studentexam com a execução de prova atual
    const studentExam = await this.studentExamModel.findOne({
      studentId: studentId,
      lastExam: true,
    });

    this.applyPlanetRelease(studentExam);

    await studentExam.save();
  }

  async releasePlanetsBulk(
    requestDto: ReleasePlanetsRequestDto,
  ): Promise<ReleasePlanetsResponseDto> {
    const { ids } = requestDto;

    if (!ids || ids.length === 0) {
      throw new EduException('IDS_REQUIRED');
    }

    const studentExams = await this.studentExamModel.find({
      studentId: { $in: ids },
      lastExam: true,
    });

    // Fail-all: se algum aluno não tem prova atual, nada é liberado
    const foundIds = new Set(studentExams.map((exam) => exam.studentId));
    if (ids.some((id) => !foundIds.has(id))) {
      throw new EduException('EXAM_NOT_FOUND');
    }

    for (const studentExam of studentExams) {
      this.applyPlanetRelease(studentExam);
      await studentExam.save();
    }

    return { success: true };
  }

  private applyPlanetRelease(studentExam: StudentExamDocument): void {
    let counter = 1;
    const nextAvaiableDate = new Date();
    nextAvaiableDate.setUTCHours(0, 0, 0, 0);

    studentExam.planetTrack
      .filter((item) => item.availableAt > new Date())
      .forEach((item) => {
        item.availableAt = new Date(nextAvaiableDate.toISOString());

        if (counter == 2) {
          // 2 = quantidade de planetas que está sendo liberada
          nextAvaiableDate.setDate(nextAvaiableDate.getDate() + 1);
          counter = 1;
        } else {
          counter++;
        }
      });

    studentExam.planetTrack = studentExam.planetTrack.sort(
      (a, b) => a.order - b.order,
    );
  }
```

Nota: o tipo do parâmetro em `applyPlanetRelease` é `StudentExamDocument`, já importado no service. No teste, o mock é estruturalmente compatível — se o TS reclamar do mock no spec, tipar o retorno de `makeStudentExam` como `any`.

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx jest src/student/student.service.spec.ts
```

Expected: PASS — 3 testes verdes.

- [ ] **Step 5: Commit**

```bash
git add src/student/student.service.ts src/student/student.service.spec.ts
git commit -m "feat: adiciona liberação de planetas em lote no service de aluno"
```

### Task 4: Endpoint no controller (backend)

**Files:**
- Modify: `src/student/student.controller.ts` (inserir novo endpoint antes do `@Put('/:id/release-planets')`, ~linha 279)

**Interfaces:**
- Consumes: `StudentService.releasePlanetsBulk(requestDto)` (Task 3), DTOs (Task 2). `JwtAuthGuard`, `ApiBearerAuth`, `ApiOkResponse`, `UseGuards`, `Body` já importados no controller (usados por `authorize-new-exam`).
- Produces: `PUT /student/release-planets` com body `{ ids: string[] }`.

- [ ] **Step 1: Adicionar imports dos DTOs**

Junto aos imports de `AuthorizeNewExam*` (~linhas 50-51):

```ts
import { ReleasePlanetsRequestDto } from './dto/request/release-planets-request.dto';
import { ReleasePlanetsResponseDto } from './dto/request/release-planets-response.dto';
```

- [ ] **Step 2: Adicionar endpoint antes de `@Put('/:id/release-planets')`**

```ts
  @Put('release-planets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Marca planetas como disponíveis na trilha de vários alunos',
    description:
      'A operação é realizada manualmente no portal Admin, na listagem de alunos',
  })
  @ApiOkResponse({ type: ReleasePlanetsResponseDto })
  async releasePlanetsBulk(
    @Body() requestDto: ReleasePlanetsRequestDto,
  ): Promise<ReleasePlanetsResponseDto> {
    return this.studentService.releasePlanetsBulk(requestDto);
  }
```

- [ ] **Step 3: Build e testes**

```bash
npm run build && npx jest src/student/student.service.spec.ts
```

Expected: build sem erro; 3 testes PASS.

- [ ] **Step 4: Commit**

```bash
git add src/student/student.controller.ts
git commit -m "feat: adiciona endpoint de liberação de planetas em lote"
```

### Task 5: Docs, push e PR (backend)

**Files:**
- Create (no worktree): `docs/superpowers/specs/2026-07-02-release-planets-bulk-design.md` (copiar do repo principal, commit `2c2042d` da branch `EEP-515`)
- Create (no worktree): `docs/superpowers/plans/2026-07-02-liberar-planetas-em-lote.md` (este arquivo)

**Interfaces:**
- Produces: PR do backend aberto para `development`.

- [ ] **Step 1: Copiar spec e plano para o worktree e commitar**

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp "/c/Users/danil/OneDrive/Área de Trabalho/IABCD/eduedu-escola-backend/docs/superpowers/specs/2026-07-02-release-planets-bulk-design.md" docs/superpowers/specs/
cp "/c/Users/danil/OneDrive/Área de Trabalho/IABCD/eduedu-escola-backend/docs/superpowers/plans/2026-07-02-liberar-planetas-em-lote.md" docs/superpowers/plans/
git add docs/superpowers
git commit -m "docs: adiciona spec e plano de liberação de planetas em lote"
```

- [ ] **Step 2: Push**

```bash
git push -u origin feat/liberar-planetas-em-lote
```

- [ ] **Step 3: Abrir PR para development com gh**

Título: `feat: permite liberar planetas para múltiplos alunos`
Base: `development`. Corpo seguindo o template do repo (sem menções a geração automática):

```markdown
# Descrição

Adiciona o endpoint `PUT /student/release-planets` que recebe `{ ids: string[] }` e libera planetas na trilha de vários alunos de uma vez, espelhando o padrão já existente de `POST /student/authorize-new-exam`. A lógica de liberação (2 planetas por dia) foi extraída para um helper privado reutilizado pelo endpoint single `PUT /student/:id/release-planets`, que permanece com comportamento inalterado.

Validação fail-all: se qualquer aluno informado não possuir prova atual (`lastExam: true`), a operação inteira falha com `EXAM_NOT_FOUND` (404) e nenhum planeta é liberado.

Complementa o PR correspondente no eduedu-escola-admin, que adiciona o botão em lote na listagem de alunos.

# Como testar?

1. `npm run containers && npm run start:dev`
2. Autenticar no Swagger (`/swagger`) e chamar `PUT /student/release-planets` com body `{ "ids": ["<id1>", "<id2>"] }` de alunos com prova realizada — planetas futuros das trilhas ficam disponíveis (2 por dia).
3. Incluir um id de aluno sem prova — resposta 404 `Prova não encontrada.` e nenhuma trilha é alterada.
4. Testes unitários: `npx jest src/student/student.service.spec.ts`

# Capturas de tela:

N/A (endpoint de API).

# Checklist:

- [x] Meu código segue as diretrizes de estilo deste projeto
- [x] Fiz uma auto-revisão do meu próprio código
- [x] Comentei meu código, especialmente em áreas difíceis de entender
- [x] Fiz as alterações correspondentes na documentação
- [x] Adicionei testes que comprovem que minha correção é eficaz ou que meu recurso funciona
- [x] Novos e existentes testes unitários passam localmente com minhas alterações
```

```bash
gh pr create --base development --title "feat: permite liberar planetas para múltiplos alunos" --body-file <arquivo-com-corpo-acima>
```

### Task 6: Branch do admin a partir de development

**Files:** nenhum — setup.

**Interfaces:**
- Produces: branch `feat/liberar-planetas-em-lote` no repo `eduedu-escola-admin`, baseada em `origin/development`. Tasks 7–8 rodam nela.

- [ ] **Step 1: Criar branch**

O repo admin só tem arquivos untracked (CLAUDE.md, LEAKED_SECRETS.md, docs/) — checkout direto é seguro; não commitar esses arquivos.

```bash
cd "/c/Users/danil/OneDrive/Área de Trabalho/IABCD/eduedu-escola-admin"
git fetch origin development
git checkout -b feat/liberar-planetas-em-lote origin/development
```

Expected: `Switched to a new branch 'feat/liberar-planetas-em-lote'`.

- [ ] **Step 2: Dependências**

```bash
npm install
```

Expected: sem erro fatal (repo usa npm, não pnpm).

### Task 7: API layer do admin — hook bulk

**Files:**
- Modify: `src/api/student.ts` (URL ~linha 62, classe `StudentAPI` ~linha 147, hooks ~linha 334)

**Interfaces:**
- Consumes: endpoint `PUT /student/release-planets` (Task 4).
- Produces: `usePutReleasePlanetsBulk(options?: MutationOptions<string[], { success: boolean }>)` — consumido pela Task 8. Handler recebe `ids: string[]`.

- [ ] **Step 1: Adicionar URL**

No objeto `URL` (após `RELEASE_PLANETS`, linha 62):

```ts
  RELEASE_PLANETS_BULK: "/student/release-planets",
```

- [ ] **Step 2: Adicionar método estático na classe `StudentAPI`**

Após `putReleasePlanets` (~linha 150):

```ts
  static async putReleasePlanetsBulk(ids: string[]) {
    const { data } = await this.api.put<{ success: boolean }>(
      URL.RELEASE_PLANETS_BULK,
      { ids }
    );
    return data;
  }
```

- [ ] **Step 3: Adicionar hook no fim do arquivo (após `usePutReleasePlanets`)**

```ts
export function usePutReleasePlanetsBulk(
  options?: MutationOptions<string[], { success: boolean }>
) {
  const queryClient = useQueryClient();

  const handler = useCallback(function (ids: string[]) {
    return StudentAPI.putReleasePlanetsBulk(ids);
  }, []);

  return useMutation(handler, {
    ...options,
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries([KEY.ALL]);
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}
```

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: zero warnings (threshold do projeto é zero).

- [ ] **Step 5: Commit**

```bash
git add src/api/student.ts
git commit -m "feat: adiciona hook de liberação de planetas em lote"
```

### Task 8: Botão em lote na listagem de alunos + PR (admin)

**Files:**
- Modify: `src/pages/Students/List/Students.tsx` (import ~linha 16, hooks ~linha 51, modais ~linha 76, botões ~linha 126)

**Interfaces:**
- Consumes: `usePutReleasePlanetsBulk` (Task 7); `selected: string[]`, `setSelected`, `modals.openConfirmModal`, `successNotification`, `errorNotification` já presentes no arquivo.
- Produces: botão "Liberar Mais Planetas" visível quando há alunos selecionados.

- [ ] **Step 1: Atualizar import do hook (linha 16)**

```ts
import {
	useAuthorizeNewExam,
	usePutReleasePlanetsBulk,
	useStudentGetAll,
} from "~/api/student";
```

- [ ] **Step 2: Adicionar mutation após `authorizeNewExam` (~linha 62)**

```ts
	const { mutate: releasePlanets } = usePutReleasePlanetsBulk({
		onSuccess: () => {
			successNotification(
				"Operação realizada com sucesso",
				"Planetas liberados para os alunos selecionados!",
			);
			setSelected([]);
		},
		onError: (error) => {
			errorNotification("Erro durante a operação", `${error.message}`);
		},
	});
```

- [ ] **Step 3: Adicionar modal de confirmação após `openModalAuthorizeNewExam` (~linha 93)**

```ts
	const openModalReleasePlanets = () => {
		modals.openConfirmModal({
			title: "Liberar Mais Planetas",
			children: (
				<>
					<Text size="sm">
						Deseja liberar mais planetas para o(s) aluno(s) selecionado(s)?
					</Text>
					<Divider mt={20} />
				</>
			),
			labels: { confirm: "Sim", cancel: "Não" },
			onConfirm: () => {
				releasePlanets(selected);
			},
		});
	};
```

- [ ] **Step 4: Adicionar botão no grupo de ações em lote, após "Autorizar Nova Prova" (~linha 133)**

```tsx
					<Button
						size="xs"
						color="blue.0"
						style={{ color: theme.colors.blue[6] }}
						onClick={openModalReleasePlanets}
					>
						Liberar Mais Planetas
					</Button>
```

- [ ] **Step 5: Lint e build**

```bash
npm run lint && npm run build
```

Expected: lint zero warnings; build Vite sem erro.

- [ ] **Step 6: Commit e push**

```bash
git add src/pages/Students/List/Students.tsx
git commit -m "feat: adiciona botão de liberar planetas em lote na listagem de alunos"
git push -u origin feat/liberar-planetas-em-lote
```

- [ ] **Step 7: Abrir PR para development**

Título: `feat: permite liberar planetas para múltiplos alunos`
Base: `development`. Corpo:

```markdown
# Descrição

Adiciona o botão "Liberar Mais Planetas" às ações em lote da listagem de alunos, ao lado de "Autorizar Nova Prova". Ao selecionar alunos via checkbox e confirmar no modal, a liberação é feita de uma vez através do novo endpoint `PUT /student/release-planets` do backend.

Depende do PR correspondente no eduedu-escola-backend, que adiciona o endpoint em lote.

# Como testar?

1. Subir o backend com o PR correspondente e `npm run dev` neste repo.
2. Acessar Alunos, selecionar um ou mais alunos com prova realizada via checkbox.
3. Clicar em "Liberar Mais Planetas" e confirmar — notificação de sucesso e planetas futuros das trilhas liberados (2 por dia).
4. Incluir na seleção um aluno sem prova — notificação de erro "Prova não encontrada." e nenhum aluno é alterado (seleção mantida).

# Capturas de tela:

(anexar captura da listagem com o botão visível após seleção)

# Checklist:

- [x] Meu código segue as diretrizes de estilo deste projeto
- [x] Fiz uma auto-revisão do meu próprio código
- [x] Comentei meu código, especialmente em áreas difíceis de entender
- [x] Fiz as alterações correspondentes na documentação
- [ ] Adicionei testes que comprovem que minha correção é eficaz ou que meu recurso funciona (repo admin não possui infraestrutura de testes; cobertura no backend)
- [x] Novos e existentes testes unitários passam localmente com minhas alterações
```

```bash
gh pr create --base development --title "feat: permite liberar planetas para múltiplos alunos" --body-file <arquivo-com-corpo-acima>
```
