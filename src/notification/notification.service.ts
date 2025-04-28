import { Injectable } from "@nestjs/common";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationDto } from "./dto/notifications.dto";
import { EduException } from "../common/exceptions/edu-school.exception";
import { NotifiedCountDto } from "./dto/notified-count.dto";

@Injectable()
export class NotificationService {
	constructor(private readonly prismaService: PrismaService) {}

	async create(data: CreateNotificationDto): Promise<NotifiedCountDto> {
		const notification = await this.prismaService.notification.create({
			data: data,
		});

		const notifiedUsers = await this.prismaService.user.findMany({
			where: {
				profile: {
					in: notification.profiles,
				},
			},
		});

		const result = await this.prismaService.userNotification.createMany({
			data: notifiedUsers.map((user) => ({
				userId: user.id,
				notificationId: notification.id,
			})),
		});

		return {
			notifiedUsers: result.count,
		};
	}

	async markNotificationRead(userId: string): Promise<NotifiedCountDto> {
		const result = await this.prismaService.userNotification.updateMany({
			where: { userId },
			data: { read: true },
		});

		return {
			notifiedUsers: result.count,
		};
	}

	getNotifications(userId: string): Promise<NotificationDto[]> {
		return this.prismaService.userNotification.findMany({
			where: {
				userId,
				read: false,
			},
			include: {
				notification: true,
			},
		});
	}

	async send(notificationId: string): Promise<NotifiedCountDto> {
		const notification = await this.prismaService.notification.findUnique({
			where: {
				id: notificationId,
			},
		});

		if (!notification) {
			throw new EduException("NOTIFICATION_NOT_FOUND");
		}

		const notifiedUsers = await this.prismaService.user.findMany({
			where: {
				profile: {
					in: notification.profiles,
				},
			},
		});

		const result = await this.prismaService.userNotification.createMany({
			data: notifiedUsers.map((user) => ({
				userId: user.id,
				notificationId: notificationId,
			})),
		});

		return {
			notifiedUsers: result.count,
		};
	}
}
