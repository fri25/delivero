import { Module } from '@nestjs/common';
import { CommandesRepasModule } from '../commandes-repas/commandes-repas.module';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [CommandesRepasModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
})
export class RestaurantsModule {}
