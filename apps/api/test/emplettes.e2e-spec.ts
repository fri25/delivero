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
interface AdresseBody {
  id: string;
}
interface ArticleBody {
  id: string;
  libelle: string;
  statut: string;
}
interface CommandeEmplettesBody {
  id: string;
  statut: string;
  budgetMax: string;
  montantReel: string | null;
  articles: ArticleBody[];
  commande: { montantTotal: string | number | null };
}

describe('Emplettes (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let clientToken: string;
  let clientAdresseId: string;
  let livreurToken: string;
  let zoneId: string;

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
    server = app.getHttpServer();

    const telephone = `+229${Date.now()}`;
    const registerRes = await request(server)
      .post('/api/auth/register')
      .send({
        telephone,
        motDePasse: 'motdepasse123',
        nom: 'Client Emplettes E2E',
      })
      .expect(201);
    clientToken = (registerRes.body as AuthResponseBody).accessToken;

    const adresseRes = await request(server)
      .post('/api/adresses')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        libelle: 'Domicile',
        pointDeRepere: 'Repère e2e emplettes',
        estParDefaut: true,
      })
      .expect(201);
    clientAdresseId = (adresseRes.body as AdresseBody).id;

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

  function creerCommande(budgetMax: number, libelles: string[]) {
    return request(server)
      .post('/api/commandes/emplettes')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        mode: 'liste_libre',
        zoneId,
        adresseId: clientAdresseId,
        lieuAchat: 'Marché central',
        budgetMax,
        modeFinancement: 'especes_livraison',
        articles: libelles.map((libelle) => ({ libelle })),
      });
  }

  it('estimation : total indicatif retourné', async () => {
    const res = await request(server)
      .get('/api/commandes/emplettes/estimation')
      .set('Authorization', `Bearer ${clientToken}`)
      .query({ zoneId, budgetMax: 5000 })
      .expect(200);
    const body = res.body as { totalEstime: number };
    expect(body.totalEstime).toBeGreaterThan(5000);
  });

  it('mode catalogue rejeté explicitement', async () => {
    const res = await creerCommande(5000, ['Tomates']);
    // remplacer le mode par catalogue dans une requête séparée
    await request(server)
      .post('/api/commandes/emplettes')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        mode: 'catalogue',
        zoneId,
        adresseId: clientAdresseId,
        budgetMax: 5000,
        modeFinancement: 'especes_livraison',
        articles: [{ libelle: 'Tomates' }],
      })
      .expect(400);
    expect(res.status).toBe(201);
  });

  it('parcours complet sans dépassement : pointage -> achats_termines -> en_route -> livree', async () => {
    const createRes = await creerCommande(10000, ['Tomates', 'Oignons']);
    expect(createRes.status).toBe(201);
    const commande = createRes.body as CommandeEmplettesBody;
    expect(commande.statut).toBe('confirmee');
    const id = commande.id;
    const [article1, article2] = commande.articles;

    const disponiblesRes = await request(server)
      .get('/api/commandes/emplettes/disponibles')
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    expect(
      (disponiblesRes.body as CommandeEmplettesBody[]).some((c) => c.id === id),
    ).toBe(true);

    await request(server)
      .patch(`/api/commandes/emplettes/${id}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    await request(server)
      .patch(`/api/commandes/emplettes/${id}/articles/${article1.id}/pointer`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ statut: 'achete', prixReel: 1500 })
      .expect(200);

    const apresPointage1 = await request(server)
      .patch(`/api/commandes/emplettes/${id}/articles/${article2.id}/pointer`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ statut: 'indisponible' })
      .expect(200);
    expect((apresPointage1.body as CommandeEmplettesBody).statut).toBe(
      'achats_en_cours',
    );
    expect(
      Number((apresPointage1.body as CommandeEmplettesBody).montantReel),
    ).toBe(1500);

    const terminesRes = await request(server)
      .patch(`/api/commandes/emplettes/${id}/achats-termines`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({
        recapitulatifAchats: 'Tomates achetées 1500F, oignons indisponibles.',
      })
      .expect(200);
    const termines = terminesRes.body as CommandeEmplettesBody;
    expect(termines.statut).toBe('achats_termines');
    expect(Number(termines.commande.montantTotal)).toBeGreaterThan(1500);

    await request(server)
      .patch(`/api/commandes/emplettes/${id}/en-route`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    const livreeRes = await request(server)
      .patch(`/api/commandes/emplettes/${id}/livree`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);
    expect((livreeRes.body as CommandeEmplettesBody).statut).toBe('livree');
  });

  it('dépassement de budget : blocage puis refus du client -> annulee', async () => {
    const createRes = await creerCommande(1000, ['Riz', 'Huile']);
    const commande = createRes.body as CommandeEmplettesBody;
    const id = commande.id;
    const [article1, article2] = commande.articles;

    await request(server)
      .patch(`/api/commandes/emplettes/${id}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    const depassementRes = await request(server)
      .patch(`/api/commandes/emplettes/${id}/articles/${article1.id}/pointer`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ statut: 'achete', prixReel: 1500 })
      .expect(200);
    expect((depassementRes.body as CommandeEmplettesBody).statut).toBe(
      'validation_depassement',
    );

    // Tentative de pointer un autre article pendant le blocage -> 409.
    await request(server)
      .patch(`/api/commandes/emplettes/${id}/articles/${article2.id}/pointer`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ statut: 'achete', prixReel: 500 })
      .expect(409);

    const refusRes = await request(server)
      .patch(`/api/commandes/emplettes/${id}/valider-depassement`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ accepter: false })
      .expect(200);
    expect((refusRes.body as CommandeEmplettesBody).statut).toBe('annulee');
  });

  it('dépassement de budget : acceptation du client -> reprise des achats -> pointages suivants non bloquants', async () => {
    const createRes = await creerCommande(1000, ['Riz', 'Huile']);
    const commande = createRes.body as CommandeEmplettesBody;
    const id = commande.id;
    const [article1, article2] = commande.articles;

    await request(server)
      .patch(`/api/commandes/emplettes/${id}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    await request(server)
      .patch(`/api/commandes/emplettes/${id}/articles/${article1.id}/pointer`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ statut: 'achete', prixReel: 1500 })
      .expect(200);

    const accepteRes = await request(server)
      .patch(`/api/commandes/emplettes/${id}/valider-depassement`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ accepter: true })
      .expect(200);
    expect((accepteRes.body as CommandeEmplettesBody).statut).toBe(
      'achats_en_cours',
    );

    // Un article pointé après acceptation, alors que le budget est toujours
    // dépassé, ne doit PAS re-déclencher validation_depassement : sinon la
    // commande resterait bloquée indéfiniment après la première validation.
    const apresReprise = await request(server)
      .patch(`/api/commandes/emplettes/${id}/articles/${article2.id}/pointer`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ statut: 'indisponible' })
      .expect(200);
    expect((apresReprise.body as CommandeEmplettesBody).statut).toBe(
      'achats_en_cours',
    );

    const terminesRes = await request(server)
      .patch(`/api/commandes/emplettes/${id}/achats-termines`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ recapitulatifAchats: 'Riz acheté 1500F, huile indisponible.' })
      .expect(200);
    expect((terminesRes.body as CommandeEmplettesBody).statut).toBe(
      'achats_termines',
    );
  });

  it('livreur non attributaire : refusé sur le pointage', async () => {
    const createRes = await creerCommande(5000, ['Sucre']);
    const commande = createRes.body as CommandeEmplettesBody;
    const [article] = commande.articles;

    await request(server)
      .patch(
        `/api/commandes/emplettes/${commande.id}/articles/${article.id}/pointer`,
      )
      .set('Authorization', `Bearer ${livreurToken}`)
      .send({ statut: 'achete', prixReel: 100 })
      .expect(403);
  });

  it('deux prises en charge concurrentes : une seule réussit', async () => {
    const createRes = await creerCommande(5000, ['Piment']);
    const id = (createRes.body as CommandeEmplettesBody).id;

    const [first, second] = await Promise.all([
      request(server)
        .patch(`/api/commandes/emplettes/${id}/prendre-en-charge`)
        .set('Authorization', `Bearer ${livreurToken}`),
      request(server)
        .patch(`/api/commandes/emplettes/${id}/prendre-en-charge`)
        .set('Authorization', `Bearer ${livreurToken}`),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  it('transition illégale : en-route sans être passé par achats_termines -> 409, statut inchangé', async () => {
    const createRes = await creerCommande(5000, ['Savon']);
    const id = (createRes.body as CommandeEmplettesBody).id;

    await request(server)
      .patch(`/api/commandes/emplettes/${id}/prendre-en-charge`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(200);

    // Statut réel après prise en charge : achats_en_cours, pas
    // achats_termines -> en-route doit être refusé.
    await request(server)
      .patch(`/api/commandes/emplettes/${id}/en-route`)
      .set('Authorization', `Bearer ${livreurToken}`)
      .expect(409);

    const detailRes = await request(server)
      .get(`/api/commandes/emplettes/${id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    expect((detailRes.body as CommandeEmplettesBody).statut).toBe(
      'achats_en_cours',
    );
  });
});
