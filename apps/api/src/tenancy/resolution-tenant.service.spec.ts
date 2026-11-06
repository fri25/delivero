import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { PrismaService } from '../prisma/prisma.service';
import { ResolutionTenantService } from './resolution-tenant.service';

// Étape 10 of docs/plan-migration-multi-tenant.md: an unknown domain is
// refused unless ENTREPRISE_REPLI names a fallback company.
const TENANTS: Record<string, { id: string; statut: string }> = {
  chapexpress: { id: 'tnt_chapexpress', statut: 'actif' },
  demo: { id: 'tnt_demo', statut: 'actif' },
  fermee: { id: 'tnt_fermee', statut: 'suspendu' },
};
const DOMAINES: Record<string, string> = {
  'demo.rapidliv.com': 'demo',
  'fermee.rapidliv.com': 'fermee',
};

function service(repli: string) {
  const prisma = {
    tenant: {
      findUnique: ({ where }: { where: { slug: string } }) =>
        Promise.resolve(TENANTS[where.slug] ?? null),
    },
    tenantDomain: {
      findUnique: ({ where }: { where: { domaine: string } }) => {
        const slug = DOMAINES[where.domaine];
        return Promise.resolve(slug ? { tenant: TENANTS[slug] } : null);
      },
    },
  } as unknown as PrismaService;
  const config = {
    get: (cle: string) => (cle === 'ENTREPRISE_REPLI' ? repli : undefined),
  } as unknown as ConfigService;
  return new ResolutionTenantService(prisma, config);
}

const requete = (entetes: Record<string, string>) =>
  ({ header: (nom: string) => entetes[nom.toLowerCase()] }) as Request;

describe('ResolutionTenantService', () => {
  it('reconnaît une entreprise par son domaine, en-tête X-Tenant en priorité', async () => {
    const s = service('');
    await expect(
      s.resoudre(requete({ origin: 'https://demo.rapidliv.com' })),
    ).resolves.toBe('tnt_demo');
    await expect(
      s.resoudre(
        requete({
          'x-tenant': 'chapexpress',
          origin: 'https://demo.rapidliv.com',
        }),
      ),
    ).resolves.toBe('tnt_chapexpress');
  });

  it('refuse un domaine inconnu sans entreprise de repli', async () => {
    await expect(
      service('').resoudre(requete({ origin: 'https://inconnu.exemple.bj' })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('sert l’entreprise de repli quand elle est configurée', async () => {
    await expect(
      service('chapexpress').resoudre(requete({ host: 'localhost:3000' })),
    ).resolves.toBe('tnt_chapexpress');
  });

  it('refuse une entreprise de repli inconnue plutôt que de deviner', async () => {
    await expect(
      service('nexiste-pas').resoudre(requete({ host: 'localhost:3000' })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuse une entreprise suspendue, par domaine comme par en-tête', async () => {
    const s = service('chapexpress');
    await expect(
      s.resoudre(requete({ origin: 'https://fermee.rapidliv.com' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      s.resoudre(requete({ 'x-tenant': 'fermee' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
