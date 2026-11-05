import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

// CHAP EXPRESS as tenant n°1, inserted by migration plateforme_tenants
// (docs/plan-migration-multi-tenant.md, étape 1). Its settings are the values
// the application already applies: a later migration must not change them
// behind anyone's back.
describe('Plateforme : entreprise CHAP EXPRESS (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('existe avec son identifiant fixe, active', async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: 'tnt_chapexpress' },
    });
    expect(tenant).toMatchObject({ slug: 'chapexpress', statut: 'actif' });
  });

  it('porte les réglages appliqués aujourd’hui', async () => {
    const parametres = await prisma.tenantSettings.findUniqueOrThrow({
      where: { tenantId: 'tnt_chapexpress' },
    });
    expect(Number(parametres.tauxCommission)).toBe(15);
    expect(parametres).toMatchObject({
      devise: 'XOF',
      fuseauHoraire: 'Africa/Porto-Novo',
      indicatifTelephone: '+229',
      couleurPrimaire: '#1450d8',
    });
  });

  it('ouvre les services et paiements de la V1, et seulement eux', async () => {
    const fonctionnalites = await prisma.tenantFeature.findMany({
      where: { tenantId: 'tnt_chapexpress', actif: true },
      orderBy: { code: 'asc' },
    });
    expect(fonctionnalites.map((f) => f.code)).toEqual([
      'paiement.mobile_money',
      'service.colis',
      'service.courses_express',
      'service.repas',
    ]);
  });

  // Étape 2: the 21 business tables (docs/architecture-multi-tenant.md § 1.3).
  const TABLES_METIER = [
    'abonnements_push',
    'adresses',
    'articles_emplettes',
    'clotures_caisse',
    'commandes',
    'commandes_colis',
    'commandes_courses_express',
    'commandes_emplettes',
    'commandes_repas',
    'etapes_courses_express',
    'grilles_tarifaires_colis',
    'grilles_tarifaires_courses_express',
    'lignes_commande_repas',
    'livreurs',
    'mouvements_portefeuille',
    'notations',
    'paiements',
    'partenaires',
    'plats',
    'quartiers',
    'zones',
  ];

  it('chaque table métier porte tenant_id, obligatoire', async () => {
    const colonnes = await prisma.$queryRaw<
      { table_name: string; is_nullable: string }[]
    >`
      SELECT table_name, is_nullable FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'tenant_id'
      AND table_name = ANY(${TABLES_METIER})`;
    expect(colonnes.map((c) => c.table_name).sort()).toEqual(TABLES_METIER);
    expect(colonnes.every((c) => c.is_nullable === 'NO')).toBe(true);
  });

  it('toute ligne métier appartient à CHAP EXPRESS ou à une entreprise de test', async () => {
    // Since étape 4 the isolation suite creates a second company
    // (tnt_e2e_…); nothing may belong to anything else.
    for (const table of TABLES_METIER) {
      const [{ n }] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
        `SELECT count(*) AS n FROM "${table}"
         WHERE tenant_id <> 'tnt_chapexpress' AND tenant_id NOT LIKE 'tnt_e2e_%'`,
      );
      expect({ table, autres: Number(n) }).toEqual({ table, autres: 0 });
    }
  });

  it('a un abonnement actif à l’offre pilote', async () => {
    const abonnement = await prisma.subscription.findUniqueOrThrow({
      where: { tenantId: 'tnt_chapexpress' },
      include: { plan: true },
    });
    expect(abonnement.statut).toBe('actif');
    expect(abonnement.plan.code).toBe('pilote');
  });
});
