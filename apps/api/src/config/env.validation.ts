import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  // V04 : plus de fallback "reflète n'importe quel Origin" — obligatoire dès
  // que NODE_ENV=production, optionnel seulement en dev/test.
  CORS_ORIGINS: Joi.string()
    .allow('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().min(1).required(),
    })
    .default(''),
  JWT_SECRET: Joi.string().min(32).required(),
  // V05 : 7 jours était trop long pour un jeton non révocable — 2h par
  // défaut, le refresh se fait par re-login côté client.
  JWT_EXPIRES_IN: Joi.string().default('2h'),
});
