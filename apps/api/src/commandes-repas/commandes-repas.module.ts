import { Module } from '@nestjs/common';
import { CommandesRepasController } from './commandes-repas.controller';
import { CommandesRepasService } from './commandes-repas.service';

@Module({
  controllers: [CommandesRepasController],
  providers: [CommandesRepasService],
  exports: [CommandesRepasService],
})
export class CommandesRepasModule {}
