import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// S'appuie sur la zone et le livreur de démonstration créés par
// `prisma/seed.ts` (zone "Natitingou centre", livreur +22900000003 /
// demo12345) — la base doit avoir été seedée avant de lancer ce test
// (pnpm prisma:seed).
const DEMO_LIVREUR = { telephone: '+22900000003', motDePasse: 'demo12345' };

interface AuthResponseBody {
  accessToken: string;
}
interface EtapeBody {
  id: string;
  ordre: number;
  realisee: boolean;
}
interface CommandeCoursesExpressBody {
  id: string;
  statut: string;
  etapes: EtapeBody[];
  commande: { montantTotal: string | number };
}

describe('Courses express (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let clientToken: string;
  let livreurToken: string;
  let zoneId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer();

    const telephone = `+229${Date.now()}`;
    const registerRes = await request(server)
      .post('/api/auth/register')
      .send({
        telephone,
        motDePasse: 'motdepasse123',
        nom: 'Client Courses Express E2E',
      })
      .expect(201);
    clientToken = (registerRes.body as AuthResponseBody).accessToken;

    const livreurLoginRes = await request(server)
      .post('/api/auth/login')
      .send(DEMO_LIVREUR)
      .expect(200);
    livreurToken = (livreurLoginRes.body as AuthResponseBody).accessToken;

    const meRes = await request(server)
      .get('/api/livreurs/me')
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    zoneId = (meRes.body as { zoneId: string }).zoneId;
  });

  afterAll(async () => {
    await app.close();
  });

  function creerCommande(
    etapes: { description: string; pointDeRepere: string }[],
  ) {
    return request(server)
      .post('/api/commandes/courses-express')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        description: 'Retirer un colis à la poste et le déposer au bureau',
        zoneId,
        modePaiement: 'especes',
        etapes,
      });
  }

  it('estimation : tarif majoré par arrêt supplémentaire', async () => {
    const unArret = await request(server)
      .get('/api/commandes/courses-express/estimation')
      .set('Authorization', `Bearer ${clientToken}`)
      .query({ zoneId, nombreEtapes: 1 })
      .expect(200);
    const deuxArrets = await request(server)
      .get('/api/commandes/courses-express/estimation')
      .set('Authorization', `Bearer ${clientToken}`)
      .query({ zoneId, nombreEtapes: 2 })
      .expect(200);
    expect((deuxArrets.body as { tarif: number }).tarif).toBeGreaterThan(
      (unArret.body as { tarif: number }).tarif,
    );
  });

  it('parcours complet multi-arrêts : prise en charge -> étapes -> terminee', async () => {
    const createRes = await creerCommande([
      {
        description: 'Retirer le colis à la poste',
        pointDeRepere: 'Poste centrale',
      },
      {
        description: 'Déposer le colis au bureau',
        pointDeRepere: 'Immeuble bleu',
      },
    ]);
    expect(createRes.status).toBe(201);
    const commande = createRes.body as CommandeCoursesExpressBody;
    expect(commande.statut).toBe('confirmee');
    expect(commande.etapes).toHaveLength(2);
    const id = commande.id;
    const [etape1, etape2] = commande.etapes;

    const disponiblesRes = await request(server)
      .get('/api/commandes/courses-express/disponibles')
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    expect(
      (disponiblesRes.body as CommandeCoursesExpressBody[]).some(
        (c) => c.id === id,
      ),
    ).toBe(true);

    await request(server)
      .patch(`/api/commandes/courses-express/${id}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    const apresEtape1 = await request(server)
      .patch(
        `/api/commandes/courses-express/${id}/etapes/${etape1.id}/realiser`,
      )
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    expect((apresEtape1.body as CommandeCoursesExpressBody).statut).toBe(
      'etape_realisee',
    );

    // Réaliser une étape déjà réalisée -> 409, pas de double comptage.
    await request(server)
      .patch(
        `/api/commandes/courses-express/${id}/etapes/${etape1.id}/realiser`,
      )
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(409);

    const apresEtape2 = await request(server)
      .patch(
        `/api/commandes/courses-express/${id}/etapes/${etape2.id}/realiser`,
      )
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    expect((apresEtape2.body as CommandeCoursesExpressBody).statut).toBe(
      'terminee',
    );
  });

  it('deux prises en charge concurrentes : une seule réussit', async () => {
    const createRes = await creerCommande([
      { description: 'Étape unique', pointDeRepere: 'Marché central' },
    ]);
    const id = (createRes.body as CommandeCoursesExpressBody).id;

    const [first, second] = await Promise.all([
      request(server)
        .patch(`/api/commandes/courses-express/${id}/prendre-en-charge`)
        .set('Authorization', `Bearer ${livreurToken}`),
      request(server)
        .patch(`/api/commandes/courses-express/${id}/prendre-en-charge`)
        .set('Authorization', `Bearer ${livreurToken}`),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('livreur non attributaire : refusé sur la réalisation d’étape', async () => {
    const createRes = await creerCommande([
      { description: 'Étape unique', pointDeRepere: 'Marché central' },
    ]);
    const commande = createRes.body as CommandeCoursesExpressBody;
    const [etape] = commande.etapes;

    await request(server)
      .patch(
        `/api/commandes/courses-express/${commande.id}/etapes/${etape.id}/realiser`,
      )
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(403);
  });

  it('litige : atteignable depuis en_cours, avec motif', async () => {
    const createRes = await creerCommande([
      { description: 'Étape unique', pointDeRepere: 'Marché central' },
    ]);
    const id = (createRes.body as CommandeCoursesExpressBody).id;

    await request(server)
      .patch(`/api/commandes/courses-express/${id}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    const litigeRes = await request(server)
      .patch(`/api/commandes/courses-express/${id}/litige`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ motif: 'Boutique fermée, tâche irréalisable.' })
      .expect(200);
    expect((litigeRes.body as CommandeCoursesExpressBody).statut).toBe(
      'litige',
    );
  });

  it('annulation : possible avant attribution, refusée après', async () => {
    const createRes = await creerCommande([
      { description: 'Étape unique', pointDeRepere: 'Marché central' },
    ]);
    const id = (createRes.body as CommandeCoursesExpressBody).id;

    const annuleeRes = await request(server)
      .patch(`/api/commandes/courses-express/${id}/annuler`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    expect((annuleeRes.body as CommandeCoursesExpressBody).statut).toBe(
      'annulee',
    );

    await request(server)
      .patch(`/api/commandes/courses-express/${id}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(409);
  });
});
