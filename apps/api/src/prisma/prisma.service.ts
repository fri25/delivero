import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { extensionTenant } from './extension-tenant';
import { creerPoolTenant } from './pool-tenant';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      // Every connection carries the company of its request (étape 7, RLS).
      adapter: new PrismaPg(
        creerPoolTenant({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
        }),
      ),
    });
    // Every module injects this client: returning the extended one scopes
    // all their queries to the company of the request (étape 4,
    // docs/plan-migration-multi-tenant.md) without touching them. The
    // extended client keeps the methods of this class.
    return this.$extends(extensionTenant) as unknown as PrismaService;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
