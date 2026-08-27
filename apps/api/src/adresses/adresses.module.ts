import { Module } from '@nestjs/common';
import { AdressesController } from './adresses.controller';
import { AdressesService } from './adresses.service';

@Module({
  controllers: [AdressesController],
  providers: [AdressesService],
})
export class AdressesModule {}
