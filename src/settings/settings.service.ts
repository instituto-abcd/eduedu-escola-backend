import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Settings } from './dto/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings';
import { UpdateSchoolNameDto } from './dto/update-school-name';
import { BcryptService } from '../common/services/bcrypt.service';
import { EduException } from '../common/exceptions/edu-school.exception';
import { StatusResponseDto } from './dto/status-response.dto';
import { CreateUserRequestDto } from 'src/user/dto/request/create-user-request.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthResponseDto } from 'src/auth/dto/response/auth-response.dto';
import { ValidationUtilsService } from '../common/utils/validation-utils.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly validationUtilsService: ValidationUtilsService,
  ) {}

  async getSettingsBySchoolId(schoolId: string): Promise<Settings> {
    if (!schoolId) {
      throw new EduException('MISSING_REQUIRED_FIELDS');
    }

    const settings = await this.prismaService.settings.findUnique({
      where: { schoolId },
      include: {
        school: {
          select: { id: true, name: true, createdAt: true, updatedAt: true },
        },
      },
    });

    if (!settings) {
      throw new EduException('SETTINGS_NOT_FOUND');
    }

    const password = this.bcryptService.decrypt(settings.smtpPassword);

    return {
      id: settings.id,
      schoolName: settings.school?.name,
      synchronizationPlanets: settings.synchronizationPlanets,
      smtpHostName: settings.smtpHostName,
      smtpUserName: settings.smtpUserName,
      smtpPassword: password,
      smtpPort: settings.smtpPort,
      sslIsActive: settings.sslIsActive,
      schoolId: settings.schoolId,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  async updateSettings(
    schoolId: string,
    updateSettingsDto: UpdateSettingsDto,
  ): Promise<Settings> {
    if (!schoolId) {
      throw new EduException('MISSING_REQUIRED_FIELDS');
    }
    const settings = await this.getSettingsBySchoolId(schoolId);

    const updateData: any = {};

    if (updateSettingsDto.synchronizationPlanets !== undefined) {
      updateData.synchronizationPlanets =
        updateSettingsDto.synchronizationPlanets;
    }

    if (updateSettingsDto.smtpHostName !== undefined) {
      updateData.smtpHostName = updateSettingsDto.smtpHostName;
    }

    if (updateSettingsDto.smtpUserName !== undefined) {
      updateData.smtpUserName = updateSettingsDto.smtpUserName;
    }

    if (updateSettingsDto.smtpPassword !== undefined) {
      updateData.smtpPassword = this.bcryptService.encrypt(
        updateSettingsDto.smtpPassword,
      );
    }

    if (updateSettingsDto.sslIsActive !== undefined) {
      updateData.sslIsActive = updateSettingsDto.sslIsActive;
    }

    if (updateSettingsDto.smtpPort !== undefined) {
      updateData.smtpPort = updateSettingsDto.smtpPort;
    }

    if (
      updateSettingsDto.schoolName !== undefined &&
      updateSettingsDto.schoolName !== ''
    ) {
      settings.schoolName = updateSettingsDto.schoolName;
      updateData.school = { update: { name: updateSettingsDto.schoolName } };
    }

    const updatedSettings = await this.prismaService.settings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return {
      id: updatedSettings.id,
      schoolName: settings.schoolName,
      synchronizationPlanets: updatedSettings.synchronizationPlanets,
      smtpHostName: updatedSettings.smtpHostName,
      smtpUserName: updatedSettings.smtpUserName,
      smtpPort: updatedSettings.smtpPort,
      smtpPassword: updateSettingsDto.smtpPassword,
      sslIsActive: updatedSettings.sslIsActive,
      schoolId: updatedSettings.schoolId,
      createdAt: updatedSettings.createdAt,
      updatedAt: updatedSettings.updatedAt,
    };
  }

  async updateSchoolName(
    schoolId: string,
    updateSchoolNameDto: UpdateSchoolNameDto,
  ): Promise<Settings> {
    const { schoolName } = updateSchoolNameDto;

    if (!schoolId || !schoolName) {
      throw new EduException('MISSING_REQUIRED_FIELDS');
    }

    const school = await this.prismaService.school.update({
      where: { id: schoolId },
      data: { name: updateSchoolNameDto.schoolName },
    });

    const settings = await this.getSettingsBySchoolId(schoolId);

    const updatedSettings = await this.prismaService.settings.update({
      where: { id: settings.id },
      data: { school: { update: { name: updateSchoolNameDto.schoolName } } },
    });

    const password = this.bcryptService.decrypt(settings.smtpPassword);
    return {
      id: updatedSettings.id,
      schoolName: school.name,
      synchronizationPlanets: updatedSettings.synchronizationPlanets,
      smtpHostName: updatedSettings.smtpHostName,
      smtpUserName: updatedSettings.smtpUserName,
      smtpPort: updatedSettings.smtpPort,
      smtpPassword: password,
      sslIsActive: updatedSettings.sslIsActive,
      schoolId: updatedSettings.schoolId,
      createdAt: updatedSettings.createdAt,
      updatedAt: updatedSettings.updatedAt,
    };
  }

  async getStatus(): Promise<StatusResponseDto> {
    const owner = await this.prismaService.user.findFirst({
      where: { owner: true },
    });

    const completedOwnerSetup = Boolean(owner);

    const schoolName = await this.prismaService.school.findFirst({
      where: {
        name: {
          notIn: ['', 'EduEdu Escola'],
        },
      },
    });

    const completedSchoolSetup = Boolean(schoolName);

    return {
      completedOwnerSetup,
      completedSchoolSetup,
    };
  }

  async createOwner(
    data: CreateUserRequestDto,
    schoolId: string,
    origin: string,
  ): Promise<AuthResponseDto> {
    const { password } = data;

    const [isPasswordStrong, message] =
      this.validationUtilsService.isPasswordStrong(password);
    if (!isPasswordStrong) {
      throw new EduException('WEAK_PASSWORD', message);
    }

    const result = await this.userService.create(data, schoolId, origin);

    const owner = await this.prismaService.user.update({
      where: { id: result.id },
      data: { owner: true, emailConfirmed: true },
    });

    return await this.authService.authenticateUser({
      email: owner.email,
      password: data.password,
    });
  }
}
