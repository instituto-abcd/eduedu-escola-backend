import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

@Injectable()
export class BackupService {
  private readonly backupDir = path.join(__dirname, '..', '..', 'backup');
  private readonly pgUser = 'postgres';
  private readonly pgPassword = 'senhaS3creta';
  private readonly mongoUser = 'root';
  private readonly mongoPassword = 'senhaS3creta';

  async createBackup(): Promise<string> {
    this.ensureBackupDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.zip`;
    const backupFilePath = path.join(this.backupDir, backupFileName);

    const [pgBackupFile, mongoBackupFile] = await Promise.all([
      this.backupPostgres(timestamp),
      this.backupMongo(timestamp)
    ]);

    const mongoContainerName = this.findMongoContainerName();
    await Promise.all([
      this.copyBackupFromContainer('database', pgBackupFile),
      this.copyBackupFromContainer(mongoContainerName, mongoBackupFile)
    ]);

    await Promise.all([
      this.deleteBackupInContainer('database', pgBackupFile),
      this.deleteBackupInContainer(mongoContainerName, mongoBackupFile)
    ]);

    await this.zipBackupFiles([pgBackupFile, mongoBackupFile], backupFilePath);

    await Promise.all([
      this.deleteLocalBackupFile(pgBackupFile),
      this.deleteLocalBackupFile(mongoBackupFile)
    ]);

    return backupFileName;
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
    const mongoContainer = containers.find(container => container.includes('mongo'));
    if (!mongoContainer) {
      throw new Error('MongoDB container not found');
    }
    return mongoContainer;
  }

  private async copyBackupFromContainer(containerName: string, backupFile: string): Promise<void> {
    const copyCommand = `docker cp ${containerName}:${backupFile} ${this.backupDir}`;
    execSync(copyCommand);
  }

  private async deleteBackupInContainer(containerName: string, backupFile: string): Promise<void> {
    const deleteCommand = `docker exec ${containerName} rm ${backupFile}`;
    execSync(deleteCommand);
  }

  private async zipBackupFiles(files: string[], outputZipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputZip = fs.createWriteStream(outputZipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      outputZip.on('close', () => resolve());
      archive.on('error', err => reject(err));

      archive.pipe(outputZip);

      files.forEach(file => {
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
