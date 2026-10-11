import { Module } from '@nestjs/common';
import { CommandesColisModule } from '../commandes-colis/commandes-colis.module';
import { CommandesCoursesExpressModule } from '../commandes-courses-express/commandes-courses-express.module';
import { CommandesRepasModule } from '../commandes-repas/commandes-repas.module';
import { NotationsModule } from '../notations/notations.module';
import { PaiementsModule } from '../paiements/paiements.module';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';

@Module({
  imports: [
    CommandesRepasModule,
    CommandesColisModule,
    CommandesCoursesExpressModule,
    PaiementsModule,
    NotationsModule,
  ],
  controllers: [InviteController],
  providers: [InviteService],
})
export class InviteModule {}
