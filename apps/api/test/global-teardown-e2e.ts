import { restaurer } from './fonctionnalites-e2e';

export default async function globalTeardown() {
  await restaurer();
}
