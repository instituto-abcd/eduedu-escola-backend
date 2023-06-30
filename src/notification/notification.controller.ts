import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserGuard } from 'src/auth/guard/user.guard';
import { NotificationDto } from './dto/notifications.dto';
import { NotifiedCountDto } from './dto/notified-count.dto';
import { CreateNotificationResponseDto } from './dto/create-notification-response.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Notificação')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'Criar notificação' })
  @ApiResponse({
    status: 201,
    type: CreateNotificationResponseDto,
  })
  @Post()
  create(@Body() data: CreateNotificationDto) {
    return this.notificationService.create(data);
  }

  @ApiOperation({ summary: 'Marcar notificações do usuário logado como lidas' })
  @ApiResponse({
    status: 200,
    type: NotifiedCountDto,
  })
  @UseGuards(UserGuard)
  @Patch()
  read(@Req() req) {
    return this.notificationService.markNotificationRead(req.user.id);
  }

  @ApiOperation({ summary: 'Listar notificações do usuário logado' })
  @ApiResponse({
    status: 200,
    type: [NotificationDto],
  })
  @UseGuards(UserGuard)
  @Get()
  getNotifications(@Req() req) {
    return this.notificationService.getNotifications(req.user.id);
  }

  @ApiOperation({
    summary: 'Enviar notificação',
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({ status: 200, type: NotifiedCountDto })
  @Post('send')
  send(@Body() data: { notificationId: string }) {
    return this.notificationService.send(data.notificationId);
  }
}
