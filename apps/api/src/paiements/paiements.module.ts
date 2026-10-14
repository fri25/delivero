import { Module } from '@nestjs/common';
import { ExpirationPaiementsService } from './expiration-paiements.service';
import { FedapayClient } from './fedapay.client';
import { PaiementsController } from './paiements.controller';
import { PaiementsService } from './paiements.service';
import { PaiementsWebhookController } from './paiements-webhook.controller';

@Module({
  controllers: [PaiementsController, PaiementsWebhookController],
  providers: [PaiementsService, FedapayClient, ExpirationPaiementsService],
  exports: [PaiementsService],
})
export class PaiementsModule {}
