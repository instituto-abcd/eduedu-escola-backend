import { Controller, Post } from '@nestjs/common';
import { ContentSyncService } from './content-sync.service';

@Controller('content-sync')
export class ContentSyncController {
  constructor(private readonly contentSyncService: ContentSyncService) {}

  @Post('sync-all')
  create() {
    return this.contentSyncService.syncAll();
  }
}
