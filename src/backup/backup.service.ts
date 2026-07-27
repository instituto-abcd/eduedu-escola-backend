import { BadRequestException, Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as archiver from 'archiver';
import * as unzipper from 'unzipper';

type CopyBlock = { columns: string; body: string };
type RemapType = 'school' | 'user';

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(process.cwd(), 'backup');
  private readonly pgUser = 'postgres';
  private readonly pgPassword = 'senhaS3creta';
  private readonly mongoUser = 'root';
  private readonly mongoPassword = 'senhaS3creta';

  // Tabelas preservadas: School/Settings/_prisma_migrations nunca são tocadas,
  // e de User só as linhas com owner=true são mantidas (o restante é
  // truncado e recarregado do backup, junto com todas as demais tabelas).
  private readonly PRESERVED_TABLES = [
    'School',
    'Settings',
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

    const [pgBackupFile, mongoBackupFile] = await Promise.all([
      this.backupPostgres(timestamp),
      this.backupMongo(timestamp),
    ]);

    const mongoContainerName = this.findMongoContainerName();
    await Promise.all([
      this.copyBackupFromContainer('database', pgBackupFile),
      this.copyBackupFromContainer(mongoContainerName, mongoBackupFile),
    ]);

    await Promise.all([
      this.deleteBackupInContainer('database', pgBackupFile),
      this.deleteBackupInContainer(mongoContainerName, mongoBackupFile),
    ]);

    await this.zipBackupFiles([pgBackupFile, mongoBackupFile], backupFilePath);

    await Promise.all([
      this.deleteLocalBackupFile(pgBackupFile),
      this.deleteLocalBackupFile(mongoBackupFile),
    ]);

    return backupFileName;
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

      const mongoContainerName = this.findMongoContainerName();
      const containerMongoPath = `/tmp/${path.basename(mongoPath)}`;

      const restoreScriptPath = await this.buildPostgresRestoreScript(
        sqlPath,
        extractDir,
      );
      const containerScriptPath = `/tmp/${path.basename(restoreScriptPath)}`;

      await Promise.all([
        this.copyBackupToContainer(
          'database',
          restoreScriptPath,
          containerScriptPath,
        ),
        this.copyBackupToContainer(
          mongoContainerName,
          mongoPath,
          containerMongoPath,
        ),
      ]);

      try {
        this.restorePostgres(containerScriptPath);
        this.restoreMongo(mongoContainerName, containerMongoPath);
      } finally {
        await Promise.all([
          this.deleteBackupInContainer('database', containerScriptPath),
          this.deleteBackupInContainer(mongoContainerName, containerMongoPath),
        ]);
      }

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
  private queryScalar(sql: string): string {
    const escapedSql = sql.replace(/"/g, '\\"');
    const command = `docker exec -e PGPASSWORD=${this.pgPassword} database psql -U ${this.pgUser} -d ${this.pgUser} -t -A -c "${escapedSql}"`;
    return execSync(command).toString().trim();
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

  private async copyBackupToContainer(
    containerName: string,
    localPath: string,
    containerPath: string,
  ): Promise<void> {
    const copyCommand = `docker cp "${localPath}" ${containerName}:${containerPath}`;
    execSync(copyCommand);
  }

  private restorePostgres(containerScriptPath: string): void {
    const restoreCommand = `docker exec -e PGPASSWORD=${this.pgPassword} database psql -U ${this.pgUser} -d ${this.pgUser} -v ON_ERROR_STOP=1 -f ${containerScriptPath}`;
    execSync(restoreCommand);
  }

  // --nsExclude ignora a collection de assets já baixados: os arquivos em
  // si não fazem parte do backup, então restaurar essas referências só
  // faria a aplicação pensar que já tem algo que precisa ressincronizar.
  private restoreMongo(
    mongoContainerName: string,
    containerMongoPath: string,
  ): void {
    const restoreCommand = `docker exec -e MONGO_INITDB_ROOT_PASSWORD=${this.mongoPassword} ${mongoContainerName} mongorestore --archive=${containerMongoPath} --gzip --drop --nsExclude="*.downloaded-files" --username=${this.mongoUser} --password=${this.mongoPassword}`;
    execSync(restoreCommand);
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir);
    }
  }

  private async backupPostgres(timestamp: string): Promise<string> {
    const pgBackupFile = `/tmp/pg-backup-${timestamp}.sql`;
    const pgDumpCommand = `docker exec -e PGPASSWORD=${this.pgPassword} database pg_dump -U ${this.pgUser} -f ${pgBackupFile}`;
    execSync(pgDumpCommand);
    return pgBackupFile;
  }

  private async backupMongo(timestamp: string): Promise<string> {
    const mongoContainerName = this.findMongoContainerName();
    const mongoBackupFile = `/tmp/mongo-backup-${timestamp}.gz`;
    const mongoDumpCommand = `docker exec -e MONGO_INITDB_ROOT_PASSWORD=${this.mongoPassword} ${mongoContainerName} mongodump --username=${this.mongoUser} --password=${this.mongoPassword} --archive=${mongoBackupFile} --gzip`;
    execSync(mongoDumpCommand);
    return mongoBackupFile;
  }

  private findMongoContainerName(): string {
    const containerListCommand = `docker ps --format "{{.Names}}"`;
    const containers = execSync(containerListCommand).toString().split('\n');
    const mongoContainer = containers.find((container) =>
      container.includes('mongo'),
    );
    if (!mongoContainer) {
      throw new Error('MongoDB container not found');
    }
    return mongoContainer;
  }

  private async copyBackupFromContainer(
    containerName: string,
    backupFile: string,
  ): Promise<void> {
    const copyCommand = `docker cp ${containerName}:${backupFile} "${this.backupDir}"`;
    execSync(copyCommand);
  }

  private async deleteBackupInContainer(
    containerName: string,
    backupFile: string,
  ): Promise<void> {
    const deleteCommand = `docker exec ${containerName} rm ${backupFile}`;
    execSync(deleteCommand);
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

      files.forEach((file) => {
        const fileName = path.basename(file);
        archive.file(path.join(this.backupDir, fileName), { name: fileName });
      });

      archive.finalize();
    });
  }

  private async deleteLocalBackupFile(file: string): Promise<void> {
    const filePath = path.join(this.backupDir, path.basename(file));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
