import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EduException } from '../common/exceptions/edu-school.exception';
import { Settings } from '../settings/dto/settings.entity';

@Injectable()
export class AccessKeyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSettingsBySchoolId(): Promise<Pick<Settings, 'accessKey'>> {
    const settings = await this.prismaService.settings.findFirst();

    if (!settings) {
      throw new EduException('SETTINGS_NOT_FOUND');
    }

    return {
      accessKey: settings.accessKey,
    };
  }
}
