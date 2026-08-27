import { Module } from '@nestjs/common';
import { CommandesColisController } from './commandes-colis.controller';
import { CommandesColisService } from './commandes-colis.service';

@Module({
  controllers: [CommandesColisController],
  providers: [CommandesColisService],
  exports: [CommandesColisService],
})
export class CommandesColisModule {}
