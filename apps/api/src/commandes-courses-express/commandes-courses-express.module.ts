import { Module } from '@nestjs/common';
import { CommandesCoursesExpressController } from './commandes-courses-express.controller';
import { CommandesCoursesExpressService } from './commandes-courses-express.service';

@Module({
  controllers: [CommandesCoursesExpressController],
  providers: [CommandesCoursesExpressService],
  exports: [CommandesCoursesExpressService],
})
export class CommandesCoursesExpressModule {}
