import { Module } from '@nestjs/common';
import { PlateformeAuthController } from './plateforme-auth.controller';
import { PlateformeAuthGuard } from './plateforme-auth.guard';
import { PlateformeEntreprisesController } from './plateforme-entreprises.controller';
import { PlateformeEntreprisesService } from './plateforme-entreprises.service';
import { PlateformeJournalService } from './plateforme-journal.service';

/**
 * RapidLiv platform super-admin (étape 9 of
 * docs/plan-migration-multi-tenant.md): companies, domains, features,
 * offers, global statistics, platform journal. Served to apps/plateforme.
 */
@Module({
  controllers: [PlateformeAuthController, PlateformeEntreprisesController],
  providers: [
    PlateformeAuthGuard,
    PlateformeEntreprisesService,
    PlateformeJournalService,
  ],
})
export class PlateformeModule {}
