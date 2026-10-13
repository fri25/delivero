import { describe, expect, it, vi } from 'vitest';
import { ErreurReseau, ErreurServeur, rejouer, statutAtteint, type ActionEnFile } from './rejeu';

function action(id: string, commandeId: string, statut: string): ActionEnFile {
  return {
    id,
    userId: 'u1',
    libelle: id,
    service: 'colis',
    commandeId,
    methode: 'PATCH',
    chemin: `/x/${id}`,
    attendu: { statut },
    creeLe: '2026-10-13T10:00:00Z',
  };
}

const RECUPERE = action('a1', 'c1', 'colis_recupere');
const EN_ROUTE = action('a2', 'c1', 'en_route');
const AUTRE = action('b1', 'c2', 'colis_recupere');

describe('rejouer', () => {
  it('sends every action, in write order', async () => {
    const envoyees: string[] = [];
    const resultat = await rejouer(
      [RECUPERE, EN_ROUTE, AUTRE],
      async (a) => void envoyees.push(a.id),
      async () => false,
    );
    expect(envoyees).toEqual(['a1', 'a2', 'b1']);
    expect(resultat).toEqual({ reussies: ['a1', 'a2', 'b1'], refusees: [], interrompu: false });
  });

  it('stops at the first network failure and keeps the rest for later', async () => {
    const envoyer = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new ErreurReseau());
    const resultat = await rejouer([RECUPERE, EN_ROUTE, AUTRE], envoyer, async () => false);
    expect(resultat).toEqual({ reussies: ['a1'], refusees: [], interrompu: true });
    expect(envoyer).toHaveBeenCalledTimes(2);
  });

  it('treats a server error (5xx) like a network failure', async () => {
    const resultat = await rejouer([RECUPERE], async () => {
      throw new ErreurServeur(503, 'Indisponible');
    }, async () => false);
    expect(resultat.interrompu).toBe(true);
    expect(resultat.refusees).toEqual([]);
  });

  it('counts an action the server already applied as done (answer lost on 3G)', async () => {
    const resultat = await rejouer(
      [RECUPERE],
      async () => {
        throw new ErreurServeur(400, 'Statut incompatible');
      },
      async () => true,
    );
    expect(resultat.reussies).toEqual(['a1']);
  });

  it('flags a refusal and holds back the later actions of the same order only', async () => {
    const envoyer = vi.fn(async (a: ActionEnFile) => {
      if (a.id === 'a1') throw new ErreurServeur(409, 'Course réattribuée');
    });
    const resultat = await rejouer([RECUPERE, EN_ROUTE, AUTRE], envoyer, async () => false);
    expect(resultat.refusees).toEqual([{ id: 'a1', erreur: 'Course réattribuée' }]);
    // a2 depends on a1 (same order): not sent. b1 is another order: sent.
    expect(envoyer.mock.calls.map(([a]) => a.id)).toEqual(['a1', 'b1']);
    expect(resultat.reussies).toEqual(['b1']);
  });

  it('skips actions already flagged as refused, and what follows them', async () => {
    const envoyer = vi.fn(async (_action: ActionEnFile) => undefined);
    await rejouer([{ ...RECUPERE, erreur: 'Code faux' }, EN_ROUTE, AUTRE], envoyer, async () => false);
    expect(envoyer.mock.calls.map(([a]) => a.id)).toEqual(['b1']);
  });
});

describe('statutAtteint', () => {
  it('accepts the target status or any later one', () => {
    expect(statutAtteint('colis', 'colis_recupere', 'colis_recupere')).toBe(true);
    expect(statutAtteint('colis', 'livre', 'en_route')).toBe(true);
    expect(statutAtteint('colis', 'livreur_en_route_enlevement', 'en_route')).toBe(false);
  });

  it('does not treat a dispute as progress', () => {
    expect(statutAtteint('colis', 'litige', 'livre')).toBe(false);
    expect(statutAtteint('colis', 'litige', 'litige')).toBe(true);
  });
});
