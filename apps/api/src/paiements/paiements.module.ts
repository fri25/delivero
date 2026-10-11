import { Module } from '@nestjs/common';
import { FedapayClient } from './fedapay.client';
import { PaiementsController } from './paiements.controller';
import { PaiementsService } from './paiements.service';
import { PaiementsWebhookController } from './paiements-webhook.controller';

@Module({
  controllers: [PaiementsController, PaiementsWebhookController],
  providers: [PaiementsService, FedapayClient],
  exports: [PaiementsService],
})
export class PaiementsModule {}
