import { Global, Module } from '@nestjs/common';
import { JournalSecuriteService } from './journal-securite.service';
import { ParametresTenantService } from './parametres-tenant.service';
import { ResolutionTenantService } from './resolution-tenant.service';
import { SecretsTenantService } from './secrets-tenant.service';
import { TenantMiddleware } from './tenant.middleware';

@Global()
@Module({
  providers: [
    ResolutionTenantService,
    TenantMiddleware,
    JournalSecuriteService,
    ParametresTenantService,
    SecretsTenantService,
  ],
  exports: [
    ResolutionTenantService,
    TenantMiddleware,
    JournalSecuriteService,
    ParametresTenantService,
    SecretsTenantService,
  ],
})
export class TenancyModule {}
