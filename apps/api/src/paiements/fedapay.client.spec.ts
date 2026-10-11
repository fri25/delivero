import { createHmac } from 'node:crypto';
import {
  extraireTransaction,
  numeroLocalBenin,
  signatureWebhookValide,
} from './fedapay.client';
import { decouperNom } from './paiements.service';

const SECRET = 'wh_sandbox_test_secret';
const CORPS = '{"name":"transaction.approved","entity":{"id":4242}}';

function signer(timestamp: number, corps = CORPS, secret = SECRET) {
  const hmac = createHmac('sha256', secret)
    .update(`${timestamp}.${corps}`, 'utf8')
    .digest('hex');
  return `t=${timestamp},s=${hmac}`;
}

describe('signatureWebhookValide', () => {
  const maintenant = 1_760_000_000;

  it('accepts a signature computed like fedapay-node', () => {
    expect(
      signatureWebhookValide(CORPS, signer(maintenant), SECRET, maintenant),
    ).toBe(true);
  });

  it('rejects a tampered body', () => {
    const entete = signer(maintenant);
    expect(
      signatureWebhookValide(
        CORPS.replace('4242', '4243'),
        entete,
        SECRET,
        maintenant,
      ),
    ).toBe(false);
  });

  it('rejects another secret', () => {
    expect(
      signatureWebhookValide(
        CORPS,
        signer(maintenant, CORPS, 'autre'),
        SECRET,
        maintenant,
      ),
    ).toBe(false);
  });

  it('rejects a replay outside the 5 minute tolerance', () => {
    expect(
      signatureWebhookValide(
        CORPS,
        signer(maintenant - 301),
        SECRET,
        maintenant,
      ),
    ).toBe(false);
  });

  it('rejects a malformed header', () => {
    expect(signatureWebhookValide(CORPS, 'abc', SECRET, maintenant)).toBe(
      false,
    );
    expect(
      signatureWebhookValide(CORPS, `t=${maintenant}`, SECRET, maintenant),
    ).toBe(false);
  });
});

describe('extraireTransaction', () => {
  it('reads a transaction at the root', () => {
    expect(
      extraireTransaction({ id: 12, status: 'approved', amount: 1500 }),
    ).toEqual({ id: 12, status: 'approved', amount: 1500 });
  });

  it('reads a transaction wrapped under "v1/transaction"', () => {
    expect(
      extraireTransaction({
        'v1/transaction': { id: 13, status: 'pending', amount: 900 },
      }),
    ).toEqual({ id: 13, status: 'pending', amount: 900 });
  });

  it('throws without an id', () => {
    expect(() => extraireTransaction({ status: 'pending' })).toThrow();
  });
});

describe('numeroLocalBenin', () => {
  it('strips the +229 / 00229 prefix and spaces', () => {
    expect(numeroLocalBenin('+2290157866959')).toBe('0157866959');
    expect(numeroLocalBenin('00229 01 57 86 69 59')).toBe('0157866959');
    expect(numeroLocalBenin('0157866959')).toBe('0157866959');
  });
});

describe('decouperNom', () => {
  it('splits first name and the rest', () => {
    expect(decouperNom('Koffi Jean Adjovi')).toEqual({
      prenom: 'Koffi',
      nom: 'Jean Adjovi',
    });
  });

  it('reuses a single name for both fields', () => {
    expect(decouperNom('Awa')).toEqual({ prenom: 'Awa', nom: 'Awa' });
  });
});
