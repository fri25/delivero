import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AdressesModule } from './adresses/adresses.module';
import { AuthModule } from './auth/auth.module';
import { CommandesColisModule } from './commandes-colis/commandes-colis.module';
import { CommandesCoursesExpressModule } from './commandes-courses-express/commandes-courses-express.module';
import { CommandesEmplettesModule } from './commandes-emplettes/commandes-emplettes.module';
import { CommandesRepasModule } from './commandes-repas/commandes-repas.module';
import { envValidationSchema } from './config/env.validation';
import { PerimetreV1Module } from './config/perimetre-v1.module';
import { HealthModule } from './health/health.module';
import { LivreursModule } from './livreurs/livreurs.module';
import { PortefeuilleModule } from './portefeuille/portefeuille.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ZonesModule } from './zones/zones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    // Rate limit global par défaut (60 req/min/IP) ; l'auth applique une
    // limite plus stricte via @Throttle sur login/register (V03).
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),
    PerimetreV1Module,
    PrismaModule,
    PortefeuilleModule,
    RealtimeModule,
    AuthModule,
    HealthModule,
    AdressesModule,
    RestaurantsModule,
    CommandesRepasModule,
    CommandesColisModule,
    CommandesEmplettesModule,
    CommandesCoursesExpressModule,
    LivreursModule,
    ZonesModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
