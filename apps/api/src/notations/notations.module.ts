import { Module } from '@nestjs/common';
import { NotationsController } from './notations.controller';
import { NotationsService } from './notations.service';

@Module({
  controllers: [NotationsController],
  providers: [NotationsService],
  exports: [NotationsService],
})
export class NotationsModule {}
