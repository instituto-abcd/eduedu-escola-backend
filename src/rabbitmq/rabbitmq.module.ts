import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { connect, Connection, Channel, ConsumeMessage } from 'amqplib';
import { rabbitmqConstants } from 'src/common/constants';
import { PlanetSyncModule } from 'src/planet-sync/planet-sync.module';
import { PlanetSyncService } from 'src/planet-sync/planet-sync.service';
import { FirestoreService } from 'src/planet-sync/firestore.service';
import { Planet, PlanetSchema } from 'src/planet-sync/schemas/planet.schema';
import {
  PlanetSync,
  PlanetSyncSchema,
} from 'src/planet-sync/schemas/sync-list.schema';
import { DownloadedFile, DownloadedFileSchema } from 'src/planet-sync/schemas/download-file.schema';

@Module({
  imports: [
    PlanetSyncModule,
    MongooseModule.forFeature([
      { name: Planet.name, schema: PlanetSchema },
      { name: PlanetSync.name, schema: PlanetSyncSchema },
      { name: DownloadedFile.name, schema: DownloadedFileSchema },
    ]),
  ],
  providers: [PlanetSyncService, FirestoreService],
})
export class RabbitMQModule implements OnModuleInit {
  private connection: Connection;
  private channel: Channel;

  constructor(
    @Inject(PlanetSyncService)
    private readonly syncService: PlanetSyncService,
  ) {}

  async onModuleInit() {
    this.connection = await connect(process.env.RABBITMQ_URI);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(rabbitmqConstants.queueName);

    await this.channel.consume(
      rabbitmqConstants.queueName,
      this.handleMessage.bind(this),
    );
  }

  async handleMessage(message: ConsumeMessage | null) {
    if (message) {
      const content = message.content.toString();
      const response = JSON.parse(content) as { planetId: string };
      const SYNC_ALLOWED = true;

      if (!response.planetId || !SYNC_ALLOWED) return;
      const sync = await this.syncService.addToSyncList(response.planetId);

      if (sync._id) {
        this.channel.ack(message);
        console.log(`Planet ${response.planetId} added to sync list.`);
      }
    }
  }
}
