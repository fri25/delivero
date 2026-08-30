import { Module } from '@nestjs/common';
import { CommandesColisModule } from '../commandes-colis/commandes-colis.module';
import { CommandesCoursesExpressModule } from '../commandes-courses-express/commandes-courses-express.module';
import { CommandesEmplettesModule } from '../commandes-emplettes/commandes-emplettes.module';
import { CommandesRepasModule } from '../commandes-repas/commandes-repas.module';
import { AdminCaisseController } from './admin-caisse.controller';
import { AdminCaisseService } from './admin-caisse.service';
import { AdminCommandesController } from './admin-commandes.controller';
import { AdminCommandesService } from './admin-commandes.service';
import { AdminLivreursController } from './admin-livreurs.controller';
import { AdminLivreursService } from './admin-livreurs.service';
import { AdminSaisieManuelleController } from './admin-saisie-manuelle.controller';
import { AdminSaisieManuelleService } from './admin-saisie-manuelle.service';
import { AdminZonesController } from './admin-zones.controller';
import { AdminZonesService } from './admin-zones.service';

@Module({
  imports: [
    CommandesRepasModule,
    CommandesColisModule,
    CommandesEmplettesModule,
    CommandesCoursesExpressModule,
  ],
  controllers: [
    AdminCommandesController,
    AdminLivreursController,
    AdminZonesController,
    AdminCaisseController,
    AdminSaisieManuelleController,
  ],
  providers: [
    AdminCommandesService,
    AdminLivreursService,
    AdminZonesService,
    AdminCaisseService,
    AdminSaisieManuelleService,
  ],
})
export class AdminModule {}
