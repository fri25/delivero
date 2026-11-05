import { randomBytes } from 'node:crypto';
import { chiffrer, dechiffrer } from './secrets-tenant.service';

describe('chiffrement des secrets d’entreprise', () => {
  const cle = randomBytes(32);

  it('retrouve la valeur chiffrée', () => {
    expect(dechiffrer(chiffrer('sk_live_abc', cle), cle)).toBe('sk_live_abc');
  });

  it('ne stocke jamais la valeur en clair, et change à chaque chiffrement', () => {
    const a = chiffrer('sk_live_abc', cle);
    const b = chiffrer('sk_live_abc', cle);
    expect(a).not.toContain('sk_live_abc');
    expect(a).not.toBe(b);
  });

  it('refuse une valeur modifiée', () => {
    const [version, iv, tag, corps] = chiffrer('sk_live_abc', cle).split('.');
    const altere = Buffer.from(corps, 'base64');
    altere[0] ^= 1;
    expect(() =>
      dechiffrer([version, iv, tag, altere.toString('base64')].join('.'), cle),
    ).toThrow();
  });

  it('refuse une autre clé maîtresse', () => {
    expect(() =>
      dechiffrer(chiffrer('sk_live_abc', cle), randomBytes(32)),
    ).toThrow();
  });
});
