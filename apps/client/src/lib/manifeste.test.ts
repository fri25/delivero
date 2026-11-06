import { afterEach, describe, expect, it, vi } from 'vitest';
import { activerManifeste, chargerEntreprise, ENTREPRISE_PAR_DEFAUT } from '@delivero/config/entreprise';

// Étape 10 of docs/plan-migration-multi-tenant.md: another company installs
// the PWA under its own name; CHAP EXPRESS keeps the built manifest.
const API = 'https://api.exemple.bj/api';

describe('manifeste de la PWA', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('suit l’entreprise chargée, sans toucher à celui de CHAP EXPRESS', async () => {
    document.head.innerHTML = '<link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#002050">';
    const lien = () => document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!;

    activerManifeste(API, 'client');
    expect(lien().getAttribute('href')).toBe('/manifest.webmanifest');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...ENTREPRISE_PAR_DEFAUT, slug: 'livraisons-b', nomCommercial: 'Livraisons B', couleurMarine: '#112233' }),
      }),
    );
    await chargerEntreprise(API);

    expect(lien().href).toBe(
      `${API}/tenant/livraisons-b/manifeste/client?origine=${encodeURIComponent(window.location.origin)}`,
    );
    expect(lien().crossOrigin).toBe('anonymous');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#112233');
  });
});
