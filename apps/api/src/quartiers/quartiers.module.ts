import { Global, Module } from '@nestjs/common';
import {
  AdminQuartiersController,
  QuartiersController,
} from './quartiers.controller';
import { QuartiersService } from './quartiers.service';

// Global like NotificationsModule: addresses, the three order services,
// guest orders and manual entry all price through it.
@Global()
@Module({
  controllers: [QuartiersController, AdminQuartiersController],
  providers: [QuartiersService],
  exports: [QuartiersService],
})
export class QuartiersModule {}
