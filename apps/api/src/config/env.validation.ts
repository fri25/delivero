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
  // Périmètre des services ouverts à la création de commande. Emplettes est
  // développé et testé mais n'est pas opéré en V1 (voir
  // packages/config/perimetre-v1.ts, qui masque les points d'entrée côté apps).
  // Le serveur refuse indépendamment des interfaces : une PWA déjà installée
  // garde son ancien bundle en cache et pourrait encore poster la requête.
  SERVICES_ACTIFS: Joi.string().default('repas,colis,courses_express'),
  // Moyens de paiement acceptés à la création. Décision du 23/09/2026 : la V1
  // encaisse uniquement par Mobile Money, les espèces à la livraison sont
  // retirées — écart assumé avec RG-01, qui prévoit les deux.
  // ⚠️ L'agrégateur FedaPay n'étant pas intégré, un paiement Mobile Money
  // reste en `en_attente` et n'est jamais encaissé : aucune commande n'est
  // encaissable tant que ce chantier n'est pas livré (F-ADM-16).
  MODES_PAIEMENT_ACTIFS: Joi.string().default('mobile_money'),
  // RG-04 : le contre-remboursement Colis suppose un encaissement en espèces
  // auprès du destinataire — retiré de la V1 avec les espèces.
  CONTRE_REMBOURSEMENT_ACTIF: Joi.boolean().default(false),
  JWT_SECRET: Joi.string().min(32).required(),
  // V05 : 7 jours était trop long pour un jeton non révocable — 2h par
  // défaut, le refresh se fait par re-login côté client.
  JWT_EXPIRES_IN: Joi.string().default('2h'),
});
