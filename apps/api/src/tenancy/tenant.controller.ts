import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PerimetreV1Service } from '../config/perimetre-v1.service';
import { ParametresTenantService } from './parametres-tenant.service';

/**
 * Identity of the company the app is opened for (étape 6 of
 * docs/plan-migration-multi-tenant.md): name, colours, contacts, town,
 * commission and opened features. Public: the apps need it before sign-in,
 * and none of it is confidential (no credential, no domain list).
 */
@Controller('tenant')
export class TenantController {
  constructor(
    private readonly parametres: ParametresTenantService,
    private readonly perimetre: PerimetreV1Service,
  ) {}

  @Public()
  @Get()
  async courant() {
    const { slug, nomCommercial, tauxCommission, identite } =
      await this.parametres.courants();
    return {
      slug,
      nomCommercial,
      tauxCommission,
      ...identite,
      fonctionnalites: await this.perimetre.fonctionnalitesOuvertes(),
    };
  }
}
