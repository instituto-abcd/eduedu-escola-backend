import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { Settings } from './dto/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings';
import { SchoolId } from '../common/school-id.decorator';
import { UpdateSchoolNameDto } from './dto/update-school-name';
import { StatusResponseDto } from './dto/status-response.dto';
import { CreateUserRequestDto } from '../user/dto/request/create-user-request.dto';
import { AuthResponseDto } from '../auth/dto/response/auth-response.dto';
import { Request } from 'express';
import axios from 'axios';

@ApiTags('Configurações')
@Controller('system-configuration')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public-ip')
  @ApiOperation({ summary: 'Obter endereço IP público' })
  @ApiOkResponse({ type: String })
  async getPublicIpAddress(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      console.error('Erro ao obter o endereço IP público:', error);
      throw new Error('Erro ao obter o endereço IP público');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Configurações da escola' })
  @ApiOkResponse({ type: Settings })
  async getSettingsById(@SchoolId() schoolId: string): Promise<Settings> {
    return this.settingsService.getSettingsBySchoolId(schoolId);
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar configurações da escola' })
  @ApiOkResponse({ type: Settings })
  async updateSettings(
    @SchoolId() schoolId: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ): Promise<Settings> {
    return this.settingsService.updateSettings(schoolId, updateSettingsDto);
  }

  @Put('school/name')
  @ApiOperation({ summary: 'Atualizar nome da escola' })
  @ApiOkResponse({ type: Settings })
  async updateSchoolName(
    @SchoolId() schoolId: string,
    @Body() updateSchoolNameDto: UpdateSchoolNameDto,
  ): Promise<Settings> {
    return this.settingsService.updateSchoolName(schoolId, updateSchoolNameDto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Obter status da instalação inicial' })
  @ApiResponse({
    status: 200,
    description: 'Status da instalação inicial',
    type: StatusResponseDto,
  })
  async getStatus(): Promise<StatusResponseDto> {
    return this.settingsService.getStatus();
  }

  @Post('owner')
  @ApiOperation({
    summary: 'Criar usuário admin/owner',
    description:
      'Usado no setup de nova escola, essa conta é a primeira a ser criada e tem o perfil de maior autoridade na aplicação',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  async createOwner(
    @Body() createUserDto: CreateUserRequestDto,
    @SchoolId() schoolId: string,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.settingsService.createOwner(
      createUserDto,
      schoolId,
      request.headers.origin,
    );
  }
}
