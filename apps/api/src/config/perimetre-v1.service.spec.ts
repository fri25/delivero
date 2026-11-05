import { ConfigService } from '@nestjs/config';
import { ModePaiement, TypeService } from '@prisma/client';
import type {
  ParametresEntreprise,
  ParametresTenantService,
} from '../tenancy/parametres-tenant.service';
import { PerimetreV1Service } from './perimetre-v1.service';

// Étape 5: the environment is the platform's ceiling, the company's features
// decide what it opens. Both are needed.
function perimetre(env: Record<string, unknown>, fonctionnalites: string[]) {
  const parametres = {
    courants: () =>
      Promise.resolve<ParametresEntreprise>({
        slug: 'test',
        nomCommercial: 'Test',
        tauxCommission: 15,
        fonctionnalites: new Set(fonctionnalites),
        domainePrincipal: null,
      }),
  } as unknown as ParametresTenantService;
  return new PerimetreV1Service(new ConfigService(env), parametres);
}

describe('PerimetreV1Service', () => {
  const env = {
    SERVICES_ACTIFS: 'repas,colis',
    MODES_PAIEMENT_ACTIFS: 'mobile_money,especes',
    CONTRE_REMBOURSEMENT_ACTIF: true,
  };

  it('ouvre ce que la plateforme et l’entreprise ouvrent toutes les deux', async () => {
    const p = perimetre(env, ['service.repas', 'paiement.mobile_money']);
    await expect(
      p.assertServiceOuvert(TypeService.repas),
    ).resolves.toBeUndefined();
    await expect(
      p.assertModePaiementOuvert(ModePaiement.mobile_money),
    ).resolves.toBeUndefined();
  });

  it('refuse ce que l’entreprise n’a pas ouvert, même ouvert par la plateforme', async () => {
    const p = perimetre(env, ['service.repas']);
    await expect(p.assertServiceOuvert(TypeService.colis)).rejects.toThrow();
    await expect(
      p.assertModePaiementOuvert(ModePaiement.especes),
    ).rejects.toThrow();
    await expect(p.assertContreRemboursementOuvert(5000)).rejects.toThrow();
  });

  it('refuse ce que la plateforme n’a pas ouvert, même ouvert par l’entreprise', async () => {
    const p = perimetre(env, ['service.emplettes']);
    await expect(
      p.assertServiceOuvert(TypeService.emplettes),
    ).rejects.toThrow();
  });

  it('laisse passer un colis sans contre-remboursement', async () => {
    await expect(
      perimetre(env, []).assertContreRemboursementOuvert(undefined),
    ).resolves.toBeUndefined();
  });
});
