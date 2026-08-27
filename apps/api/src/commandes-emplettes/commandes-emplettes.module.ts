import { Module } from '@nestjs/common';
import { CommandesEmplettesController } from './commandes-emplettes.controller';
import { CommandesEmplettesService } from './commandes-emplettes.service';

@Module({
  controllers: [CommandesEmplettesController],
  providers: [CommandesEmplettesService],
  exports: [CommandesEmplettesService],
})
export class CommandesEmplettesModule {}
