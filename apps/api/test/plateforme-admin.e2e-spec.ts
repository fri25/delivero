import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Étape 9 of docs/plan-migration-multi-tenant.md: the RapidLiv platform
// super-admin (/api/plateforme). The demo super-admin comes from the seed.
const DEMO_PLATEFORME = { telephone: '+22900000009', motDePasse: 'demo12345' };
const DEMO_ADMIN = { telephone: '+22900000004', motDePasse: 'demo12345' };
const MOT_DE_PASSE = 'motdepasse123';

interface Detail {
  id: string;
  slug: string;
  statut: string;
  fonctionnalites: { code: string; ouverte: boolean }[];
  domaines: {
    id: string;
    domaine: string;
    verification: { nom: string; valeur: string };
  }[];
  administrateurs: { telephone: string }[];
}

describe('Plateforme super-admin (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let plateforme: string;
  let adminChap: string;

  const suffixe = String(Date.now()).slice(-7);
  const slug = `e2e-pf-${suffixe}`;
  const adminTelephone = `+22901${suffixe}7`;
  let entreprise: Detail;

  const pf = (req: request.Test) =>
    req.set('Authorization', `Bearer ${plateforme}`);
  const nouvelle = (surcharge: object = {}) => ({
    slug,
    nom: 'Livraisons Plateforme e2e',
    ville: 'Parakou',
    // Test value only: the platform types the rate agreed with the company.
    tauxCommission: 12,
    fonctionnalites: [
      'service.repas',
      'service.colis',
      'paiement.mobile_money',
    ],
    planCode: 'pilote',
    statutAbonnement: 'essai',
    admin: {
      telephone: adminTelephone,
      nom: 'Admin PF',
      motDePasse: MOT_DE_PASSE,
    },
    ...surcharge,
  });

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

    plateforme = (
      (
        await request(server)
          .post('/api/plateforme/auth/connexion')
          .send(DEMO_PLATEFORME)
          .expect(200)
      ).body as { accessToken: string }
    ).accessToken;
    adminChap = (
      (
        await request(server)
          .post('/api/auth/login')
          .send(DEMO_ADMIN)
          .expect(200)
      ).body as { accessToken: string }
    ).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('un admin d’entreprise n’entre pas dans la plateforme', async () => {
    await request(server)
      .get('/api/plateforme/entreprises')
      .set('Authorization', `Bearer ${adminChap}`)
      .expect(403);
    await request(server).get('/api/plateforme/entreprises').expect(401);
    // Its credentials do not open a platform session either.
    await request(server)
      .post('/api/plateforme/auth/connexion')
      .send(DEMO_ADMIN)
      .expect(401);
  });

  it('une session plateforme n’ouvre aucune route d’entreprise', async () => {
    await pf(request(server).get('/api/auth/me')).expect(401);
    await pf(request(server).get('/api/admin/commandes')).expect(401);
  });

  it('liste les entreprises avec leurs statistiques', async () => {
    const res = await pf(
      request(server).get('/api/plateforme/entreprises'),
    ).expect(200);
    const chap = (
      res.body as { id: string; statistiques: { commandes: number } }[]
    ).find((e) => e.id === 'tnt_chapexpress');
    expect(chap?.statistiques.commandes).toEqual(expect.any(Number));
  });

  it('crée une entreprise prête à servir, avec son premier admin', async () => {
    await pf(request(server).post('/api/plateforme/entreprises'))
      .send(nouvelle({ slug: 'admin' }))
      .expect(400);
    await pf(request(server).post('/api/plateforme/entreprises'))
      .send(nouvelle({ tauxCommission: undefined }))
      .expect(400);

    const res = await pf(request(server).post('/api/plateforme/entreprises'))
      .send(nouvelle())
      .expect(201);
    entreprise = res.body as Detail;
    expect(entreprise).toMatchObject({ slug, statut: 'actif' });
    expect(
      entreprise.fonctionnalites.filter((f) => f.ouverte).map((f) => f.code),
    ).toEqual(['service.repas', 'service.colis', 'paiement.mobile_money']);
    expect(entreprise.administrateurs).toEqual([
      expect.objectContaining({ telephone: adminTelephone }),
    ]);

    await pf(request(server).post('/api/plateforme/entreprises'))
      .send(nouvelle())
      .expect(409);

    const tenant = await request(server)
      .get('/api/tenant')
      .set('X-Tenant', slug)
      .expect(200);
    expect(tenant.body).toMatchObject({
      nomCommercial: 'Livraisons Plateforme e2e',
      ville: 'Parakou',
      tauxCommission: 12,
    });

    const login = await request(server)
      .post('/api/auth/login')
      .set('X-Tenant', slug)
      .send({ telephone: adminTelephone, motDePasse: MOT_DE_PASSE })
      .expect(200);
    expect((login.body as { user: { role: string } }).user.role).toBe(
      'admin_entreprise',
    );
  });

  it('les fonctionnalités fermées disparaissent aussitôt', async () => {
    await pf(
      request(server).put(
        `/api/plateforme/entreprises/${entreprise.id}/fonctionnalites`,
      ),
    )
      .send({ ouvertes: ['service.colis', 'paiement.mobile_money'] })
      .expect(200);
    const tenant = await request(server)
      .get('/api/tenant')
      .set('X-Tenant', slug)
      .expect(200);
    expect(
      (tenant.body as { fonctionnalites: string[] }).fonctionnalites,
    ).not.toContain('service.repas');
  });

  it('une entreprise suspendue refuse tout, connexion comprise', async () => {
    await pf(
      request(server).patch(`/api/plateforme/entreprises/${entreprise.id}`),
    )
      .send({ statut: 'suspendu' })
      .expect(200);
    await request(server).get('/api/tenant').set('X-Tenant', slug).expect(403);
    await request(server)
      .post('/api/auth/login')
      .set('X-Tenant', slug)
      .send({ telephone: adminTelephone, motDePasse: MOT_DE_PASSE })
      .expect(403);

    await pf(
      request(server).patch(`/api/plateforme/entreprises/${entreprise.id}`),
    )
      .send({ statut: 'actif' })
      .expect(200);
    await request(server).get('/api/tenant').set('X-Tenant', slug).expect(200);
  });

  it('un domaine n’est vérifié qu’avec son enregistrement TXT', async () => {
    const domaine = `${slug}.invalid`;
    const res = await pf(
      request(server).post(
        `/api/plateforme/entreprises/${entreprise.id}/domaines`,
      ),
    )
      .send({ domaine, principal: true })
      .expect(201);
    const ajoute = (res.body as Detail).domaines.find(
      (d) => d.domaine === domaine,
    );
    expect(ajoute?.verification).toEqual({
      nom: `_rapidliv.${domaine}`,
      valeur: `rapidliv-verification=${entreprise.id}`,
    });
    await pf(
      request(server).post(
        `/api/plateforme/entreprises/${entreprise.id}/domaines/${ajoute?.id}/verification`,
      ),
    ).expect(409);
  });

  it('le journal plateforme trace ses actions', async () => {
    const res = await pf(
      request(server).get(
        '/api/plateforme/journal?entreprise=plateforme&limite=200',
      ),
    ).expect(200);
    const actions = (res.body as { entrees: { action: string }[] }).entrees.map(
      (e) => e.action,
    );
    expect(actions).toContain('POST /api/plateforme/entreprises');
    expect(actions).toContain('PATCH /api/plateforme/entreprises/:id');
  });
});
