import { Global, Module } from '@nestjs/common';
import { JournalSecuriteService } from './journal-securite.service';
import { ResolutionTenantService } from './resolution-tenant.service';
import { TenantMiddleware } from './tenant.middleware';

@Global()
@Module({
  providers: [
    ResolutionTenantService,
    TenantMiddleware,
    JournalSecuriteService,
  ],
  exports: [ResolutionTenantService, TenantMiddleware, JournalSecuriteService],
})
export class TenancyModule {}
