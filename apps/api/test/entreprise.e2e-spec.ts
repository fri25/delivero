import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { executerEnPlateforme } from './../src/tenancy/contexte-tenant';

// Étape 8 of docs/plan-migration-multi-tenant.md: the company back-office
// (settings, FedaPay keys, accounts and roles, activity journal, clients).
// A is CHAP EXPRESS (seed, admin_dispatcher = alias of admin_entreprise);
// B is created here with an admin_entreprise.
const DEMO_ADMIN = { telephone: '+22900000004', motDePasse: 'demo12345' };
const MOT_DE_PASSE = 'motdepasse123';

interface AuthBody {
  accessToken: string;
  user: { id: string; role: string; permissions: string[] };
}
interface Utilisateur {
  id: string;
  userId: string;
  role: string;
  statut: string;
}
interface EntreeJournal {
  action: string;
  details: { champs: string[] };
}

describe('Espace entreprise (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let prisma: PrismaService;

  const suffixe = String(Date.now()).slice(-7);
  const B = { id: `tnt_e2e_ent_${suffixe}`, slug: `e2e-ent-${suffixe}` };
  const numero = (n: string) => `+22901${suffixe}${n}`;
  const SECRET_FEDAPAY = `sk_sandbox_e2e_${suffixe}`;

  let adminA: AuthBody;
  let adminB: AuthBody;
  let gestionnaireA: AuthBody;
  let gestionnaireAId: string;
  let adminBMembershipId: string;

  const avec = (token: string, req: request.Test, tenant?: string) => {
    const r = req.set('Authorization', `Bearer ${token}`);
    return tenant ? r.set('X-Tenant', tenant) : r;
  };
  const login = async (identifiants: object, tenant?: string) => {
    let req = request(server).post('/api/auth/login').send(identifiants);
    if (tenant) req = req.set('X-Tenant', tenant);
    return (await req.expect(200)).body as AuthBody;
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
    prisma = app.get(PrismaService);

    const roleAdmin = await prisma.role.findUniqueOrThrow({
      where: { name: 'admin_entreprise' },
    });
    await executerEnPlateforme(async () => {
      await prisma.tenant.create({
        data: { id: B.id, slug: B.slug, nom: 'Entreprise B (e2e)' },
      });
      await prisma.tenantSettings.create({
        data: {
          tenantId: B.id,
          nomCommercial: 'Livraisons B',
          couleurPrimaire: '#000000',
          couleurMarine: '#000000',
          couleurSignal: '#000000',
          ville: 'Djougou',
          pays: 'BJ',
          devise: 'XOF',
          fuseauHoraire: 'Africa/Porto-Novo',
          indicatifTelephone: '+229',
          tauxCommission: 10,
        },
      });
      const admin = await prisma.user.create({
        data: {
          telephone: numero('1'),
          nom: 'Admin B',
          passwordHash: await bcrypt.hash(MOT_DE_PASSE, 4),
          roleId: roleAdmin.id,
        },
      });
      adminBMembershipId = (
        await prisma.membership.create({
          data: { userId: admin.id, tenantId: B.id, roleId: roleAdmin.id },
        })
      ).id;
    });

    // /auth/login allows 5 calls a minute: 3 here.
    adminA = await login(DEMO_ADMIN);
    adminB = await login(
      { telephone: numero('1'), motDePasse: MOT_DE_PASSE },
      B.slug,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('le profil porte les permissions du rôle, admin_dispatcher compris', () => {
    expect(adminA.user.role).toBe('admin_dispatcher');
    expect(adminA.user.permissions).toEqual(
      expect.arrayContaining([
        'entreprise.parametres',
        'entreprise.utilisateurs',
        'journal.consulter',
        'paiements.rembourser',
        'zones.gerer',
      ]),
    );
    expect(adminB.user.role).toBe('admin_entreprise');
  });

  it('un admin invite un gestionnaire', async () => {
    const res = await avec(
      adminA.accessToken,
      request(server).post('/api/admin/entreprise/utilisateurs'),
    )
      .send({
        telephone: numero('2'),
        nom: 'Gestionnaire A',
        role: 'gestionnaire',
        motDePasse: MOT_DE_PASSE,
      })
      .expect(201);
    const cree = res.body as Utilisateur;
    expect(cree).toMatchObject({ role: 'gestionnaire', statut: 'actif' });
    gestionnaireAId = cree.id;

    gestionnaireA = await login({
      telephone: numero('2'),
      motDePasse: MOT_DE_PASSE,
    });
    expect(gestionnaireA.user.permissions).not.toContain(
      'entreprise.parametres',
    );

    // Same number again: refused, one membership per company.
    await avec(
      adminA.accessToken,
      request(server).post('/api/admin/entreprise/utilisateurs'),
    )
      .send({ telephone: numero('2'), nom: 'Doublon', role: 'gestionnaire' })
      .expect(409);
  });

  it('un gestionnaire opère sans réglages, utilisateurs, zones ni remboursements', async () => {
    const g = (req: request.Test) => avec(gestionnaireA.accessToken, req);
    await g(request(server).get('/api/admin/commandes')).expect(200);
    await g(request(server).get('/api/admin/entreprise/clients')).expect(200);
    await g(request(server).get('/api/admin/entreprise/parametres')).expect(
      403,
    );
    await g(request(server).get('/api/admin/entreprise/utilisateurs')).expect(
      403,
    );
    await g(request(server).get('/api/admin/entreprise/journal')).expect(403);
    await g(request(server).get('/api/admin/zones')).expect(403);
    await g(request(server).get('/api/admin/remboursements')).expect(403);
    await g(request(server).get('/api/admin/partenaires')).expect(403);
  });

  it('les réglages modifiés sont servis aussitôt, à cette entreprise seule', async () => {
    const res = await avec(
      adminB.accessToken,
      request(server).patch('/api/admin/entreprise/parametres'),
      B.slug,
    )
      .send({
        nomCommercial: 'Livraisons B modifié',
        couleurPrimaire: '#123456',
        whatsappSupport: '01 57 00 00 01',
      })
      .expect(200);
    expect(res.body).toMatchObject({
      nomCommercial: 'Livraisons B modifié',
      whatsappSupport: '+2290157000001',
      tauxCommission: 10,
    });

    const tenantB = await request(server)
      .get('/api/tenant')
      .set('X-Tenant', B.slug)
      .expect(200);
    expect(tenantB.body).toMatchObject({
      nomCommercial: 'Livraisons B modifié',
      couleurPrimaire: '#123456',
    });
    const tenantA = await request(server).get('/api/tenant').expect(200);
    expect(tenantA.body).toMatchObject({
      nomCommercial: 'ChapExpress',
      couleurPrimaire: '#1450d8',
    });

    await avec(
      adminB.accessToken,
      request(server).patch('/api/admin/entreprise/parametres'),
      B.slug,
    )
      .send({ couleurPrimaire: 'bleu', tauxCommission: 150 })
      .expect(400);
  });

  it('les clés FedaPay sont enregistrées chiffrées et jamais réaffichées', async () => {
    const res = await avec(
      adminB.accessToken,
      request(server).put('/api/admin/entreprise/fedapay'),
      B.slug,
    )
      .send({
        cleSecrete: SECRET_FEDAPAY,
        secretWebhook: `wh_e2e_${suffixe}`,
        environnement: 'sandbox',
      })
      .expect(200);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_FEDAPAY);
    expect((res.body as { fedapay: object }).fedapay).toMatchObject({
      configure: true,
      source: 'entreprise',
      environnement: 'sandbox',
      cheminWebhook: `/api/paiements/webhook/fedapay/${B.slug}`,
    });

    const stocke = await prisma.tenantSecret.findUniqueOrThrow({
      where: { tenantId_cle: { tenantId: B.id, cle: 'fedapay.cle_secrete' } },
    });
    expect(stocke.valeurChiffree).not.toContain(SECRET_FEDAPAY);

    const lu = await avec(
      adminB.accessToken,
      request(server).get('/api/admin/entreprise/parametres'),
      B.slug,
    ).expect(200);
    expect(JSON.stringify(lu.body)).not.toContain(SECRET_FEDAPAY);
  });

  it('le journal trace les écritures, sans leurs valeurs, par entreprise', async () => {
    const journal = async (token: string, tenant?: string) =>
      (
        (
          await avec(
            token,
            request(server).get('/api/admin/entreprise/journal?limite=200'),
            tenant,
          ).expect(200)
        ).body as { entrees: EntreeJournal[] }
      ).entrees;

    const deB = await journal(adminB.accessToken, B.slug);
    const fedapay = deB.find(
      (e) => e.action === 'PUT /api/admin/entreprise/fedapay',
    );
    expect(fedapay?.details.champs).toEqual(
      expect.arrayContaining(['cleSecrete', 'secretWebhook']),
    );
    expect(JSON.stringify(deB)).not.toContain(SECRET_FEDAPAY);
    expect(deB.map((e) => e.action)).toContain(
      'PATCH /api/admin/entreprise/parametres',
    );
    // A's invitation is not in B's journal, and the reverse.
    expect(deB.map((e) => e.action)).not.toContain(
      'POST /api/admin/entreprise/utilisateurs',
    );
    const deA = await journal(adminA.accessToken);
    expect(deA.map((e) => e.action)).toContain(
      'POST /api/admin/entreprise/utilisateurs',
    );
    expect(deA.map((e) => e.action)).not.toContain(
      'PUT /api/admin/entreprise/fedapay',
    );
  });

  it('un admin ne touche pas aux comptes d’une autre entreprise', async () => {
    const liste = await avec(
      adminA.accessToken,
      request(server).get('/api/admin/entreprise/utilisateurs'),
    ).expect(200);
    expect((liste.body as Utilisateur[]).map((u) => u.id)).not.toContain(
      adminBMembershipId,
    );
    await avec(
      adminA.accessToken,
      request(server).patch(
        `/api/admin/entreprise/utilisateurs/${adminBMembershipId}`,
      ),
    )
      .send({ statut: 'suspendu' })
      .expect(404);
  });

  it('un admin ne peut pas modifier son propre accès', async () => {
    await avec(
      adminB.accessToken,
      request(server).patch(
        `/api/admin/entreprise/utilisateurs/${adminBMembershipId}`,
      ),
      B.slug,
    )
      .send({ statut: 'suspendu' })
      .expect(403);
  });

  it('suspendre un gestionnaire lui ferme l’accès aussitôt', async () => {
    const res = await avec(
      adminA.accessToken,
      request(server).patch(
        `/api/admin/entreprise/utilisateurs/${gestionnaireAId}`,
      ),
    )
      .send({ statut: 'suspendu' })
      .expect(200);
    expect((res.body as Utilisateur).statut).toBe('suspendu');
    await avec(
      gestionnaireA.accessToken,
      request(server).get('/api/admin/commandes'),
    ).expect(401);
  });

  it('la liste des clients ne montre que ceux de l’entreprise', async () => {
    await request(server)
      .post('/api/auth/register')
      .set('X-Tenant', B.slug)
      .send({
        telephone: numero('3'),
        motDePasse: MOT_DE_PASSE,
        nom: 'Client B',
      })
      .expect(201);
    const res = await avec(
      adminB.accessToken,
      request(server).get('/api/admin/entreprise/clients'),
      B.slug,
    ).expect(200);
    const corps = res.body as {
      total: number;
      clients: { telephone: string; commandes: number }[];
    };
    expect(corps.total).toBe(1);
    expect(corps.clients[0]).toMatchObject({
      telephone: numero('3'),
      commandes: 0,
    });
  });
});
