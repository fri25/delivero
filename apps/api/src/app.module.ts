import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdressesModule } from './adresses/adresses.module';
import { AuthModule } from './auth/auth.module';
import { CommandesColisModule } from './commandes-colis/commandes-colis.module';
import { CommandesCoursesExpressModule } from './commandes-courses-express/commandes-courses-express.module';
import { CommandesEmplettesModule } from './commandes-emplettes/commandes-emplettes.module';
import { CommandesRepasModule } from './commandes-repas/commandes-repas.module';
import { envValidationSchema } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { LivreursModule } from './livreurs/livreurs.module';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ZonesModule } from './zones/zones.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
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
  ],
})
export class AppModule {}
