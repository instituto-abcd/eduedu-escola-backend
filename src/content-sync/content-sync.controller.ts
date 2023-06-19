import { Controller, Post } from '@nestjs/common';
import { ContentSyncService } from './content-sync.service';

@Controller('content-sync')
export class ContentSyncController {
  constructor(private readonly contentSyncService: ContentSyncService) {}

  @Post()
  sync() {
    return this.contentSyncService.sync();
  }

  @Post('sync-all')
  syncAll() {
    return this.contentSyncService.syncAll();
  }
}
