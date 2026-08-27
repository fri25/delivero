import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// S'appuie sur le restaurant de démonstration créé par `prisma/seed.ts`
// (+22900000001 / demo12345, voir prisma/seed.ts) — la base doit avoir été
// seedée avant de lancer ce test (pnpm prisma:seed).
const DEMO_RESTAURANT = { telephone: '+22900000001', motDePasse: 'demo12345' };

interface AuthResponseBody {
  accessToken: string;
}
interface RestaurantSummary {
  id: string;
}
interface RestaurantDetail {
  plats: Array<{ id: string }>;
}
interface AdresseBody {
  id: string;
}
interface CommandeRepasBody {
  id: string;
  statut: string;
}

describe('Repas (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    // Mêmes options que main.ts : sans ça, les DTO ne sont ni validés ni
    // transformés (@Type, @IsNumber...) dans ce test, contrairement à la
    // vraie app.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('parcours client : inscription -> commande -> le restaurant accepte', async () => {
    const server = app.getHttpServer();
    const telephone = `+229${Date.now()}`;

    const registerRes = await request(server)
      .post('/api/auth/register')
      .send({ telephone, motDePasse: 'motdepasse123', nom: 'Client E2E' })
      .expect(201);
    const clientToken = (registerRes.body as AuthResponseBody).accessToken;

    // Recherche par nom plutôt que restaurants[0] : la liste contient aussi
    // le catalogue de lancement (prisma/seed.ts, PILOT_RESTAURANTS) et est
    // triée alphabétiquement, donc « Le Baobab » n'est pas forcément premier.
    const restaurantsRes = await request(server)
      .get('/api/restaurants')
      .query({ q: 'Le Baobab' })
      .expect(200);
    const restaurants = restaurantsRes.body as RestaurantSummary[];
    expect(restaurants.length).toBeGreaterThan(0);
    const restaurantId = restaurants[0].id;

    const fiche = await request(server)
      .get(`/api/restaurants/${restaurantId}`)
      .expect(200);
    const { plats } = fiche.body as RestaurantDetail;
    expect(plats.length).toBeGreaterThan(0);
    const platId = plats[0].id;

    const adresseRes = await request(server)
      .post('/api/adresses')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        libelle: 'Test',
        pointDeRepere: 'Repère e2e',
        estParDefaut: true,
      })
      .expect(201);
    const adresseId = (adresseRes.body as AdresseBody).id;

    const commandeRes = await request(server)
      .post('/api/commandes/repas')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        partenaireId: restaurantId,
        adresseId,
        modePaiement: 'especes',
        lignes: [{ platId, quantite: 1 }],
      })
      .expect(201);
    const commande = commandeRes.body as CommandeRepasBody;
    expect(commande.statut).toBe('en_attente_acceptation');
    const commandeRepasId = commande.id;

    await request(server)
      .patch(`/api/commandes/repas/${commandeRepasId}/accepter`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);

    const restoLoginRes = await request(server)
      .post('/api/auth/login')
      .send(DEMO_RESTAURANT)
      .expect(200);
    const restoToken = (restoLoginRes.body as AuthResponseBody).accessToken;

    const acceptRes = await request(server)
      .patch(`/api/commandes/repas/${commandeRepasId}/accepter`)
      .set('Authorization', `Bearer ${restoToken}`)
      .expect(200);
    expect((acceptRes.body as CommandeRepasBody).statut).toBe('confirmee');
  });
});
