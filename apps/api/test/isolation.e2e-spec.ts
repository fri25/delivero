import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { executerEnPlateforme } from './../src/tenancy/contexte-tenant';
import { resolveQuartierId } from './quartiers';

// Isolation between two companies (étape 4 of
// docs/plan-migration-multi-tenant.md, architecture § 4). A is CHAP EXPRESS
// (seed); B is created here, then filled through the API under its own
// X-Tenant header, so the writes go through the company filter too.
const DEMO_LIVREUR = { telephone: '+22900000003', motDePasse: 'demo12345' };
const DEMO_ADMIN = { telephone: '+22900000004', motDePasse: 'demo12345' };
const MOT_DE_PASSE = 'motdepasse123';

interface AuthBody {
  accessToken: string;
  user: { id: string; role: string };
}

function refuse(status: number) {
  expect(status).toBeGreaterThanOrEqual(400);
  expect(status).not.toBe(500);
}

describe('Isolation entre entreprises (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let prisma: PrismaService;

  const suffixe = String(Date.now()).slice(-7);
  const B = { id: `tnt_e2e_${suffixe}`, slug: `e2e-${suffixe}` };
  const numero = (n: string) => `+22901${suffixe}${n}`;

  // Tokens and ids
  let clientA: string;
  let clientAIdentifiants: { telephone: string; motDePasse: string };
  let livreurA: string;
  let adminA: string;
  let adminB: string;
  let clientB: string;
  let restaurantBId: string;
  let quartierBId: string;
  let colisA: string;
  let colisB: string;
  let commandeRepasB: string;
  let zoneBId: string;
  let adresseBId: string;

  const enB = (req: request.Test) => req.set('X-Tenant', B.slug);
  const login = async (identifiants: object, tenant?: string) => {
    let req = request(server).post('/api/auth/login').send(identifiants);
    if (tenant) req = req.set('X-Tenant', tenant);
    const res = await req.expect(200);
    return res.body as AuthBody;
  };
  const inscrire = async (telephone: string, tenant?: string) => {
    let req = request(server)
      .post('/api/auth/register')
      .send({ telephone, motDePasse: MOT_DE_PASSE, nom: 'Client isolation' });
    if (tenant) req = req.set('X-Tenant', tenant);
    return ((await req.expect(201)).body as AuthBody).accessToken;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    // rawBody: the FedaPay webhook signature covers the exact bytes (main.ts).
    app = moduleFixture.createNestApplication({ rawBody: true });
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

    // --- Company B and its admin (platform side, as the étape 9 app will).
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'admin_dispatcher' },
    });
    const adminBTelephone = numero('1');
    await executerEnPlateforme(async () => {
      await prisma.tenant.create({
        data: { id: B.id, slug: B.slug, nom: 'Entreprise B (e2e)' },
      });
      // Étape 5: B has its own settings (a commission of 10 %, test value
      // only) and opens neither cash on delivery nor Courses express.
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
      await prisma.tenantFeature.createMany({
        data: [
          'service.repas',
          'service.colis',
          'paiement.especes',
          'paiement.mobile_money',
        ].map((code) => ({ tenantId: B.id, code, actif: true })),
      });
      const admin = await prisma.user.create({
        data: {
          telephone: adminBTelephone,
          nom: 'Admin B',
          passwordHash: await bcrypt.hash(MOT_DE_PASSE, 4),
          roleId: adminRole.id,
        },
      });
      await prisma.membership.create({
        data: { userId: admin.id, tenantId: B.id, roleId: adminRole.id },
      });
    });

    // /auth/login allows 5 calls a minute: admin B, restaurant B, livreur A,
    // admin A, client A signing in to B.
    adminB = (
      await login(
        { telephone: adminBTelephone, motDePasse: MOT_DE_PASSE },
        B.slug,
      )
    ).accessToken;
    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

    // --- B's catalogue, through B's admin.
    const zoneB = await enB(request(server).post('/api/admin/zones'))
      .set(auth(adminB))
      .send({
        nom: `Zone B ${suffixe}`,
        fraisLivraison: 700,
        tarifBaseColis: 1200,
        tarifBaseCoursesExpress: 1500,
      })
      .expect(201);
    zoneBId = (zoneB.body as { id: string }).id;
    const quartierB = await enB(request(server).post('/api/admin/quartiers'))
      .set(auth(adminB))
      .send({ nom: `Quartier B ${suffixe}`, fraisLivraison: 800 })
      .expect(201);
    quartierBId = (quartierB.body as { id: string }).id;

    const restaurantB = { telephone: numero('2'), motDePasse: MOT_DE_PASSE };
    const partenaire = await enB(request(server).post('/api/admin/partenaires'))
      .set(auth(adminB))
      .send({
        ...restaurantB,
        nom: `Restaurant B ${suffixe}`,
        zoneId: zoneBId,
        pointDeRepere: 'Repère B',
      })
      .expect(201);
    restaurantBId = (partenaire.body as { id: string }).id;
    const restoB = (await login(restaurantB, B.slug)).accessToken;
    const plat = await enB(request(server).post('/api/restaurants/me/plats'))
      .set(auth(restoB))
      .send({ nom: 'Plat B', prix: 2000 })
      .expect(201);
    const platBId = (plat.body as { id: string }).id;
    await enB(request(server).patch('/api/restaurants/me/statut-ouverture'))
      .set(auth(restoB))
      .send({ statutOuverture: true })
      .expect(200);

    // --- A client of B, with orders in B.
    clientB = await inscrire(numero('3'), B.slug);
    const adresseB = await enB(request(server).post('/api/adresses'))
      .set(auth(clientB))
      .send({
        libelle: 'Maison B',
        quartierId: quartierBId,
        pointDeRepere: 'Repère client B',
        estParDefaut: true,
      })
      .expect(201);
    adresseBId = (adresseB.body as { id: string }).id;
    const colis = await enB(request(server).post('/api/commandes/colis'))
      .set(auth(clientB))
      .send({
        adresseEnlevementId: adresseBId,
        zoneId: zoneBId,
        quartierLivraisonId: quartierBId,
        taille: 'petit',
        destinataireNom: 'Destinataire B',
        destinataireTelephone: '+22991234567',
        adresseLivraison: 'Chez B',
        pointDeRepereLivraison: 'Repère livraison B',
        modePaiement: 'especes',
        conditionsAcceptees: true,
      })
      .expect(201);
    colisB = (colis.body as { id: string }).id;
    const repas = await enB(request(server).post('/api/commandes/repas'))
      .set(auth(clientB))
      .send({
        partenaireId: restaurantBId,
        adresseId: adresseBId,
        modePaiement: 'especes',
        lignes: [{ platId: platBId, quantite: 2 }],
      })
      .expect(201);
    commandeRepasB = (repas.body as { id: string }).id;

    // --- Company A (CHAP EXPRESS, no header): a client with a colis.
    clientAIdentifiants = {
      telephone: `+229${Date.now()}`,
      motDePasse: MOT_DE_PASSE,
    };
    clientA = await inscrire(clientAIdentifiants.telephone);
    const quartierAId = await resolveQuartierId(server);
    const adresseA = await request(server)
      .post('/api/adresses')
      .set(auth(clientA))
      .send({
        libelle: 'Maison A',
        quartierId: quartierAId,
        pointDeRepere: 'Repère A',
        estParDefaut: true,
      })
      .expect(201);
    livreurA = (await login(DEMO_LIVREUR)).accessToken;
    const me = await request(server)
      .get('/api/livreurs/me')
      .set(auth(livreurA))
      .expect(200);
    const colisARes = await request(server)
      .post('/api/commandes/colis')
      .set(auth(clientA))
      .send({
        adresseEnlevementId: (adresseA.body as { id: string }).id,
        zoneId: (me.body as { zoneId: string }).zoneId,
        quartierLivraisonId: quartierAId,
        taille: 'petit',
        destinataireNom: 'Destinataire A',
        destinataireTelephone: '+22991234567',
        adresseLivraison: 'Chez A',
        pointDeRepereLivraison: 'Repère livraison A',
        modePaiement: 'especes',
        conditionsAcceptees: true,
      })
      .expect(201);
    colisA = (colisARes.body as { id: string }).id;
    adminA = (await login(DEMO_ADMIN)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('écritures', () => {
    it('tout ce que B crée, en cascade comprise, appartient à B', async () => {
      const lignes = await executerEnPlateforme(
        () =>
          prisma.$queryRaw<{ table: string; autres: bigint; total: bigint }[]>`
          SELECT 'commandes' AS table,
                 count(*) FILTER (WHERE c.tenant_id <> ${B.id}) AS autres, count(*) AS total
          FROM commandes c
          JOIN commandes_colis cc ON cc.commande_id = c.id WHERE cc.id = ${colisB}
          UNION ALL
          SELECT 'commandes_colis', count(*) FILTER (WHERE tenant_id <> ${B.id}), count(*)
          FROM commandes_colis WHERE id = ${colisB}
          UNION ALL
          SELECT 'commandes_repas', count(*) FILTER (WHERE tenant_id <> ${B.id}), count(*)
          FROM commandes_repas WHERE id = ${commandeRepasB}
          UNION ALL
          SELECT 'lignes_commande_repas', count(*) FILTER (WHERE tenant_id <> ${B.id}), count(*)
          FROM lignes_commande_repas WHERE commande_repas_id = ${commandeRepasB}
          UNION ALL
          SELECT 'plats', count(*) FILTER (WHERE tenant_id <> ${B.id}), count(*)
          FROM plats WHERE partenaire_id = ${restaurantBId}
          UNION ALL
          SELECT 'memberships', count(*) FILTER (WHERE tenant_id <> ${B.id}), count(*)
          FROM memberships m JOIN users u ON u.id = m.user_id WHERE u.telephone = ${numero('3')}`,
      );
      for (const ligne of lignes) {
        expect({ table: ligne.table, autres: Number(ligne.autres) }).toEqual({
          table: ligne.table,
          autres: 0,
        });
        expect(Number(ligne.total)).toBeGreaterThan(0);
      }
    });
  });

  describe('lectures publiques', () => {
    it('chaque entreprise ne liste que ses restaurants', async () => {
      const chezB = await enB(request(server).get('/api/restaurants')).expect(
        200,
      );
      const idsB = (chezB.body as Array<{ id: string; nom: string }>).map(
        (r) => r.id,
      );
      expect(idsB).toEqual([restaurantBId]);
      const chezA = await request(server).get('/api/restaurants').expect(200);
      expect(
        (chezA.body as Array<{ id: string }>).map((r) => r.id),
      ).not.toContain(restaurantBId);
    });

    it('chaque entreprise ne liste que ses quartiers', async () => {
      const chezB = await enB(request(server).get('/api/quartiers')).expect(
        200,
      );
      expect((chezB.body as Array<{ id: string }>).map((q) => q.id)).toEqual([
        quartierBId,
      ]);
      const chezA = await request(server).get('/api/quartiers').expect(200);
      expect(
        (chezA.body as Array<{ id: string }>).map((q) => q.id),
      ).not.toContain(quartierBId);
    });

    it('le suivi public d’un colis de B est introuvable chez A', async () => {
      await enB(
        request(server).get(`/api/commandes/colis/suivi/${colisB}`),
      ).expect(200);
      await request(server)
        .get(`/api/commandes/colis/suivi/${colisB}`)
        .expect(404);
    });

    it('une entreprise inconnue est refusée', async () => {
      await request(server)
        .get('/api/restaurants')
        .set('X-Tenant', 'inexistante')
        .expect(404);
    });
  });

  describe('jetons et appartenances', () => {
    it('un jeton de A est refusé chez B, et journalisé', async () => {
      await enB(request(server).get('/api/auth/me'))
        .set(auth(clientA))
        .expect(403);
      const evenements = await executerEnPlateforme(() =>
        prisma.auditLog.count({
          where: { tenantId: B.id, action: 'securite.jeton_autre_entreprise' },
        }),
      );
      expect(evenements).toBeGreaterThan(0);
    });

    it('un jeton de B est refusé chez A', async () => {
      await request(server).get('/api/auth/me').set(auth(clientB)).expect(403);
    });

    it('un client de A qui se connecte chez B y devient client, sans rien voir de A', async () => {
      const session = await login(clientAIdentifiants, B.slug);
      expect(session.user.role).toBe('client');
      const commandes = await enB(
        request(server).get('/api/commandes/colis/mes-commandes'),
      )
        .set(auth(session.accessToken))
        .expect(200);
      expect(JSON.stringify(commandes.body)).not.toContain(colisA);
    });
  });

  describe('accès par identifiant', () => {
    it('un client de B ne lit pas le colis d’un client de A', async () => {
      const res = await enB(
        request(server).get(`/api/commandes/colis/${colisA}`),
      ).set(auth(clientB));
      refuse(res.status);
    });

    it('un livreur de A ne prend pas un colis de B', async () => {
      const res = await request(server)
        .patch(`/api/commandes/colis/${colisB}/prendre-en-charge`)
        .set(auth(livreurA));
      expect(res.status).toBe(404);
      const disponibles = await request(server)
        .get('/api/commandes/colis/disponibles')
        .set(auth(livreurA))
        .expect(200);
      expect(JSON.stringify(disponibles.body)).not.toContain(colisB);
    });

    it('un livreur de A ne lit pas une commande repas de B', async () => {
      const res = await request(server)
        .get(`/api/commandes/repas/${commandeRepasB}`)
        .set(auth(livreurA));
      expect(res.status).toBe(404);
    });
  });

  describe('back-office', () => {
    it('l’admin de A ne voit aucune commande de B', async () => {
      const res = await request(server)
        .get('/api/admin/commandes')
        .set(auth(adminA))
        .expect(200);
      const corps = JSON.stringify(res.body);
      expect(corps).not.toContain(colisB);
      expect(corps).not.toContain(commandeRepasB);
    });

    it('l’admin de B ne voit aucune commande de A', async () => {
      const res = await enB(request(server).get('/api/admin/commandes'))
        .set(auth(adminB))
        .expect(200);
      expect(JSON.stringify(res.body)).not.toContain(colisA);
    });

    it('l’admin de B ne liste que ses restaurants', async () => {
      const res = await enB(request(server).get('/api/admin/partenaires'))
        .set(auth(adminB))
        .expect(200);
      expect((res.body as Array<{ id: string }>).map((p) => p.id)).toEqual([
        restaurantBId,
      ]);
    });
  });

  // Étape 6: what the apps read to show the company's identity.
  describe('identité publique (GET /tenant)', () => {
    it('CHAP EXPRESS garde son nom, sa ville et ses 15 %', async () => {
      const res = await request(server).get('/api/tenant').expect(200);
      expect(res.body).toMatchObject({
        slug: 'chapexpress',
        nomCommercial: 'ChapExpress',
        ville: 'Natitingou',
        tauxCommission: 15,
        couleurPrimaire: '#1450d8',
      });
    });

    it('B voit son identité et seulement ce qu’elle ouvre', async () => {
      const res = await enB(request(server).get('/api/tenant')).expect(200);
      expect(res.body).toMatchObject({
        slug: B.slug,
        nomCommercial: 'Livraisons B',
        ville: 'Djougou',
        tauxCommission: 10,
      });
      expect(
        (res.body as { fonctionnalites: string[] }).fonctionnalites,
      ).toEqual([
        'paiement.especes',
        'paiement.mobile_money',
        'service.colis',
        'service.repas',
      ]);
    });

    it('ne livre ni secret ni liste de domaines', async () => {
      const res = await enB(request(server).get('/api/tenant')).expect(200);
      const corps = JSON.stringify(res.body).toLowerCase();
      for (const interdit of ['secret', 'cle', 'fedapay', 'domaine']) {
        expect(corps).not.toContain(interdit);
      }
    });
  });

  // Étape 5: settings, features and FedaPay account per company.
  describe('configuration par entreprise', () => {
    it('B est facturée à sa propre commission (10 %), pas aux 15 % de CHAP EXPRESS', async () => {
      const repas = await executerEnPlateforme(() =>
        prisma.commandeRepas.findUniqueOrThrow({
          where: { id: commandeRepasB },
          include: { commande: true },
        }),
      );
      const base =
        Number(repas.commande.sousTotal) +
        Number(repas.commande.fraisLivraison);
      expect(Number(repas.commande.commission)).toBe(Math.round(base * 0.1));
      expect(Number(repas.commande.commission)).not.toBe(
        Math.round(base * 0.15),
      );
    });

    it('B refuse le contre-remboursement, qu’elle n’a pas ouvert', async () => {
      await enB(request(server).post('/api/commandes/colis'))
        .set(auth(clientB))
        .send({
          adresseEnlevementId: adresseBId,
          zoneId: zoneBId,
          quartierLivraisonId: quartierBId,
          taille: 'petit',
          destinataireNom: 'Destinataire B',
          destinataireTelephone: '+22991234567',
          adresseLivraison: 'Chez B',
          pointDeRepereLivraison: 'Repère livraison B',
          modePaiement: 'especes',
          montantContreRemboursement: 5000,
          conditionsAcceptees: true,
        })
        .expect(403);
    });

    describe('webhook FedaPay', () => {
      const transactionB = `tx-e2e-${suffixe}`;
      const corps = JSON.stringify({
        name: 'transaction.approved',
        entity: { id: transactionB },
      });
      // Signed with CHAP EXPRESS's secret (setup-e2e.ts).
      const signatureChapExpress = () => {
        const t = Math.floor(Date.now() / 1000);
        const hmac = createHmac('sha256', 'wh_e2e_chapexpress')
          .update(`${t}.${corps}`, 'utf8')
          .digest('hex');
        return `t=${t},s=${hmac}`;
      };

      beforeAll(async () => {
        await executerEnPlateforme(async () => {
          const repas = await prisma.commandeRepas.findUniqueOrThrow({
            where: { id: commandeRepasB },
          });
          await prisma.paiement.update({
            where: { commandeId: repas.commandeId },
            data: { referenceTransaction: transactionB },
          });
        });
      });

      const statutPaiementB = () =>
        executerEnPlateforme(async () => {
          const paiement = await prisma.paiement.findUniqueOrThrow({
            where: { referenceTransaction: transactionB },
          });
          return paiement.statut;
        });

      it('signé par CHAP EXPRESS pour un paiement de B : accusé, ignoré, journalisé', async () => {
        const avant = await statutPaiementB();
        await request(server)
          .post('/api/paiements/webhook/fedapay')
          .set('Content-Type', 'application/json')
          .set('X-FEDAPAY-SIGNATURE', signatureChapExpress())
          .send(corps)
          .expect(200);
        expect(await statutPaiementB()).toBe(avant);
        const evenements = await executerEnPlateforme(() =>
          prisma.auditLog.count({
            where: { action: 'securite.webhook_autre_entreprise' },
          }),
        );
        expect(evenements).toBeGreaterThan(0);
      });

      it('sur l’adresse de B, la clé de CHAP EXPRESS ne signe pas', async () => {
        await request(server)
          .post(`/api/paiements/webhook/fedapay/${B.slug}`)
          .set('Content-Type', 'application/json')
          .set('X-FEDAPAY-SIGNATURE', signatureChapExpress())
          .send(corps)
          .expect(401);
      });

      it('une adresse d’entreprise inconnue est refusée', async () => {
        await request(server)
          .post('/api/paiements/webhook/fedapay/inconnue')
          .set('Content-Type', 'application/json')
          .send(corps)
          .expect(404);
      });
    });
  });
});
