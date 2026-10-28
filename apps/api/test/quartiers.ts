import request from 'supertest';
import { App } from 'supertest/types';

/**
 * A listed neighbourhood (not "Autre quartier", which needs a typed name).
 * Since RG-08 (Q-28, 13/10) addresses, Colis and Courses express stops all
 * require one. The list is seeded by the add_quartiers migration.
 */
export async function resolveQuartierId(server: App): Promise<string> {
  const res = await request(server).get('/api/quartiers').expect(200);
  const quartier = (res.body as Array<{ id: string; autre: boolean }>).find(
    (q) => !q.autre,
  );
  if (!quartier) {
    throw new Error('Aucun quartier listé en base (migration add_quartiers).');
  }
  return quartier.id;
}
