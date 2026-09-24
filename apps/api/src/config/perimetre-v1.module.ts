import { Global, Module } from '@nestjs/common';
import { PerimetreV1Service } from './perimetre-v1.service';

// Global : la garde de périmètre est transversale (services de commande,
// saisie manuelle admin) et n'a aucun état. Même logique que ConfigModule,
// dont elle dépend.
@Global()
@Module({
  providers: [PerimetreV1Service],
  exports: [PerimetreV1Service],
})
export class PerimetreV1Module {}
