import { Module } from '@nestjs/common';
import { AdminCommandesController } from './admin-commandes.controller';
import { AdminCommandesService } from './admin-commandes.service';
import { AdminLivreursController } from './admin-livreurs.controller';
import { AdminLivreursService } from './admin-livreurs.service';
import { AdminZonesController } from './admin-zones.controller';
import { AdminZonesService } from './admin-zones.service';

@Module({
  controllers: [
    AdminCommandesController,
    AdminLivreursController,
    AdminZonesController,
  ],
  providers: [AdminCommandesService, AdminLivreursService, AdminZonesService],
})
export class AdminModule {}
