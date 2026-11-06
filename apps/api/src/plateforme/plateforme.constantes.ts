/**
 * Features a company can open (tenant_features.code), within the platform
 * ceiling of SERVICES_ACTIFS / MODES_PAIEMENT_ACTIFS /
 * CONTRE_REMBOURSEMENT_ACTIF (PerimetreV1Service).
 */
export const FONCTIONNALITES = [
  'service.repas',
  'service.colis',
  'service.courses_express',
  'service.emplettes',
  'paiement.mobile_money',
  'paiement.especes',
  'colis.contre_remboursement',
] as const;

/** Sub-domain labels a company cannot take. */
export const SLUGS_RESERVES = [
  'admin',
  'api',
  'www',
  'app',
  'plateforme',
  'rapidliv',
  'static',
  'mail',
];
