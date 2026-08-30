import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

// Global comme PrismaModule/AuthModule/PortefeuilleModule : consommé par les
// 4 modules de commandes sans imports croisés entre eux.
@Global()
@Module({
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
