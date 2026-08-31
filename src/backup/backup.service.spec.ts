import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BackupService } from './backup.service';

// Só a parte de arquivos (retenção e limpeza), que é a que apaga coisas do
// disco. Criar e restaurar backup dependem de Docker e ficam de fora.
describe('BackupService (arquivos de backup)', () => {
  const originalCwd = process.cwd();
  let backupDir: string;
  let workDir: string;
  let service: BackupService;

  beforeEach(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-service-'));
    backupDir = path.join(workDir, 'backup');
    fs.mkdirSync(backupDir);

    // O serviço resolve a pasta de backup a partir de process.cwd() ao ser
    // construído, então o diretório precisa ser trocado antes do `new`.
    process.chdir(workDir);
    service = new BackupService();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  const writeFile = (name: string) =>
    fs.writeFileSync(path.join(backupDir, name), 'conteúdo');

  describe('listBackupFiles', () => {
    it('lista do mais recente para o mais antigo, ignorando outros arquivos', () => {
      writeFile('backup-2026-07-05T05-00-00-000Z.zip');
      writeFile('backup-2026-07-19T05-00-00-000Z.zip');
      writeFile('backup-2026-07-12T05-00-00-000Z.zip');
      writeFile('anotacoes.txt');
      writeFile('backup-2026-07-26T05-00-00-000Z.zip.part');

      expect(service.listBackupFiles()).toEqual([
        'backup-2026-07-19T05-00-00-000Z.zip',
        'backup-2026-07-12T05-00-00-000Z.zip',
        'backup-2026-07-05T05-00-00-000Z.zip',
      ]);
    });
  });

  describe('pruneBackups', () => {
    it('apaga só o que passa do limite, mantendo os mais recentes', () => {
      writeFile('backup-2026-07-05T05-00-00-000Z.zip');
      writeFile('backup-2026-07-12T05-00-00-000Z.zip');
      writeFile('backup-2026-07-19T05-00-00-000Z.zip');
      writeFile('backup-2026-07-26T05-00-00-000Z.zip');

      expect(service.pruneBackups(2)).toEqual([
        'backup-2026-07-12T05-00-00-000Z.zip',
        'backup-2026-07-05T05-00-00-000Z.zip',
      ]);

      expect(service.listBackupFiles()).toEqual([
        'backup-2026-07-26T05-00-00-000Z.zip',
        'backup-2026-07-19T05-00-00-000Z.zip',
      ]);
    });

    it('nunca apaga o backup mais recente, mesmo com retenção zero', () => {
      writeFile('backup-2026-07-19T05-00-00-000Z.zip');
      writeFile('backup-2026-07-26T05-00-00-000Z.zip');

      expect(service.pruneBackups(0)).toEqual([
        'backup-2026-07-19T05-00-00-000Z.zip',
      ]);
      expect(service.listBackupFiles()).toEqual([
        'backup-2026-07-26T05-00-00-000Z.zip',
      ]);
    });
  });

  describe('cleanupUnfinishedBackups', () => {
    it('remove restos de compactação interrompida sem tocar nos backups íntegros', () => {
      writeFile('backup-2026-07-26T05-00-00-000Z.zip');
      writeFile('backup-2026-07-27T05-00-00-000Z.zip.part');

      service.cleanupUnfinishedBackups();

      expect(fs.readdirSync(backupDir)).toEqual([
        'backup-2026-07-26T05-00-00-000Z.zip',
      ]);
    });
  });
});
