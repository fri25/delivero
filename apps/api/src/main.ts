import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // rawBody: the FedaPay webhook signature is computed over the exact bytes
  // received (see paiements-webhook.controller.ts).
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // V04 : CORS_ORIGINS est désormais obligatoire en production (voir
  // env.validation.ts) — le fallback `origin: true` ci-dessous ne peut donc
  // s'appliquer qu'en dev/test, jamais reflété aveuglément en prod.
  const corsOrigins = config
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
void bootstrap();
