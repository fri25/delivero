import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EntrepriseActiviteController } from './entreprise-activite.controller';
import { EntrepriseClientsService } from './entreprise-clients.service';
import { EntrepriseJournalService } from './entreprise-journal.service';
import { EntrepriseParametresController } from './entreprise-parametres.controller';
import { EntrepriseParametresService } from './entreprise-parametres.service';
import { EntrepriseUtilisateursController } from './entreprise-utilisateurs.controller';
import { EntrepriseUtilisateursService } from './entreprise-utilisateurs.service';
import { JournalActiviteInterceptor } from './journal-activite.interceptor';

/**
 * Company back-office space (étape 8 of docs/plan-migration-multi-tenant.md):
 * settings, FedaPay keys, back-office accounts, activity journal, clients.
 */
@Module({
  controllers: [
    EntrepriseParametresController,
    EntrepriseUtilisateursController,
    EntrepriseActiviteController,
  ],
  providers: [
    EntrepriseParametresService,
    EntrepriseUtilisateursService,
    EntrepriseJournalService,
    EntrepriseClientsService,
    { provide: APP_INTERCEPTOR, useClass: JournalActiviteInterceptor },
  ],
})
export class EntrepriseModule {}
