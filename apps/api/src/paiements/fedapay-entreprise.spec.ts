import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { TENANT_PAR_DEFAUT } from '../auth/appartenance';
import { executerDansTenant } from '../tenancy/contexte-tenant';
import type { SecretsTenantService } from '../tenancy/secrets-tenant.service';
import { FedapayClient } from './fedapay.client';

// Étape 5 of docs/plan-migration-multi-tenant.md, decision Q-MT-4: each
// company collects on its own FedaPay account.
const ENV = {
  FEDAPAY_SECRET_KEY: 'sk_env_chapexpress',
  FEDAPAY_WEBHOOK_SECRET: 'wh_env_chapexpress',
};
const CORPS = '{"name":"transaction.approved","entity":{"id":1}}';
const maintenant = 1_760_000_000;
const signer = (secret: string) =>
  `t=${maintenant},s=${createHmac('sha256', secret).update(`${maintenant}.${CORPS}`, 'utf8').digest('hex')}`;

function client(secrets: Record<string, Record<string, string>>) {
  const secretsService = {
    lire: (tenantId: string, cle: string) =>
      Promise.resolve(secrets[tenantId]?.[cle] ?? null),
  } as unknown as SecretsTenantService;
  return new FedapayClient(new ConfigService(ENV), secretsService);
}

describe('FedaPay par entreprise', () => {
  it('CHAP EXPRESS sans clé en base garde ses variables FEDAPAY_*', async () => {
    const fedapay = client({});
    await expect(
      executerDansTenant(TENANT_PAR_DEFAUT, () => fedapay.estConfigure()),
    ).resolves.toBe(true);
    await expect(
      fedapay.verifierSignatureWebhook(
        CORPS,
        signer('wh_env_chapexpress'),
        TENANT_PAR_DEFAUT,
        maintenant,
      ),
    ).resolves.toBe(true);
  });

  it('une autre entreprise sans clé ne peut pas encaisser, même avec les variables', async () => {
    const fedapay = client({});
    await expect(
      executerDansTenant('tnt_b', () => fedapay.estConfigure()),
    ).resolves.toBe(false);
    await expect(
      fedapay.verifierSignatureWebhook(
        CORPS,
        signer('wh_env_chapexpress'),
        'tnt_b',
        maintenant,
      ),
    ).resolves.toBe(false);
  });

  it('les clés en base priment, et chaque entreprise a les siennes', async () => {
    const fedapay = client({
      tnt_b: {
        'fedapay.cle_secrete': 'sk_b',
        'fedapay.secret_webhook': 'wh_b',
      },
    });
    await expect(
      fedapay.verifierSignatureWebhook(
        CORPS,
        signer('wh_b'),
        'tnt_b',
        maintenant,
      ),
    ).resolves.toBe(true);
    // B's secret does not sign for CHAP EXPRESS, nor the other way round.
    await expect(
      fedapay.verifierSignatureWebhook(
        CORPS,
        signer('wh_b'),
        TENANT_PAR_DEFAUT,
        maintenant,
      ),
    ).resolves.toBe(false);
    await expect(
      fedapay.verifierSignatureWebhook(
        CORPS,
        signer('wh_env_chapexpress'),
        'tnt_b',
        maintenant,
      ),
    ).resolves.toBe(false);
  });
});
