import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { Settings } from './dto/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings';
import { SchoolId } from '../common/school-id.decorator';
import { UpdateSchoolNameDto } from './dto/update-school-name';

@ApiTags('Settings')
@Controller('system-configuration')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obter configurações da escola' })
  @ApiResponse({
    status: 200,
    description: 'Configurações encontradas',
    type: Settings,
  })
  async getSettingsById(@SchoolId() schoolId: string): Promise<Settings> {
    return this.settingsService.getSettingsBySchoolId(schoolId);
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar configurações da escola' })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso',
    type: Settings,
  })
  async updateSettings(
    @SchoolId() schoolId: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ): Promise<Settings> {
    return this.settingsService.updateSettings(schoolId, updateSettingsDto);
  }

  @Put('school/name')
  @ApiOperation({ summary: 'Atualizar nome da escola' })
  @ApiResponse({
    status: 200,
    description: 'Nome da escola atualizado com sucesso',
    type: Settings,
  })
  async updateSchoolName(
    @SchoolId() schoolId: string,
    @Body() updateSchoolNameDto: UpdateSchoolNameDto,
  ): Promise<Settings> {
    return this.settingsService.updateSchoolName(schoolId, updateSchoolNameDto);
  }
}
