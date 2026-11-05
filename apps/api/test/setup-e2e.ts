import { config as chargerEnv } from 'dotenv';
import { urlRoleApplication } from './role-application-e2e';

// These suites check the full implementation (cash payments, livreur wallet,
// cash on delivery, Emplettes), which stays in the code: the V1 scope is a
// deployment setting, not a removal. They open what V1 closes.
// Runs before any import: ConfigModule.forRoot() reads and validates the
// environment as soon as AppModule is imported, so setting these in a
// beforeAll comes too late. dotenv does not override variables already set.
process.env.SERVICES_ACTIFS = 'repas,colis,courses_express,emplettes';
process.env.MODES_PAIEMENT_ACTIFS = 'mobile_money,especes';
process.env.CONTRE_REMBOURSEMENT_ACTIF = 'true';
// CHAP EXPRESS's FedaPay webhook secret, for the cross-company webhook test
// (étape 5). Test-only value.
process.env.FEDAPAY_WEBHOOK_SECRET = 'wh_e2e_chapexpress';

// Étape 7 (RLS): the API under test connects with a role that is neither
// superuser nor BYPASSRLS, as in production, so the row-level policies are
// really applied. Created by global-setup-e2e.ts; migrations and seed keep
// the owner role.
chargerEnv();
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL_PROPRIETAIRE = process.env.DATABASE_URL;
  process.env.DATABASE_URL = urlRoleApplication(process.env.DATABASE_URL);
}
