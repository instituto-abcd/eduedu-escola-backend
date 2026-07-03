<h1 align="center">EduEdu+ Backend</h1>

<p align="center">
  Backend da plataforma EduEdu+, um sistema de avaliação e acompanhamento de alfabetização para escolas brasileiras.
</p>

<p align="center">
  <a href="#sobre-o-projeto">Sobre</a> &bull;
  <a href="#tecnologias">Tecnologias</a> &bull;
  <a href="#arquitetura">Arquitetura</a> &bull;
  <a href="#pré-requisitos">Pré-requisitos</a> &bull;
  <a href="#instalação">Instalação</a> &bull;
  <a href="#estrutura-do-projeto">Estrutura</a> &bull;
  <a href="#banco-de-dados">Banco de Dados</a> &bull;
  <a href="#api">API</a> &bull;
  <a href="#testes">Testes</a> &bull;
  <a href="#deploy">Deploy</a> &bull;
  <a href="#contribuindo">Contribuindo</a> &bull;
  <a href="#licença">Licença</a>
</p>

---

## Sobre o Projeto

Inicialmente com foco em crianças com dislexia, o **EduEdu+** é uma plataforma educacional brasileira voltada para a avaliação e o acompanhamento da alfabetização. O sistema permite que professores apliquem avaliações diagnósticas, acompanhem o desempenho dos alunos em eixos de aprendizagem e integrem com "Planetas" que são agrupamentos de atividades educacionais.

### Funcionalidades Principais

- **Gestão escolar** &mdash; Cadastro de anos letivos, turmas, alunos e professores
- **Avaliações** &mdash; Provas que medem o desempenho em eixos de alfabetização
- **Eixos de aprendizagem** &mdash; Consciência Fonológica, Sistema de Escrita Alfabética e Leitura e Compreensão de Texto
- **Classificação de desempenho** &mdash; Classificação automática em "Muito abaixo", "Abaixo" e "Esperado" com limiares por série
- **Sincronização de Planetas** &mdash; Sincronização de pacotes de conteúdo "Planetas" de atividades educativas via filas assíncronas
- **Sincronização de Avaliações** &mdash; Sincronização de avaliações via filas assíncronas
- **Dashboard e relatórios** &mdash; Visualização agregada do desempenho por turma, série e escola
- **Sistema de conquistas** &mdash; Gamificação com badges para motivar os alunos
- **Notificações** &mdash; Sistema de notificações para diretores e professores
- **Auditoria** &mdash; Log de ações sensíveis para rastreabilidade

### Repositórios Relacionados

