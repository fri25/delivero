import 'dotenv/config';
import { ouvrir } from './fonctionnalites-e2e';
import { preparerRoleApplication } from './role-application-e2e';

export default async function globalSetup() {
  await preparerRoleApplication(process.env.DATABASE_URL!);
  await ouvrir();
}
