import { Module } from '@nestjs/common';
import { AdminCaisseController } from './admin-caisse.controller';
import { AdminCaisseService } from './admin-caisse.service';
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
    AdminCaisseController,
  ],
  providers: [
    AdminCommandesService,
    AdminLivreursService,
    AdminZonesService,
    AdminCaisseService,
  ],
})
export class AdminModule {}
