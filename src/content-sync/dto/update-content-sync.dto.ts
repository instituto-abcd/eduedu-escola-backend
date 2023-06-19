import { PartialType } from '@nestjs/swagger';
import { CreateContentSyncDto } from './create-content-sync.dto';

export class UpdateContentSyncDto extends PartialType(CreateContentSyncDto) {}
