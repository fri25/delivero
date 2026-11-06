import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import {
  executerDansTenant,
  executerEnPlateforme,
} from './../src/tenancy/contexte-tenant';

// Étape 3 of docs/plan-migration-multi-tenant.md: the role comes from the
// membership in CHAP EXPRESS, users.role_id only as a fallback. Login and
// access by role for every role are already covered by the other suites; this
// one covers what the membership adds.
describe('Appartenances (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let prisma: PrismaService;
  // Memberships are scoped to a company since étape 4.
  const chez = <T>(fn: () => T | PromiseLike<T>) =>
    executerDansTenant('tnt_chapexpress', fn);

  const inscrire = async () => {
    const telephone = `+229${Date.now()}${Math.floor(Math.random() * 10)}`;
    const res = await request(server)
      .post('/api/auth/register')
      .send({ telephone, motDePasse: 'motdepasse123', nom: 'Membre E2E' })
      .expect(201);
    const body = res.body as {
      accessToken: string;
      user: { id: string; role: string };
    };
    return { telephone, token: body.accessToken, user: body.user };
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('tout compte existant est membre d’une entreprise avec son rôle', async () => {
    // Since étape 4 the isolation suite adds accounts of a second company:
    // every account belongs to at least one, CHAP EXPRESS or that one.
    // Across companies: platform mode, or RLS (étape 7) hides memberships.
    // users.role_id is the CHAP EXPRESS fallback: only its memberships must
    // match it (an account of another company has its own role there).
    const sansAppartenance = await executerEnPlateforme(() =>
      prisma.user.count({ where: { memberships: { none: {} } } }),
    );
    expect(sansAppartenance).toBe(0);
    const roleDivergent = await executerEnPlateforme(
      () => prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM memberships m JOIN users u ON u.id = m.user_id
      WHERE m.tenant_id = 'tnt_chapexpress' AND m.role_id <> u.role_id`,
    );
    expect(Number(roleDivergent[0].n)).toBe(0);
  });

  it('l’inscription crée l’appartenance client', async () => {
    const { user } = await inscrire();
    expect(user.role).toBe('client');
    const appartenance = await chez(() =>
      prisma.membership.findUnique({
        where: {
          userId_tenantId: { userId: user.id, tenantId: 'tnt_chapexpress' },
        },
        include: { role: true },
      }),
    );
    expect(appartenance?.statut).toBe('actif');
    expect(appartenance?.role.name).toBe('client');
  });

  it('une appartenance suspendue ferme l’accès, jeton en cours compris', async () => {
    const { telephone, token, user } = await inscrire();
    await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await chez(() =>
      prisma.membership.update({
        where: {
          userId_tenantId: { userId: user.id, tenantId: 'tnt_chapexpress' },
        },
        data: { statut: 'suspendu' },
      }),
    );

    await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
    await request(server)
      .post('/api/auth/login')
      .send({ telephone, motDePasse: 'motdepasse123' })
      .expect(401);
  });

  it('un compte sans appartenance garde son rôle historique', async () => {
    // Account created by the previous API version during a deployment.
    const { token, user } = await inscrire();
    await chez(() =>
      prisma.membership.deleteMany({ where: { userId: user.id } }),
    );
    const res = await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect((res.body as { role: string }).role).toBe('client');
  });

  it('le rôle de l’appartenance prime sur la colonne historique', async () => {
    const { token, user } = await inscrire();
    const livreur = await prisma.role.findUniqueOrThrow({
      where: { name: 'livreur' },
    });
    await chez(() =>
      prisma.membership.update({
        where: {
          userId_tenantId: { userId: user.id, tenantId: 'tnt_chapexpress' },
        },
        data: { roleId: livreur.id },
      }),
    );
    // users.role_id still says client: the client route must now refuse.
    await request(server)
      .get('/api/commandes/colis/mes-commandes')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
