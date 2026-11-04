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

  it('a un abonnement actif à l’offre pilote', async () => {
    const abonnement = await prisma.subscription.findUniqueOrThrow({
      where: { tenantId: 'tnt_chapexpress' },
      include: { plan: true },
    });
    expect(abonnement.statut).toBe('actif');
    expect(abonnement.plan.code).toBe('pilote');
  });
});
