import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as archiver from 'archiver';
import * as unzipper from 'unzipper';
import { MONGO_DATABASE } from '../config/mongo';

type CopyBlock = { columns: string; body: string };

type PostgresTarget = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};
type RemapType = 'school' | 'user';

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(process.cwd(), 'backup');

  // Postgres e Mongo sao alcancados pela REDE, com os clientes rodando
  // dentro deste container — nao com `docker exec` num container vizinho.
  //
  // A versao anterior chamava `docker exec ... database pg_dump`, o que
  // custava tres coisas: o nome do container ('database') virava parte do
  // codigo, o backend precisava do CLI do Docker e do socket do host
  // (montar /var/run/docker.sock da controle total do daemon a quem
  // comprometer o backend), e usuario/senha/banco ficavam hardcoded.
  //
  // Lendo de DATABASE_URL e MONGO_URI nada disso e preciso: sao as mesmas
  // variaveis que a aplicacao ja usa para funcionar, entao backup e
  // aplicacao nunca podem divergir de banco.
  // Lidas sob demanda, e nao em inicializador de campo: uma variavel ausente
  // derrubaria a CONSTRUCAO do provider, e com ela a subida da aplicacao
  // inteira — alem de quebrar os testes que apenas instanciam o service. Uma
  // configuracao de backup incompleta deve fazer o backup falhar, nao o
  // sistema.
  private pgTarget?: PostgresTarget;
  private mongoUriWithoutDatabase?: string;

  private get pg(): PostgresTarget {
    if (!this.pgTarget) {
      this.pgTarget = BackupService.parsePostgresUrl(process.env.DATABASE_URL);
    }

    return this.pgTarget;
  }

  // A conexao vem do MONGO_URI, mas o BANCO vem de MONGO_DATABASE: o
  // Mongoose passa `dbName` explicito, entao o caminho do MONGO_URI e
  // ignorado pela aplicacao. No setup o MONGO_URI aponta para /eduedu, que
  // esta vazio, enquanto os dados vivem em 'eduedu-escola-admin' — dumpar o
  // banco do caminho geraria um zip vazio sem erro nenhum.
  private get mongoConnectionUri(): string {
    if (!this.mongoUriWithoutDatabase) {
      this.mongoUriWithoutDatabase = BackupService.stripDatabase(
        BackupService.requireEnv('MONGO_URI', process.env.MONGO_URI),
      );
    }

    return this.mongoUriWithoutDatabase;
  }

  private readonly mongoDatabase = MONGO_DATABASE;

  // Tabelas preservadas: School/Settings/BackupSchedule/_prisma_migrations
  // nunca são tocadas, e de User só as linhas com owner=true são mantidas (o
  // restante é truncado e recarregado do backup, junto com todas as demais
  // tabelas). BackupSchedule fica de fora porque o agendamento e a data do
  // último backup são estado desta instalação: restaurar os valores que
  // vinham no zip faria a máquina achar que já rodou (ou que está em atraso)
  // em relação a um backup de outro computador.
  private readonly PRESERVED_TABLES = [
    'School',
    'Settings',
    'BackupSchedule',
    'User',
    '_prisma_migrations',
  ];

  // O pg_dump em texto puro ordena os blocos COPY alfabeticamente, não por
  // dependência de FK. Como as tabelas não são recriadas (as constraints
  // continuam ativas o tempo todo), os dados precisam ser recarregados
  // nessa ordem para as referências existirem antes de quem as usa.
  // Tabelas não listadas aqui (ex: criadas em migrações futuras) são
  // recarregadas por último, na ordem em que aparecem no dump.
  private readonly RESTORE_ORDER = [
    'SchoolYear',
    'SchoolClass',
    'Student',
    'Award',
    'Dashboard',
    'DashboardSchoolGrade',
    'DashboardSchoolClass',
    'DashboardPerformance',
    'Notification',
    'StudentExamResult',
    'StudentPlanetResult',
    'StudentAward',
    'SchoolClassStudent',
    'UserSchoolClass',
    'AuthToken',
    'UserNotification',
    'Audit',
  ];

  // Colunas que referenciam School/User e precisam ser remapeadas para os
  // IDs atuais (escola e diretor owner desta instalação) em vez dos IDs
  // originais do backup — isso é o que permite restaurar um backup tirado
  // em outra instalação/escola sem violar foreign key.
  private readonly COLUMN_REMAPS: Record<string, Record<string, RemapType>> = {
    SchoolYear: { schoolId: 'school' },
    SchoolClass: { schoolId: 'school' },
    User: { id: 'user', schoolId: 'school' },
    UserSchoolClass: { userId: 'user' },
    AuthToken: { userId: 'user' },
    UserNotification: { userId: 'user' },
    Audit: { userId: 'user' },
  };

  async createBackup(): Promise<string> {
    this.ensureBackupDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.zip`;
    const backupFilePath = path.join(this.backupDir, backupFileName);

    // Os dumps intermediarios ficam numa pasta temporaria do SO, e nao em
    // `backupDir`: `backupDir` e a pasta que o usuario ve (e que no setup e
    // um volume), e uma falha no meio do processo deixaria sobras ali.
    const workDir = fs.mkdtempSync(
      path.join(os.tmpdir(), BackupService.WORK_TMP_PREFIX),
    );

    try {
      const [pgBackupFile, mongoBackupFile] = await Promise.all([
        this.backupPostgres(workDir, timestamp),
        this.backupMongo(workDir, timestamp),
      ]);

      // O zip é montado com um nome temporário e só ganha o nome final depois
      // de fechado. Sem isso, uma máquina desligada no meio da compactação
      // deixaria um `backup-*.zip` truncado na pasta, indistinguível de um
      // backup íntegro — justamente o arquivo que alguém tentaria restaurar.
      const unfinishedFilePath = `${backupFilePath}${BackupService.UNFINISHED_SUFFIX}`;
      await this.zipBackupFiles(
        [pgBackupFile, mongoBackupFile],
        unfinishedFilePath,
      );
      fs.renameSync(unfinishedFilePath, backupFilePath);

      return backupFileName;
    } finally {
      this.removeDirectory(workDir);
    }
  }

  private static readonly UNFINISHED_SUFFIX = '.part';
  private static readonly WORK_TMP_PREFIX = 'eduedu-backup-';
  private static readonly BACKUP_FILE_PATTERN = /^backup-.+\.zip$/;

  // Nomes dos backups existentes, do mais recente para o mais antigo. A
  // ordenação é pelo nome porque o timestamp faz parte dele (ISO 8601), o
  // que evita depender de mtime — em pasta sincronizada (OneDrive) ou depois
  // de uma cópia manual, mtime não corresponde à data do backup.
  listBackupFiles(): string[] {
    this.ensureBackupDirectory();

    return fs
      .readdirSync(this.backupDir)
      .filter((fileName) => BackupService.BACKUP_FILE_PATTERN.test(fileName))
      .sort()
      .reverse();
  }

  // Apaga os zips que passam do limite de retenção e devolve o que foi
  // removido. O disco dessas máquinas é pequeno e ninguém acompanha a pasta,
  // então sem isso um backup semanal enche a máquina sozinho.
  pruneBackups(keep: number): string[] {
    const removable = this.listBackupFiles().slice(Math.max(keep, 1));

    return removable.filter((fileName) => {
      try {
        fs.unlinkSync(path.join(this.backupDir, fileName));
        return true;
      } catch (error) {
        console.warn(`Não foi possível remover o backup ${fileName}:`, error);
        return false;
      }
    });
  }

  // Resolve um nome de arquivo vindo da request para um caminho dentro de
  // `backupDir`. Recusa qualquer coisa que nao case com o padrao dos
  // backups: sem isso, um `..%2F..%2Fetc%2Fpasswd` no parametro viraria
  // leitura de arquivo arbitrario do container.
  resolveBackupFile(fileName: string): string {
    if (!BackupService.BACKUP_FILE_PATTERN.test(fileName)) {
      throw new BadRequestException('Nome de arquivo de backup inválido');
    }

    const filePath = path.join(this.backupDir, fileName);

    // Cinto e suspensorio: mesmo com o padrao validado, o caminho final tem
    // de continuar dentro de backupDir.
    const dir = path.resolve(this.backupDir);
    if (path.dirname(path.resolve(filePath)) !== dir) {
      throw new BadRequestException('Nome de arquivo de backup inválido');
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Arquivo de backup não encontrado');
    }

    return filePath;
  }

  // Restos de compactações interrompidas (ver `createBackup`). Chamado na
  // inicialização, quando é certo que nenhuma compactação está em curso.
  cleanupUnfinishedBackups(): void {
    this.ensureBackupDirectory();

    for (const fileName of fs.readdirSync(this.backupDir)) {
      if (!fileName.endsWith(BackupService.UNFINISHED_SUFFIX)) continue;

      try {
        fs.unlinkSync(path.join(this.backupDir, fileName));
      } catch (error) {
        console.warn(`Não foi possível remover ${fileName}:`, error);
      }
    }
  }

  // Prefixo das pastas de extração temporária do restore, sempre criadas
  // fora da pasta do backup (ver `restoreBackup`).
  private readonly RESTORE_TMP_PREFIX = 'eduedu-restore-';

  async restoreBackup(
    file: Express.Multer.File,
  ): Promise<{ success: boolean }> {
    this.ensureBackupDirectory();
    this.cleanupStaleRestoreDirectories();

    // A pasta de extração fica na pasta temporária do SO, e não dentro de
    // `backupDir` — este repositório roda dentro de uma pasta sincronizada
    // pelo OneDrive, que pode reter/"ressuscitar" um arquivo recém-escrito
    // enquanto ainda está fazendo upload dele, mesmo depois de um rmSync
    // bem-sucedido. Fora da árvore sincronizada esse problema não existe.
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extractDir = path.join(
      os.tmpdir(),
      `${this.RESTORE_TMP_PREFIX}${timestamp}`,
    );
    fs.mkdirSync(extractDir);

    try {
      const { sqlPath, mongoPath } = await this.extractBackupZip(
        file.buffer,
        extractDir,
      );

      const restoreScriptPath = await this.buildPostgresRestoreScript(
        sqlPath,
        extractDir,
      );

      // Sem `docker cp`: os clientes rodam aqui e leem os arquivos desta
      // pasta direto, entao nao existe copia de ida nem faxina de volta.
      this.restorePostgres(restoreScriptPath);
      this.restoreMongo(mongoPath);

      return { success: true };
    } finally {
      this.removeDirectory(extractDir);
    }
  }

  // Nunca deixa uma falha ao limpar a pasta temporária mascarar o
  // resultado real do restore (sucesso ou erro) — só registra o aviso.
  private removeDirectory(dir: string): void {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Não foi possível remover ${dir} agora:`, error);
    }
  }

  // Varre a pasta temporária do SO por sobras de tentativas de restore
  // anteriores (ex.: processo encerrado no meio de uma restauração).
  private cleanupStaleRestoreDirectories(): void {
    for (const entry of fs.readdirSync(os.tmpdir())) {
      if (entry.startsWith(this.RESTORE_TMP_PREFIX)) {
        this.removeDirectory(path.join(os.tmpdir(), entry));
      }
    }
  }

  // Monta um único script SQL que: trunca todas as tabelas restauráveis
  // (todas exceto School/Settings/_prisma_migrations), gera IDs novos para
  // School/User referenciados no backup remapeando-os para a escola e o
  // diretor owner ATUAIS desta instalação, descarta as linhas owner=true
  // de User (o owner atual nunca é sobrescrito), e recarrega o restante a
  // partir do dump — tudo dentro de uma única transação (BEGIN/COMMIT)
  // para ser tudo-ou-nada.
  private async buildPostgresRestoreScript(
    sqlPath: string,
    extractDir: string,
  ): Promise<string> {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const blocks = this.parseCopyBlocks(sql);

    const userBlock = blocks.get('User');
    const schoolBlock = blocks.get('School');
    if (!userBlock || !schoolBlock) {
      throw new BadRequestException(
        'Arquivo de backup inválido: dados de School ou User não encontrados',
      );
    }

    const currentSchoolId = this.queryScalar(
      'SELECT id FROM "School" LIMIT 1;',
    );
    const currentOwnerId = this.queryScalar(
      'SELECT id FROM "User" WHERE owner = true LIMIT 1;',
    );

    if (!currentSchoolId || !currentOwnerId) {
      throw new Error(
        'Não foi possível localizar a escola ou o diretor owner atuais para restaurar o backup',
      );
    }

    const backupSchoolId = this.firstFieldValue(schoolBlock, 'id');
    if (!backupSchoolId) {
      throw new BadRequestException(
        'Arquivo de backup inválido: registro da escola não encontrado',
      );
    }

    const schoolIdMap = new Map([[backupSchoolId, currentSchoolId]]);
    const userIdMap = this.buildUserIdMap(userBlock, currentOwnerId);

    const otherTableNames = Array.from(blocks.keys()).filter(
      (name) => !this.PRESERVED_TABLES.includes(name),
    );

    const truncateStatements = otherTableNames
      .map((name) => `TRUNCATE TABLE "${name}" CASCADE;`)
      .join('\n');

    const orderedOtherTableNames = [...otherTableNames].sort((a, b) => {
      const rankA = this.RESTORE_ORDER.indexOf(a);
      const rankB = this.RESTORE_ORDER.indexOf(b);
      return (
        (rankA === -1 ? this.RESTORE_ORDER.length : rankA) -
        (rankB === -1 ? this.RESTORE_ORDER.length : rankB)
      );
    });

    const remappedUser = this.remapRows(
      'User',
      userBlock,
      schoolIdMap,
      userIdMap,
    );

    const otherCopyBlocks = orderedOtherTableNames
      .map((name) => {
        const remapped = this.remapRows(
          name,
          blocks.get(name),
          schoolIdMap,
          userIdMap,
        );
        return this.formatCopyBlock(name, remapped.columns, remapped.body);
      })
      .join('\n\n');

    const script = `
BEGIN;

${truncateStatements}

DELETE FROM "User" WHERE owner = false;

${this.formatCopyBlock('User', remappedUser.columns, remappedUser.body)}

${otherCopyBlocks}

COMMIT;
`;

    const scriptPath = path.join(extractDir, 'restore-final.sql');
    fs.writeFileSync(scriptPath, script);
    return scriptPath;
  }

  // Roda uma consulta somente-leitura no Postgres do container e retorna o
  // primeiro valor da primeira linha (ex.: id da escola/owner atuais).
  // `execFileSync` com lista de argumentos, e nao `execSync` com string: o
  // SQL vai como argumento e nao passa por shell nenhum, o que dispensa o
  // escape manual de aspas que a versao anterior fazia a mao.
  private queryScalar(sql: string): string {
    return this.runPsql(['-t', '-A', '-c', sql]);
  }

  // Constrói o mapa id-antigo -> id-novo para a tabela User: a linha
  // owner=true do backup aponta para o owner ATUAL da instalação (nunca é
  // recriada); as demais linhas recebem IDs novos gerados agora.
  private buildUserIdMap(
    userBlock: CopyBlock,
    currentOwnerId: string,
  ): Map<string, string> {
    const map = new Map<string, string>();
    if (userBlock.body.length === 0) return map;

    const columnNames = this.parseColumnNames(userBlock.columns);
    const idIndex = columnNames.indexOf('id');
    const ownerIndex = columnNames.indexOf('owner');

    for (const line of userBlock.body.split('\n')) {
      const fields = line.split('\t');
      const isOwner = fields[ownerIndex] === 't';
      map.set(fields[idIndex], isOwner ? currentOwnerId : randomUUID());
    }

    return map;
  }

  private parseColumnNames(columns: string): string[] {
    return columns
      .split(',')
      .map((column) => column.trim().replace(/^"|"$/g, ''));
  }

  // Valor do campo `columnName` na primeira linha do corpo de um bloco.
  private firstFieldValue(block: CopyBlock, columnName: string): string {
    if (block.body.length === 0) return '';
    const columnNames = this.parseColumnNames(block.columns);
    const firstLine = block.body.split('\n')[0];
    return firstLine.split('\t')[columnNames.indexOf(columnName)];
  }

  // Reescreve as colunas de School/User configuradas em COLUMN_REMAPS
  // usando os mapas id-antigo -> id-novo, e — só para a tabela User —
  // descarta as linhas owner=true (o owner atual nunca é sobrescrito).
  // `\N` (marcador de NULL do COPY) nunca é remapeado.
  private remapRows(
    tableName: string,
    block: CopyBlock,
    schoolIdMap: Map<string, string>,
    userIdMap: Map<string, string>,
  ): CopyBlock {
    const remapConfig = this.COLUMN_REMAPS[tableName];
    if (!remapConfig || block.body.length === 0) return block;

    const columnNames = this.parseColumnNames(block.columns);
    const remapTargets = Object.entries(remapConfig).map(([column, type]) => ({
      index: columnNames.indexOf(column),
      map: type === 'school' ? schoolIdMap : userIdMap,
    }));
    const ownerIndex = tableName === 'User' ? columnNames.indexOf('owner') : -1;

    const rewrittenLines = block.body
      .split('\n')
      .filter(
        (line) => ownerIndex === -1 || line.split('\t')[ownerIndex] !== 't',
      )
      .map((line) => {
        const fields = line.split('\t');
        for (const { index, map } of remapTargets) {
          const rawValue = fields[index];
          if (rawValue === '\\N') continue;

          const newValue = map.get(rawValue);
          if (newValue === undefined) {
            throw new BadRequestException(
              `Arquivo de backup inválido: referência não encontrada ao restaurar a tabela "${tableName}"`,
            );
          }
          fields[index] = newValue;
        }
        return fields.join('\t');
      });

    return { columns: block.columns, body: rewrittenLines.join('\n') };
  }

  // Extrai cada bloco `COPY public."Tabela" (...) FROM stdin; ... \.` do
  // dump em texto puro gerado pelo pg_dump, indexado pelo nome da tabela.
  // Tabelas sem nenhuma linha não têm a quebra de linha extra antes do
  // `\.` (o terminador vem logo após o cabeçalho), por isso o corpo é
  // capturado sem exigir essa quebra e o `\n` final é removido depois.
  private parseCopyBlocks(sql: string): Map<string, CopyBlock> {
    const blocks = new Map<string, CopyBlock>();
    const regex =
      /COPY public\."(\w+)" \(([^)]*)\) FROM stdin;\r?\n([\s\S]*?)\\\.\r?\n/g;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(sql)) !== null) {
      const [, tableName, columns, rawBody] = match;
      const body = rawBody.replace(/\r?\n$/, '');
      blocks.set(tableName, { columns, body });
    }

    return blocks;
  }

  // Remonta um bloco COPY, omitindo a linha de dados quando o corpo está
  // vazio (senão uma linha em branco seria lida como uma linha de dados).
  private formatCopyBlock(
    tableName: string,
    columns: string,
    body: string,
  ): string {
    const dataSection = body.length > 0 ? `${body}\n` : '';
    return `COPY public."${tableName}" (${columns}) FROM stdin;\n${dataSection}\\.`;
  }

  private async extractBackupZip(
    buffer: Buffer,
    extractDir: string,
  ): Promise<{ sqlPath: string; mongoPath: string }> {
    const directory = await unzipper.Open.buffer(buffer);

    const sqlEntry = directory.files.find((entry) =>
      entry.path.endsWith('.sql'),
    );
    const mongoEntry = directory.files.find((entry) =>
      entry.path.endsWith('.gz'),
    );

    if (!sqlEntry || !mongoEntry) {
      throw new BadRequestException(
        'Arquivo de backup inválido: dump do PostgreSQL ou do MongoDB não encontrado no .zip',
      );
    }

    const sqlPath = path.join(extractDir, path.basename(sqlEntry.path));
    const mongoPath = path.join(extractDir, path.basename(mongoEntry.path));

    await Promise.all([
      sqlEntry.buffer().then((buf) => fs.writeFileSync(sqlPath, buf)),
      mongoEntry.buffer().then((buf) => fs.writeFileSync(mongoPath, buf)),
    ]);

    return { sqlPath, mongoPath };
  }


  private restorePostgres(scriptPath: string): void {
    this.runPsql(['-v', 'ON_ERROR_STOP=1', '-f', scriptPath]);
  }

  // --nsExclude ignora a collection de assets já baixados: os arquivos em
  // si não fazem parte do backup, então restaurar essas referências só
  // faria a aplicação pensar que já tem algo que precisa ressincronizar.
  // --nsInclude limita o restore ao banco da aplicacao. Sem ele, um zip
  // gerado por uma versao anterior (que dumpava todos os bancos) seria
  // restaurado com --drop sobre `admin`, derrubando os usuarios do Mongo.
  private restoreMongo(archivePath: string): void {
    execFileSync('mongorestore', [
      `--uri=${this.mongoConnectionUri}`,
      `--archive=${archivePath}`,
      '--gzip',
      '--drop',
      `--nsInclude=${this.mongoDatabase}.*`,
      '--nsExclude=*.downloaded-files',
    ]);
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir);
    }
  }

  private async backupPostgres(
    workDir: string,
    timestamp: string,
  ): Promise<string> {
    const pgBackupFile = path.join(workDir, `pg-backup-${timestamp}.sql`);

    // Formato texto puro de proposito: `buildPostgresRestoreScript` reescreve
    // os blocos COPY do dump para remapear School/User, o que só é possível
    // com SQL legível. Trocar por -F c quebraria o restore.
    this.runPgDump(['-f', pgBackupFile]);

    return pgBackupFile;
  }

  private async backupMongo(
    workDir: string,
    timestamp: string,
  ): Promise<string> {
    const mongoBackupFile = path.join(workDir, `mongo-backup-${timestamp}.gz`);

    // --db explicito. A versao anterior chamava mongodump sem --db, o que
    // levava `admin` para dentro do zip — e como o restore usa --drop,
    // restaurar um backup podia derrubar os usuarios do proprio Mongo.
    execFileSync('mongodump', [
      `--uri=${this.mongoConnectionUri}`,
      `--db=${this.mongoDatabase}`,
      `--archive=${mongoBackupFile}`,
      '--gzip',
    ]);

    return mongoBackupFile;
  }




  private async zipBackupFiles(
    files: string[],
    outputZipPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputZip = fs.createWriteStream(outputZipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      outputZip.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(outputZip);

      // Os caminhos chegam prontos (pasta temporaria de trabalho); antes
      // eram remontados sobre `backupDir`, porque os dumps passavam por ali
      // via `docker cp`.
      files.forEach((file) => {
        archive.file(file, { name: path.basename(file) });
      });

      archive.finalize();
    });
  }

  // ---------------------- acesso aos bancos ----------------------

  private runPgDump(args: string[]): string {
    return this.runPgClient('pg_dump', args);
  }

  private runPsql(args: string[]): string {
    return this.runPgClient('psql', args);
  }

  private runPgClient(bin: string, args: string[]): string {
    const output = execFileSync(
      bin,
      [
        '-h',
        this.pg.host,
        '-p',
        this.pg.port,
        '-U',
        this.pg.user,
        '-d',
        this.pg.database,
        ...args,
      ],
      // A senha vai por variavel de ambiente, nunca na linha de comando:
      // argumentos aparecem para qualquer processo que liste a tabela de
      // processos do container.
      { env: { ...process.env, PGPASSWORD: this.pg.password } },
    );

    return output.toString().trim();
  }

  // ---------------------- leitura do ambiente ----------------------

  // Remove o banco do caminho do URI, mantendo host, credenciais e query
  // (authSource inclusive). mongodump recusa --db quando o URI ja traz um
  // banco no caminho, e e --db que decide o que entra no backup.
  private static stripDatabase(uri: string): string {
    const url = new URL(uri);
    url.pathname = '/';

    return url.toString();
  }

  private static requireEnv(name: string, value?: string): string {
    if (!value) {
      throw new Error(
        `${name} não está definida: o backup não tem como saber a que banco se conectar.`,
      );
    }

    return value;
  }

  // Host, porta, usuario, senha e banco saem da mesma URL que o Prisma usa,
  // e nao de constantes: e o que garante que o dump saia do banco em que a
  // aplicacao escreve. Com o valor hardcoded, uma instalacao com outro nome
  // de banco gerava um dump vazio sem erro nenhum.
  private static parsePostgresUrl(rawUrl?: string): PostgresTarget {
    const url = new URL(BackupService.requireEnv('DATABASE_URL', rawUrl));
    const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

    if (!database) {
      throw new Error(
        'DATABASE_URL não indica um banco de dados: o backup não sabe o que copiar.',
      );
    }

    return {
      host: url.hostname,
      port: url.port || '5432',
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  }
}
