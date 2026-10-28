import request from 'supertest';
import { App } from 'supertest/types';

// Seeded by prisma/seed.ts (development data only).
const DEMO_ADMIN = { telephone: '+22900000004', motDePasse: 'demo12345' };

/**
 * Creates an available livreur in `zoneId` and returns their token.
 * Concurrent-pickup tests need two distinct livreurs: the same livreur may
 * legitimately start a course already assigned to them by the dispatcher
 * (F-ADM-02/03), so a double request from one livreur proves nothing.
 */
export async function creerAutreLivreur(
  server: App,
  zoneId: string,
): Promise<string> {
  const adminRes = await request(server)
    .post('/api/auth/login')
    .send(DEMO_ADMIN)
    .expect(200);
  const adminToken = (adminRes.body as { accessToken: string }).accessToken;

  const telephone = `+229${Date.now()}`;
  const motDePasse = 'motdepasse123';
  await request(server)
    .post('/api/admin/livreurs')
    .set('Authorization', `Bearer ${adminToken}`)
    // Same development ceilings as the seeded livreur (Q-02 still open).
    .send({
      telephone,
      motDePasse,
      nom: 'Livreur E2E',
      zoneId,
      plafondAvance: 20000,
      plafondCaisse: 50000,
    })
    .expect(201);

  const loginRes = await request(server)
    .post('/api/auth/login')
    .send({ telephone, motDePasse })
    .expect(200);
  const token = (loginRes.body as { accessToken: string }).accessToken;

  await request(server)
    .patch('/api/livreurs/me/disponibilite')
    .set('Authorization', `Bearer ${token}`)
    .send({ disponible: true })
    .expect(200);
  return token;
}
