import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  executerDansTenant,
  executerEnPlateforme,
} from './../src/tenancy/contexte-tenant';

// Étape 7 of docs/plan-migration-multi-tenant.md: row-level security, the
// barrier that holds even when the Prisma extension is bypassed. Raw SQL is
// never filtered by the extension: only the database policies stand here.
// The API connects as a role without BYPASSRLS (setup-e2e.ts).
describe('Sécurité par ligne PostgreSQL (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const autre = `tnt_e2e_rls_${String(Date.now()).slice(-7)}`;

  const compter = (sql: string) =>
    prisma
      .$queryRawUnsafe<{ n: bigint }[]>(sql)
      .then(([ligne]) => Number(ligne.n));

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    // A second company with one zone, created in platform mode.
    await executerEnPlateforme(async () => {
      await prisma.tenant.create({
        data: { id: autre, slug: autre.replace(/_/g, '-'), nom: 'RLS e2e' },
      });
      await prisma.zone.create({
        data: { tenantId: autre, nom: `Zone RLS ${autre}` },
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('l’API se connecte avec un rôle soumis aux politiques', async () => {
    const [role] = await prisma.$queryRawUnsafe<
      { rolsuper: boolean; rolbypassrls: boolean }[]
    >(
      'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
    );
    expect(role).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it('une requête brute ne voit que l’entreprise de son contexte', async () => {
    const chezA = await executerDansTenant('tnt_chapexpress', () =>
      compter(`SELECT count(*) AS n FROM zones WHERE tenant_id = '${autre}'`),
    );
    expect(chezA).toBe(0);
    const chezAutre = await executerDansTenant(autre, () =>
      compter(`SELECT count(*) AS n FROM zones`),
    );
    expect(chezAutre).toBe(1);
  });

  it('sans contexte, une requête brute ne voit rien', async () => {
    expect(await compter('SELECT count(*) AS n FROM commandes')).toBe(0);
    expect(await compter('SELECT count(*) AS n FROM zones')).toBe(0);
  });

  it('le mode plateforme voit toutes les entreprises', async () => {
    const toutes = await executerEnPlateforme(() =>
      compter(
        `SELECT count(DISTINCT tenant_id) AS n FROM zones WHERE tenant_id IN ('tnt_chapexpress', '${autre}')`,
      ),
    );
    expect(toutes).toBe(2);
  });

  it('une écriture brute ne peut ni modifier ni créer chez une autre entreprise', async () => {
    const modifiees = await executerDansTenant('tnt_chapexpress', () =>
      prisma.$executeRawUnsafe(
        `UPDATE zones SET description = 'piratée' WHERE tenant_id = '${autre}'`,
      ),
    );
    expect(modifiees).toBe(0);
    await expect(
      executerDansTenant('tnt_chapexpress', () =>
        prisma.$executeRawUnsafe(
          `INSERT INTO zones (id, nom, tenant_id) VALUES ('z_rls_${autre}', 'Intruse', '${autre}')`,
        ),
      ),
    ).rejects.toThrow();
  });
});