| Repositório                                                                  | Descrição                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------- |
| [eduedu-escola-setup](https://github.com/instituto-abcd/eduedu-escola-setup) | Pacote de instalação e orquestração (Docker)       |
| [eduedu-escola-admin](https://github.com/instituto-abcd/eduedu-escola-admin) | Interface administrativa (diretores e professores) |
| [eduedu-escola-aluno](https://github.com/instituto-abcd/eduedu-escola-aluno) | Interface do aluno                                 |

---

## Tecnologias

| Categoria           | Tecnologia                                                               |
| ------------------- | ------------------------------------------------------------------------ |
| Framework           | [NestJS](https://nestjs.com/) v9                                         |
| Linguagem           | TypeScript                                                               |
| Runtime             | Node.js 18                                                               |
| Banco Relacional    | PostgreSQL + [Prisma](https://www.prisma.io/) ORM                        |
| Banco de Documentos | MongoDB + [Mongoose](https://mongoosejs.com/)                            |
| Cache / Filas       | [Redis](https://redis.io/) + [Bull](https://github.com/OptimalBits/bull) |
| Autenticação        | JWT + Passport                                                           |
| Documentação API    | Swagger / OpenAPI                                                        |
| Containerização     | Docker + Docker Compose                                                  |
| CI/CD               | GitHub Actions + Google Cloud Run                                        |
| Logs                | Winston                                                                  |
| E-mail              | Nodemailer                                                               |

---

### Fluxo de Autenticação

- Autenticação via JWT com guards baseados em roles
- `DirectorAuthGuard` &mdash; endpoints exclusivos para diretores
- `TeacherAuthGuard` &mdash; endpoints para professores
- `SchoolMiddleware` &mdash; injeta o `schoolId` em todas as requisições

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) e Docker Compose
- [npm](https://www.npmjs.com/) 8+

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/instituto-abcd/eduedu-escola-backend.git
cd eduedu-escola-backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Aplicação
APP_VERSION=development

# PostgreSQL
DATABASE_URL=postgres://postgres:senhaS3creta@localhost:5432/eduedu

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_USER=root
MONGO_PASSWORD=senhaS3creta
DB_MONGO=eduedu-local

# Redis
REDIS_URL=localhost

# Servidor de assets
ASSETS=LOCAL
FILE_SERVER_URL=http://localhost:3000/assets-data
```

### 4. Inicie os containers dos bancos de dados

```bash
npm run containers
```

Isso sobe o PostgreSQL (porta 5432), MongoDB (porta 27017) e Redis (porta 6379) via Docker Compose.

### 5. Execute as migrações e seed

```bash
npm run migrations
```

O seed (`prisma/seed.ts`) cria automaticamente uma escola, configurações padrão, conquistas e, no ambiente `development`, cria usuários de teste:

| Perfil    | E-mail                | Senha      | Chave de Acesso |
| --------- | --------------------- | ---------- | --------------- |
| Diretor   | `diretor@email.com`   | `12345678` | `EDUEDU001`     |
| Professor | `professor@email.com` | `12345678` | `EDUEDU002`     |

### 6. Inicie o servidor

```bash
# Apenas o servidor (watch mode)
npm run start:dev

# Ou dev completo (containers + migrações + Prisma Studio + servidor)
npm run start:dev-full
```

O servidor estará disponível em `http://localhost:3000`.

---

## Estrutura do Projeto

```
src/
├── main.ts                    # Bootstrap da aplicação
├── app.module.ts              # Módulo raiz
│
├── auth/                      # Autenticação JWT e estratégias
├── user/                      # Gestão de usuários (diretores/professores)
├── student/                   # Gestão de alunos e desempenho
├── school-class/              # Gestão de turmas
├── school-year/               # Gestão de anos letivos
├── exam/                      # Avaliações (MongoDB)
├── planet/                    # Integração com plataforma Planet
├── planet-sync/               # Sincronização Planet via filas Bull
├── dashboard/                 # Agregação de dados para dashboards
├── report/                    # Relatórios de desempenho
├── awards/                    # Sistema de conquistas
├── notification/              # Sistema de notificações
├── settings/                  # Configurações da escola
├── audit/                     # Log de auditoria
├── access-key/                # Gestão de chaves de acesso
├── email/                     # Serviço de e-mail
├── logger/                    # Configuração Winston
├── lottie/                    # Assets de animações
│
├── common/                    # Código compartilhado
│   ├── constants.ts           # Constantes globais
│   ├── exceptions/            # EduException + dicionário de erros
│   ├── guard/                 # Guards de auditoria
│   ├── services/              # Serviços utilitários (bcrypt, datas)
│   ├── utils/                 # Funções auxiliares
│   └── pagination/            # DTOs de paginação
│
└── prisma/                    # Serviço Prisma (injeção NestJS)

prisma/
├── schema.prisma              # Schema do PostgreSQL
├── seed.ts                    # Dados iniciais
└── migrations/                # Histórico de migrações
```

### Padrão dos Módulos

Cada módulo de domínio segue a estrutura:

```
src/<modulo>/
├── <modulo>.module.ts         # Definição do módulo NestJS
├── <modulo>.controller.ts     # Endpoints HTTP
├── <modulo>.service.ts        # Lógica de negócio
├── dto/
│   ├── request/               # DTOs de entrada (validação)
│   └── response/              # DTOs de saída
├── schemas/                   # Schemas Mongoose (quando usa MongoDB)
└── enums/                     # Enums do domínio
```

---

## Banco de Dados

### PostgreSQL (Prisma)

Armazena dados relacionais da escola:

| Modelo                   | Descrição                              |
| ------------------------ | -------------------------------------- |
| `School`                 | Dados da escola                        |
| `SchoolYear`             | Anos letivos (DRAFT, ACTIVE, INACTIVE) |
| `SchoolClass`            | Turmas com série e período             |
| `Student`                | Dados dos alunos                       |
| `User`                   | Diretores e professores                |
| `Award` / `StudentAward` | Conquistas e badges                    |
| `Dashboard`              | Dados agregados para dashboards        |
| `Notification`           | Notificações do sistema                |
| `Audit`                  | Log de ações                           |
| `Settings`               | Configurações (SMTP, Planet, chaves)   |

**Enums principais:**

- `SchoolGradeEnum` &mdash; CHILDREN, FIRST_GRADE, SECOND_GRADE, THIRD_GRADE, FOURTH_GRADE, FIFTH_GRADE
- `SchoolPeriodEnum` &mdash; MORNING, AFTERNOON, FULL
- `StatusSchoolYear` &mdash; DRAFT, ACTIVE, INACTIVE
- `AxisEnum` &mdash; PHONOLOGICAL_AWARENESS, ALPHABETIC_WRITING_SYSTEM, READING_AND_TEXT_COMPREHENSION
- `Profile` &mdash; DIRECTOR, TEACHER

### MongoDB (Mongoose)

Armazena dados de avaliação e execuções de jogos:

- **Provas (Exams)** &mdash; Definição das avaliações diagnósticas
- **Resultados de provas** &mdash; Respostas e pontuações dos alunos
- **Execuções Planet** &mdash; Dados de progresso nos jogos educativos

### Redis

- **Cache** &mdash; Cache de dados frequentemente acessados
- **Filas Bull** &mdash; Processamento assíncrono de sincronização de planetas e provas

### Migrações

```bash
# Aplicar migrações pendentes
npm run migrations

# Resetar banco (apaga todos os dados)
npm run migrations:reset

# Gerar o client Prisma após alterações no schema
npx prisma generate
```

---

## API

### Documentação Swagger

Com o servidor rodando, acesse a documentação interativa em:

```
http://localhost:3000/swagger
```

A documentação Swagger inclui todos os endpoints, schemas de request/response e suporte a autenticação via Bearer token.

### Autenticação

Todos os endpoints (exceto login) requerem um token JWT no header:

```
Authorization: Bearer <token>
```

Para obter o token, faça login via `POST /auth/login` com as credenciais.

### Principais Endpoints

| Método | Rota            | Descrição                |
| ------ | --------------- | ------------------------ |
| `POST` | `/auth/login`   | Autenticação             |
| `GET`  | `/student`      | Listar alunos            |
| `POST` | `/student`      | Criar aluno              |
| `GET`  | `/school-class` | Listar turmas            |
| `POST` | `/school-class` | Criar turma              |
| `GET`  | `/school-year`  | Listar anos letivos      |
| `POST` | `/school-year`  | Criar ano letivo         |
| `GET`  | `/exam`         | Listar avaliações        |
| `GET`  | `/dashboard`    | Dados do dashboard       |
| `GET`  | `/report`       | Relatórios de desempenho |
| `GET`  | `/user`         | Listar usuários          |
| `POST` | `/user`         | Criar usuário            |

> Consulte o Swagger para a lista completa de endpoints e parâmetros.

---

## Scripts Disponíveis

| Comando                    | Descrição                                                       |
| -------------------------- | --------------------------------------------------------------- |
| `npm run start:dev`        | Inicia o servidor em modo watch                                 |
| `npm run start:dev-full`   | Dev completo: containers + migrações + Prisma Studio + servidor |
| `npm run start:prod`       | Inicia em modo produção                                         |
| `npm run build`            | Compila o TypeScript para JavaScript                            |
| `npm run containers`       | Sobe os containers Docker (PostgreSQL, MongoDB, Redis)          |
| `npm run migrations`       | Aplica migrações Prisma + seed                                  |
| `npm run migrations:reset` | Reseta o banco de dados (destrutivo)                            |
| `npm run lint`             | Executa ESLint com auto-fix                                     |
| `npm run format`           | Formata o código com Prettier                                   |
| `npm test`                 | Executa todos os testes                                         |
| `npm run test:watch`       | Testes em modo watch                                            |
| `npm run test:cov`         | Testes com relatório de cobertura                               |
| `npm run test:e2e`         | Testes end-to-end                                               |

---

## Testes

O projeto usa [Jest](https://jestjs.io/) como framework de testes.

```bash
# Rodar todos os testes
npm test

# Rodar um arquivo de teste específico
npx jest src/student/student.service.spec.ts

# Rodar testes que correspondem a um padrão
npx jest --testNamePattern="should create a student"

# Testes com cobertura
npm run test:cov

# Testes end-to-end
npm run test:e2e
```

---

## Deploy

### Docker

O projeto inclui um `Dockerfile` para build de produção:

```bash
docker build -t eduedu-backend .
docker run -p 3000:3000 --env-file .env eduedu-backend
```

### Docker Compose (desenvolvimento)

```bash
# Sobe apenas os bancos de dados
npm run containers

# Ou diretamente
docker compose up -d
```

### Google Cloud Run

O projeto possui workflows do GitHub Actions configurados para deploy automatizado:

- **Push em `main`** &mdash; Deploy para o ambiente de produção no Cloud Run
- **Push em `staging`** &mdash; Deploy para o ambiente de staging
- **Workflow manual** &mdash; Deploy para o registro open-source

As migrações Prisma são executadas automaticamente durante o deploy.

---

## Variáveis de Ambiente

| Variável          | Descrição                         | Exemplo                             |
| ----------------- | --------------------------------- | ----------------------------------- |
| `APP_VERSION`     | Identificador do ambiente         | `development`                       |
| `DATABASE_URL`    | Connection string PostgreSQL      | `postgres://user:pass@host:5432/db` |
| `MONGO_URI`       | URI do MongoDB                    | `mongodb://localhost:27017`         |
| `MONGO_USER`      | Usuário do MongoDB                | `root`                              |
| `MONGO_PASSWORD`  | Senha do MongoDB                  | `senhaS3creta`                      |
| `DB_MONGO`        | Nome do banco MongoDB             | `eduedu-local`                      |
| `REDIS_URL`       | Host do Redis                     | `localhost`                         |
| `ASSETS`          | Modo de assets (`LOCAL` ou `GCS`) | `LOCAL`                             |
| `FILE_SERVER_URL` | URL do servidor de arquivos       | `http://localhost:3000/assets-data` |

---

## Contribuindo

Contribuições s&#227;o bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Faça commit das suas alterações (`git commit -m 'feat: descrição da feature'`)
4. Faça push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

### Diretrizes

- Siga o padrão de módulos existente ao criar novos domínios
- Mantenha as mensagens de erro em português (veja `src/common/exceptions/`)
- Escreva testes para novas funcionalidades
- Use os DTOs de request/response para validação e tipagem
- Execute `npm run lint` antes de enviar seu PR

---

## Licença

Este projeto é mantido pelo [Instituto ABCD](https://www.institutoabcd.org.br/).

Consulte o arquivo [LICENSE](LICENSE.md) para mais detalhes.
