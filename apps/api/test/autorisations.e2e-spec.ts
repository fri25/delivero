import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { resolveQuartierId } from './quartiers';

// Access between two users of the same role, before multi-tenancy
// (docs/plan-migration-multi-tenant.md, étape 0): these guard the ownership
// checks that the tenant isolation of étapes 3 and 4 builds on. Relies on
// prisma/seed.ts (demo livreur, admin and restaurant Le Baobab); the second
// restaurant is created by the test, like the second livreur.
const DEMO_LIVREUR = { telephone: '+22900000003', motDePasse: 'demo12345' };
const DEMO_RESTAURANT = { telephone: '+22900000001', motDePasse: 'demo12345' };
const DEMO_ADMIN = { telephone: '+22900000004', motDePasse: 'demo12345' };

interface AuthResponseBody {
  accessToken: string;
}

/** Any answer but success: 403 and 404 both keep the data out of reach. */
function refuse(status: number) {
  expect(status).toBeGreaterThanOrEqual(400);
  expect(status).not.toBe(500);
}

describe('Autorisations entre utilisateurs (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let clientA: string;
  let clientB: string;
  let adresseA: string;
  let livreurA: string;
  let livreurB: string;
  let colisId: string;
  let commandeRepasId: string;
  let restaurantA: string;
  let restaurantB: string;

  const login = async (identifiants: {
    telephone: string;
    motDePasse: string;
  }) => {
    const res = await request(server)
      .post('/api/auth/login')
      .send(identifiants)
      .expect(200);
    return (res.body as AuthResponseBody).accessToken;
  };

  const inscrire = async (nom: string) => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        telephone: `+229${Date.now()}${Math.floor(Math.random() * 10)}`,
        motDePasse: 'motdepasse123',
        nom,
      })
      .expect(201);
    return (res.body as AuthResponseBody).accessToken;
  };

  const creerAdresse = async (token: string, quartierId: string) => {
    const res = await request(server)
      .post('/api/adresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        libelle: 'Domicile',
        quartierId,
        pointDeRepere: 'Repère e2e autorisations',
        estParDefaut: true,
      })
      .expect(201);
    return (res.body as { id: string }).id;
  };

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

    const quartierId = await resolveQuartierId(server);
    clientA = await inscrire('Client A E2E');
    clientB = await inscrire('Client B E2E');
    adresseA = await creerAdresse(clientA, quartierId);
    await creerAdresse(clientB, quartierId);

    livreurA = await login(DEMO_LIVREUR);
    const me = await request(server)
      .get('/api/livreurs/me')
      .set('Authorization', `Bearer ${livreurA}`)
      .expect(200);
    const zoneId = (me.body as { zoneId: string }).zoneId;
    // /auth/login allows 5 calls a minute: exactly one login per account
    // (livreur A, admin, livreur B, restaurant A, restaurant B). Admin-created
    // accounts need a valid Benin number (01 + 8 digits).
    const admin = await login(DEMO_ADMIN);
    const numero = (suffixe: string) =>
      `+22901${String(Date.now()).slice(-7)}${suffixe}`;
    const autreLivreur = {
      telephone: numero('1'),
      motDePasse: 'motdepasse123',
    };
    await request(server)
      .post('/api/admin/livreurs')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        ...autreLivreur,
        nom: 'Livreur B E2E',
        zoneId,
        plafondAvance: 20000,
        plafondCaisse: 50000,
      })
      .expect(201);
    livreurB = await login(autreLivreur);

    restaurantA = await login(DEMO_RESTAURANT);
    const autreRestaurant = {
      telephone: numero('2'),
      motDePasse: 'motdepasse123',
    };
    await request(server)
      .post('/api/admin/partenaires')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        ...autreRestaurant,
        nom: 'Restaurant B E2E',
        zoneId,
        pointDeRepere: 'Repère restaurant B',
      })
      .expect(201);
    restaurantB = await login(autreRestaurant);

    const colisRes = await request(server)
      .post('/api/commandes/colis')
      .set('Authorization', `Bearer ${clientA}`)
      .send({
        adresseEnlevementId: adresseA,
        zoneId,
        quartierLivraisonId: quartierId,
        taille: 'petit',
        destinataireNom: 'Destinataire E2E',
        destinataireTelephone: '+22991234567',
        adresseLivraison: 'Quartier X, Natitingou',
        pointDeRepereLivraison: 'Près du marché',
        modePaiement: 'especes',
        conditionsAcceptees: true,
      })
      .expect(201);
    colisId = (colisRes.body as { id: string }).id;

    const restaurants = await request(server)
      .get('/api/restaurants')
      .query({ q: 'Le Baobab' })
      .expect(200);
    const restaurantId = (restaurants.body as Array<{ id: string }>)[0].id;
    const fiche = await request(server)
      .get(`/api/restaurants/${restaurantId}`)
      .expect(200);
    const platId = (fiche.body as { plats: Array<{ id: string }> }).plats[0].id;
    const repasRes = await request(server)
      .post('/api/commandes/repas')
      .set('Authorization', `Bearer ${clientA}`)
      .send({
        partenaireId: restaurantId,
        adresseId: adresseA,
        modePaiement: 'especes',
        lignes: [{ platId, quantite: 1 }],
      })
      .expect(201);
    commandeRepasId = (repasRes.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('client', () => {
    it('ne lit pas le colis d’un autre client', async () => {
      const res = await request(server)
        .get(`/api/commandes/colis/${colisId}`)
        .set('Authorization', `Bearer ${clientB}`);
      refuse(res.status);
    });

    it('ne voit pas le colis d’un autre dans ses commandes', async () => {
      const res = await request(server)
        .get('/api/commandes/colis/mes-commandes')
        .set('Authorization', `Bearer ${clientB}`)
        .expect(200);
      expect(JSON.stringify(res.body)).not.toContain(colisId);
    });

    it('n’annule pas le colis d’un autre client', async () => {
      const res = await request(server)
        .patch(`/api/commandes/colis/${colisId}/annuler`)
        .set('Authorization', `Bearer ${clientB}`)
        .send({});
      refuse(res.status);
      const detail = await request(server)
        .get(`/api/commandes/colis/${colisId}`)
        .set('Authorization', `Bearer ${clientA}`)
        .expect(200);
      expect((detail.body as { statut: string }).statut).not.toBe('annulee');
    });

    it('ne modifie pas l’adresse d’un autre client', async () => {
      const res = await request(server)
        .patch(`/api/adresses/${adresseA}`)
        .set('Authorization', `Bearer ${clientB}`)
        .send({ libelle: 'Piratée' });
      refuse(res.status);
    });

    it('ne lit pas la commande repas d’un autre client', async () => {
      const res = await request(server)
        .get(`/api/commandes/repas/${commandeRepasId}`)
        .set('Authorization', `Bearer ${clientB}`);
      refuse(res.status);
    });

    it('n’accède pas au back-office', async () => {
      await request(server)
        .get('/api/admin/commandes')
        .set('Authorization', `Bearer ${clientA}`)
        .expect(403);
    });
  });

  describe('restaurant', () => {
    it('ne lit pas la commande d’un autre restaurant', async () => {
      const res = await request(server)
        .get(`/api/commandes/repas/${commandeRepasId}`)
        .set('Authorization', `Bearer ${restaurantB}`);
      refuse(res.status);
    });

    it('ne voit pas la commande d’un autre restaurant dans sa liste', async () => {
      const res = await request(server)
        .get('/api/restaurants/me/commandes')
        .set('Authorization', `Bearer ${restaurantB}`)
        .expect(200);
      expect(JSON.stringify(res.body)).not.toContain(commandeRepasId);
    });

    it('n’accepte pas la commande d’un autre restaurant', async () => {
      const res = await request(server)
        .patch(`/api/commandes/repas/${commandeRepasId}/accepter`)
        .set('Authorization', `Bearer ${restaurantB}`);
      refuse(res.status);
      // The right restaurant still can: the refusal changed nothing.
      await request(server)
        .patch(`/api/commandes/repas/${commandeRepasId}/accepter`)
        .set('Authorization', `Bearer ${restaurantA}`)
        .expect(200);
    });
  });

  describe('livreur', () => {
    it('ne lit pas la course prise par un autre livreur', async () => {
      await request(server)
        .patch(`/api/commandes/colis/${colisId}/prendre-en-charge`)
        .set('Authorization', `Bearer ${livreurA}`)
        .expect(200);
      const res = await request(server)
        .get(`/api/commandes/colis/${colisId}`)
        .set('Authorization', `Bearer ${livreurB}`);
      refuse(res.status);
    });

    it('ne voit pas la course d’un autre dans ses courses', async () => {
      const res = await request(server)
        .get('/api/commandes/colis/mes-courses')
        .set('Authorization', `Bearer ${livreurB}`)
        .expect(200);
      expect(JSON.stringify(res.body)).not.toContain(colisId);
    });
  });

  it('sans jeton : 401 sur une route protégée', async () => {
    await request(server).get(`/api/commandes/colis/${colisId}`).expect(401);
  });
});
