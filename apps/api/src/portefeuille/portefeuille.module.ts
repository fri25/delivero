import { Global, Module } from '@nestjs/common';
import { PortefeuilleService } from './portefeuille.service';

// Global comme PrismaModule/AuthModule : consommé par les 4 modules de
// commandes sans imports croisés entre eux.
@Global()
@Module({
  providers: [PortefeuilleService],
  exports: [PortefeuilleService],
})
export class PortefeuilleModule {}
