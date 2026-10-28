import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  // Number of reverse-proxy hops in front of the API (see main.ts). Empty
  // when the API is exposed directly (local dev).
  TRUST_PROXY: Joi.string().pattern(/^\d+$/).allow('').default(''),
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
  // Mobile Money goes through FedaPay (FEDAPAY_* variables below).
  MODES_PAIEMENT_ACTIFS: Joi.string().default('mobile_money'),
  // FedaPay (F-ADM-16). No secret key => payment unavailable: orders can
  // still be created but reach nobody until paid. Never committed: .env only.
  FEDAPAY_ENVIRONMENT: Joi.string().valid('sandbox', 'live').default('sandbox'),
  FEDAPAY_SECRET_KEY: Joi.string().allow('').default(''),
  // Webhook endpoint secret, given by the FedaPay dashboard when the webhook
  // is created (distinct from the secret key).
  FEDAPAY_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  // Public URL of the client app: FedaPay redirects the client there.
  CLIENT_APP_URL: Joi.string().uri().default('http://localhost:5173'),
  // Web Push (VAPID). Generate once with `npx web-push generate-vapid-keys`.
  // Missing keys => push disabled, every alert goes through WhatsApp/SMS.
  VAPID_PUBLIC_KEY: Joi.string().allow('').default(''),
  VAPID_PRIVATE_KEY: Joi.string().allow('').default(''),
  VAPID_SUBJECT: Joi.string().default('mailto:contact@chapexpress.bj'),
  // WhatsApp/SMS provider (fallback for every alert + OTP codes).
  // "console" writes messages to the API logs (dev only); "twilio" sends them
  // (decision of 13/10) and needs the TWILIO_* variables below.
  MESSAGERIE_FOURNISSEUR: Joi.string()
    .valid('console', 'twilio')
    .default('console'),
  TWILIO_ACCOUNT_SID: Joi.string().when('MESSAGERIE_FOURNISSEUR', {
    is: 'twilio',
    then: Joi.required(),
    otherwise: Joi.allow('').default(''),
  }),
  TWILIO_AUTH_TOKEN: Joi.string().when('MESSAGERIE_FOURNISSEUR', {
    is: 'twilio',
    then: Joi.required(),
    otherwise: Joi.allow('').default(''),
  }),
  // SMS sender: Twilio number (+…) or Messaging Service SID (MG…).
  TWILIO_SMS_FROM: Joi.string().when('MESSAGERIE_FOURNISSEUR', {
    is: 'twilio',
    then: Joi.required(),
    otherwise: Joi.allow('').default(''),
  }),
  // Optional WhatsApp sender (+…): tried first, SMS as fallback.
  TWILIO_WHATSAPP_FROM: Joi.string().allow('').default(''),
  // F-CLI-09: E-mail notifications.
  COURRIEL_FOURNISSEUR: Joi.string()
    .valid('console', 'resend')
    .default('console'),
  RESEND_API_KEY: Joi.string().when('COURRIEL_FOURNISSEUR', {
    is: 'resend',
    then: Joi.required(),
    otherwise: Joi.allow('').default(''),
  }),
  COURRIEL_EXPEDITEUR: Joi.string().default(
    'ChapExpress <notifications@chapexpress.bj>',
  ),
  // Cloudinary (photos colis / courses). Missing => photo fields hidden.
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').default(''),
  CLOUDINARY_API_KEY: Joi.string().allow('').default(''),
  CLOUDINARY_API_SECRET: Joi.string().allow('').default(''),
  // RG-04 : le contre-remboursement Colis suppose un encaissement en espèces
  // auprès du destinataire — retiré de la V1 avec les espèces.
  CONTRE_REMBOURSEMENT_ACTIF: Joi.boolean().default(false),
  JWT_SECRET: Joi.string().min(32).required(),
  // V05 : 7 jours était trop long pour un jeton non révocable — 2h par
  // défaut, le refresh se fait par re-login côté client.
  JWT_EXPIRES_IN: Joi.string().default('2h'),
});
